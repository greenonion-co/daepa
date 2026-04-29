import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { AuctionEntity } from './auction.entity';
import { AuctionBidEntity } from './auction_bid.entity';
import {
  AUCTION_STATUS,
  MAX_AUCTION_LENGTH_MS,
  MAX_EXTENSION_MINUTES,
  MIN_AUCTION_LENGTH_MS,
  MIN_EXTENSION_MINUTES,
  MIN_BID_INCREMENT,
} from './auction.constants';
import {
  CreateAuctionDto,
  AuctionStateDto,
  MyAuctionItemDto,
  BidHistoryItemDto,
} from './auction.dto';
import { PetEntity } from '../pet/pet.entity';
import { UserEntity } from '../user/user.entity';
import { AuctionStateService } from './auction-state.service';

const SHARE_TOKEN_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const newShareToken = customAlphabet(SHARE_TOKEN_ALPHABET, 22);
const newAuctionId = customAlphabet(SHARE_TOKEN_ALPHABET, 22);

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(AuctionEntity)
    private readonly auctionRepo: Repository<AuctionEntity>,
    @InjectRepository(AuctionBidEntity)
    private readonly bidRepo: Repository<AuctionBidEntity>,
    private readonly dataSource: DataSource,
    private readonly stateService: AuctionStateService,
  ) {}

  // ── helpers ──

  async findByShareTokenOrThrow(shareToken: string): Promise<AuctionEntity> {
    const auction = await this.auctionRepo.findOne({ where: { shareToken } });
    if (!auction) throw new NotFoundException('AUCTION_NOT_FOUND');
    return auction;
  }

  async findByAuctionIdOrThrow(auctionId: string): Promise<AuctionEntity> {
    const auction = await this.auctionRepo.findOne({ where: { auctionId } });
    if (!auction) throw new NotFoundException('AUCTION_NOT_FOUND');
    return auction;
  }

  async findById(id: number): Promise<AuctionEntity | null> {
    return this.auctionRepo.findOne({ where: { id } });
  }

  // ── create ──

  async create(
    userId: string,
    dto: CreateAuctionDto,
  ): Promise<{ auctionId: string; shareToken: string }> {
    // 1. 시간 검증 + 분 정시 정렬
    // 시작/종료 시각을 항상 분 정시(HH:MM:00)로 floor — 입찰자가 초 단위 마감 경쟁을
    // 하지 않도록 보장. UI 는 datetime-local 의 step=60 으로 분 단위만 받지만,
    // API 직접 호출 등 우회 경로에 대비해 서버에서 강제 정렬.
    const rawStartMs = new Date(dto.startTime).getTime();
    const rawEndMs = new Date(dto.endTime).getTime();
    const nowMs = Date.now();

    if (!Number.isFinite(rawStartMs) || !Number.isFinite(rawEndMs)) {
      throw new BadRequestException('INVALID_TIME');
    }

    const alignToMinute = (ms: number) => Math.floor(ms / 60_000) * 60_000;
    const startMs = alignToMinute(rawStartMs);
    const endMs = alignToMinute(rawEndMs);

    if (endMs <= startMs) {
      throw new BadRequestException('END_BEFORE_START');
    }
    if (endMs - startMs < MIN_AUCTION_LENGTH_MS) {
      throw new BadRequestException('AUCTION_TOO_SHORT');
    }
    if (endMs - startMs > MAX_AUCTION_LENGTH_MS) {
      throw new BadRequestException('AUCTION_TOO_LONG');
    }
    if (startMs < nowMs - 60_000) {
      throw new BadRequestException('START_TIME_IN_PAST');
    }

    if (
      dto.extensionMinutes < MIN_EXTENSION_MINUTES ||
      dto.extensionMinutes > MAX_EXTENSION_MINUTES
    ) {
      throw new BadRequestException('INVALID_EXTENSION_MINUTES');
    }

    const winMs = dto.extensionMinutes * 60 * 1000;
    if (winMs * 2 >= endMs - startMs) {
      throw new BadRequestException('EXTENSION_WINDOW_TOO_WIDE');
    }

    if (dto.minIncrement < MIN_BID_INCREMENT) {
      throw new BadRequestException('MIN_INCREMENT_TOO_LOW');
    }
    if (dto.startingPrice < 0) {
      throw new BadRequestException('STARTING_PRICE_NEGATIVE');
    }

    // 2. 트랜잭션 내에서 펫 검증 + 중복 체크 + insert
    const auction = await this.dataSource.transaction(async (em) => {
      const pet = await em.findOne(PetEntity, {
        where: { petId: dto.petId, isDeleted: false },
      });
      if (!pet) throw new NotFoundException('PET_NOT_FOUND');
      if (pet.ownerId !== userId) throw new ForbiddenException('NOT_OWNER');

      const existing = await em.findOne(AuctionEntity, {
        where: [
          { petId: dto.petId, status: AUCTION_STATUS.PENDING },
          { petId: dto.petId, status: AUCTION_STATUS.ACTIVE },
        ],
      });
      if (existing) {
        throw new ConflictException('AUCTION_ALREADY_EXISTS');
      }

      const entity = new AuctionEntity();
      entity.auctionId = newAuctionId();
      entity.petId = dto.petId;
      entity.hostUserId = userId;
      entity.shareToken = newShareToken();
      entity.status = AUCTION_STATUS.PENDING;
      entity.startingPrice = dto.startingPrice;
      entity.minIncrement = dto.minIncrement;
      entity.extensionMinutes = dto.extensionMinutes;
      entity.startTime = new Date(startMs);
      entity.originalEndTime = new Date(endMs);
      entity.currentEndTime = new Date(endMs);

      return em.save(AuctionEntity, entity);
    });

    // 3. Redis 상태 동기화
    await this.stateService.hydrate(auction);

    return { auctionId: auction.auctionId, shareToken: auction.shareToken };
  }

  // ── cancel ──

  async cancelByHost(shareToken: string, userId: string): Promise<void> {
    const auction = await this.dataSource.transaction(async (em) => {
      const a = await em.findOne(AuctionEntity, { where: { shareToken } });
      if (!a) throw new NotFoundException('AUCTION_NOT_FOUND');
      if (a.hostUserId !== userId) throw new ForbiddenException('NOT_HOST');
      if (
        a.status !== AUCTION_STATUS.PENDING &&
        a.status !== AUCTION_STATUS.ACTIVE
      ) {
        // 이미 종료/취소된 경매는 다시 취소 불가
        throw new BadRequestException('CANNOT_CANCEL_TERMINAL');
      }
      a.status = AUCTION_STATUS.CANCELED;
      await em.save(AuctionEntity, a);

      await this.stateService.setStatus(a.id, AUCTION_STATUS.CANCELED);
      return a;
    });

    // 트랜잭션 커밋 후 broadcast — 입찰자/관전자에게 즉시 안내.
    // BullMQ 의 finalize 잡은 그대로 두어도 finalize 시 status === CANCELED 분기로 skip.
    await this.stateService.publishUpdate(auction.id, 'AUCTION_CANCELED', {
      auctionId: auction.auctionId,
      shareToken: auction.shareToken,
    });
  }

  // ── live state ──

  async getLiveState(auction: AuctionEntity): Promise<AuctionStateDto> {
    return this.stateService.toLiveStateDto(auction);
  }

  // ── my auctions ──

  async getMyAuctions(userId: string): Promise<MyAuctionItemDto[]> {
    const list = await this.auctionRepo.find({
      where: { hostUserId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return Promise.all(
      list.map(async (a) => {
        const raw = await this.stateService.getRawState(a.id);
        return {
          auctionId: a.auctionId,
          shareToken: a.shareToken,
          petId: a.petId,
          status: a.status,
          startTimeMs: a.startTime.getTime(),
          currentEndTimeMs: raw?.current_end_time_ms
            ? Number(raw.current_end_time_ms)
            : a.currentEndTime.getTime(),
          startingPrice: Number(a.startingPrice),
          highestBid: raw?.highest_bid ? Number(raw.highest_bid) : null,
          finalPrice: a.finalPrice ? Number(a.finalPrice) : null,
        };
      }),
    );
  }

  // ── bid history ──

  async getBidHistory(
    auctionId: string,
    cursor?: string,
    limit = 50,
  ): Promise<{ items: BidHistoryItemDto[]; nextCursor: string | null }> {
    const auction = await this.findByAuctionIdOrThrow(auctionId);

    const where = cursor
      ? { auctionId: auction.id, serverTsMs: LessThan(Number(cursor)) }
      : { auctionId: auction.id };

    const rows = await this.bidRepo.find({
      where,
      order: { serverTsMs: 'DESC' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;

    // 입찰자 nickname을 join으로 조회
    const bidderIds = Array.from(new Set(sliced.map((r) => r.bidderUserId)));
    const users = bidderIds.length
      ? await this.dataSource.getRepository(UserEntity).find({
          where: { userId: In(bidderIds) },
          select: ['userId', 'name'],
        })
      : [];
    const nameById = new Map(users.map((u) => [u.userId, u.name]));

    const items: BidHistoryItemDto[] = sliced.map((r) => ({
      bidderUserId: r.bidderUserId,
      bidderNickname: nameById.get(r.bidderUserId) ?? null,
      amount: Number(r.amount),
      serverTsMs: Number(r.serverTsMs),
      triggeredExtension: r.triggeredExtension === 1,
    }));

    const nextCursor = hasMore
      ? String(sliced[sliced.length - 1].serverTsMs)
      : null;

    return { items, nextCursor };
  }

  // ── status transitions ──

  async markActive(auctionId: number): Promise<AuctionEntity | null> {
    const auction = await this.auctionRepo.findOne({
      where: { id: auctionId },
    });
    if (!auction) return null;
    if (auction.status !== AUCTION_STATUS.PENDING) return auction;
    auction.status = AUCTION_STATUS.ACTIVE;
    await this.auctionRepo.save(auction);
    await this.stateService.setStatus(auction.id, AUCTION_STATUS.ACTIVE);
    return auction;
  }

  async markEnded(
    auctionId: number,
    winner: { userId: string; price: number; bidId?: number } | null,
    currentEndTimeMs: number,
  ): Promise<AuctionEntity | null> {
    return this.dataSource.transaction(async (em) => {
      const auction = await em.findOne(AuctionEntity, {
        where: { id: auctionId },
      });
      if (!auction) return null;
      if (
        auction.status === AUCTION_STATUS.ENDED ||
        auction.status === AUCTION_STATUS.CANCELED
      ) {
        return auction;
      }

      auction.status = AUCTION_STATUS.ENDED;
      auction.currentEndTime = new Date(currentEndTimeMs);
      if (winner) {
        auction.finalPrice = winner.price;
        auction.winnerUserId = winner.userId;
        auction.winnerBidId = winner.bidId ?? null;
      } else {
        auction.finalPrice = null;
        auction.winnerUserId = null;
        auction.winnerBidId = null;
      }
      await em.save(AuctionEntity, auction);
      return auction;
    });
  }
}
