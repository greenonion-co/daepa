import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsWhere,
  Repository,
  EntityManager,
  DataSource,
} from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdoptionDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
  AdoptionSummaryDto,
} from './adoption.dto';
import { PetService } from 'src/pet/pet.service';
import { UserService } from 'src/user/user.service';
import { nanoid } from 'nanoid';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import { PET_SALE_STATUS } from 'src/pet/pet.constants';
import { PetSummaryDto } from 'src/pet/pet.dto';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly petService: PetService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  private generateAdoptionId(): string {
    return `${nanoid(8)}`;
  }

  private toAdoptionSummaryDto(entity: AdoptionEntity): AdoptionSummaryDto {
    const plain = instanceToPlain(entity);
    return plainToInstance(AdoptionSummaryDto, {
      ...plain,
      price: plain.price ? Math.floor(Number(plain.price)) : undefined,
      pet: plain.pet ? plainToInstance(PetSummaryDto, plain.pet) : undefined,
    });
  }

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 확인
      const pet = await this.petService.getPet(createAdoptionDto.petId);
      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      // 펫 소유자 확인
      // if (pet.owner.userId !== sellerId) {
      //   throw new BadRequestException('펫의 소유자가 아닙니다.');
      // }

      // 이미 분양 정보가 있는지 확인
      const existingAdoption = await entityManager.findOne(AdoptionEntity, {
        where: {
          pet_id: createAdoptionDto.petId,
          is_deleted: false,
        },
      });

      if (existingAdoption) {
        throw new BadRequestException('이미 분양 정보가 있습니다.');
      }

      if (createAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          user_id: createAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const adoptionId = this.generateAdoptionId();

      const adoptionEntity = plainToInstance(AdoptionEntity, {
        ...createAdoptionDto,
        adoptionId,
        sellerId,
        buyerId: createAdoptionDto.buyerId,
      });

      const saveAdoptionEntity = await entityManager.save(
        AdoptionEntity,
        adoptionEntity,
      );

      // 펫 상태 업데이트를 트랜잭션 내에서 수행
      if (createAdoptionDto.saleStatus) {
        await entityManager.update(
          'pets',
          { pet_id: createAdoptionDto.petId },
          { sale_status: createAdoptionDto.saleStatus },
        );
      } else {
        if (createAdoptionDto.buyerId) {
          await entityManager.update(
            'pets',
            { pet_id: createAdoptionDto.petId },
            { sale_status: PET_SALE_STATUS.ON_RESERVATION },
          );
        } else {
          await entityManager.update(
            'pets',
            { pet_id: createAdoptionDto.petId },
            { sale_status: PET_SALE_STATUS.ON_SALE },
          );
        }
      }

      // 판매 완료된 경우 펫 삭제
      if (createAdoptionDto.saleStatus === PET_SALE_STATUS.SOLD) {
        await entityManager.update(
          'pets',
          { pet_id: createAdoptionDto.petId },
          { is_deleted: true },
        );
      }

      const adoption = instanceToPlain(saveAdoptionEntity);
      return plainToInstance(AdoptionDto, adoption);
    });
  }

  async findAll(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdoptionSummaryDto>> {
    const queryBuilder = this.adoptionRepository
      .createQueryBuilder('adoptions')
      .leftJoinAndMapOne(
        'adoptions.pet',
        'pets',
        'pets',
        'pets.pet_id = adoptions.pet_id',
      )
      .leftJoinAndMapOne(
        'adoptions.seller',
        'users',
        'seller',
        'seller.user_id = adoptions.seller_id',
      )
      .leftJoinAndMapOne(
        'adoptions.buyer',
        'users',
        'buyer',
        'buyer.user_id = adoptions.buyer_id',
      )
      .where('adoptions.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('adoptions.created_at', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const adoptionEntities = await queryBuilder.getMany();

    const adoptionSummaryDtos = adoptionEntities.map((adoption) =>
      this.toAdoptionSummaryDto(adoption),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return new PageDto(adoptionSummaryDtos, pageMetaDto);
  }

  async findOne(
    where: FindOptionsWhere<AdoptionEntity>,
  ): Promise<AdoptionDto | null> {
    const queryBuilder = this.adoptionRepository
      .createQueryBuilder('adoptions')
      .leftJoinAndMapOne(
        'adoptions.pet',
        'pets',
        'pets',
        'pets.pet_id = adoptions.pet_id',
      )
      .leftJoinAndMapOne(
        'adoptions.seller',
        'users',
        'seller',
        'seller.user_id = adoptions.seller_id',
      )
      .leftJoinAndMapOne(
        'adoptions.buyer',
        'users',
        'buyer',
        'buyer.user_id = adoptions.buyer_id',
      )
      .where('adoptions.is_deleted = :isDeleted', { isDeleted: false });

    // where 조건 추가
    Object.keys(where).forEach((key) => {
      const value = where[key];
      if (value !== undefined) {
        queryBuilder.andWhere(`adoptions.${key} = :${key}`, { [key]: value });
      }
    });

    const adoptionEntity = await queryBuilder.getOne();

    if (!adoptionEntity) {
      return null;
    }

    const adoption = instanceToPlain(adoptionEntity);

    if (adoption.price !== undefined && adoption.price !== null) {
      adoption.price = Math.floor(Number(adoption.price));
    }

    return plainToInstance(AdoptionDto, adoption);
  }

  async findByAdoptionId(adoptionId: string): Promise<AdoptionDto> {
    const adoption = await this.findOne({ adoption_id: adoptionId });

    if (!adoption) {
      throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return adoption;
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const adoptionEntity = await entityManager.findOne(AdoptionEntity, {
        where: { adoption_id: adoptionId, is_deleted: false },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (updateAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          user_id: updateAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      // 기존 Entity에 업데이트할 필드들만 덮어쓰기
      if (updateAdoptionDto.adoptionDate !== undefined) {
        adoptionEntity.adoption_date = new Date(updateAdoptionDto.adoptionDate);
      }
      if (updateAdoptionDto.price !== undefined) {
        adoptionEntity.price = updateAdoptionDto.price;
      }
      if (updateAdoptionDto.buyerId !== undefined) {
        adoptionEntity.buyer_id = updateAdoptionDto.buyerId;
      }
      if (updateAdoptionDto.memo !== undefined) {
        adoptionEntity.memo = updateAdoptionDto.memo;
      }
      if (updateAdoptionDto.location !== undefined) {
        adoptionEntity.location = updateAdoptionDto.location;
      }

      const savedAdoption = await entityManager.save(
        AdoptionEntity,
        adoptionEntity,
      );

      // saleStatus 로직을 트랜잭션 내에서 수행
      if (updateAdoptionDto.saleStatus) {
        await entityManager.update(
          'pets',
          { pet_id: adoptionEntity.pet_id },
          { sale_status: updateAdoptionDto.saleStatus },
        );
      } else {
        if (updateAdoptionDto.buyerId) {
          await entityManager.update(
            'pets',
            { pet_id: adoptionEntity.pet_id },
            { sale_status: PET_SALE_STATUS.ON_RESERVATION },
          );
        } else {
          await entityManager.update(
            'pets',
            { pet_id: adoptionEntity.pet_id },
            { sale_status: PET_SALE_STATUS.ON_SALE },
          );
        }
      }

      if (updateAdoptionDto.saleStatus === PET_SALE_STATUS.SOLD) {
        await entityManager.update(
          'pets',
          { pet_id: adoptionEntity.pet_id },
          { is_deleted: true },
        );
      }

      const adoption = instanceToPlain(savedAdoption);
      return plainToInstance(AdoptionDto, adoption);
    });
  }
}
