import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InquiryEntity, INQUIRY_STATUS } from './inquiry.entity';
import { UserEntity } from '../user/user.entity';
import { FcmService } from '../fcm/fcm.service';
import {
  AdminInquiryDto,
  AnswerInquiryDto,
  CreateInquiryDto,
  InquiryDto,
} from './inquiry.dto';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    @InjectRepository(InquiryEntity)
    private readonly inquiryRepository: Repository<InquiryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly fcmService: FcmService,
  ) {}

  async createInquiry(
    userId: string,
    dto: CreateInquiryDto,
  ): Promise<InquiryDto> {
    const inquiry = await this.inquiryRepository.save(
      this.inquiryRepository.create({
        userId,
        content: dto.content,
        status: INQUIRY_STATUS.PENDING,
        // created_at 을 DB CURRENT_TIMESTAMP(세션 TZ 생성) 대신 앱에서 설정해
        // answered_at(new Date)과 동일한 mysql2 커넥션 TZ 왕복 경로로 통일한다.
        createdAt: new Date(),
      }),
    );

    // Discord 알림은 응답 흐름을 막지 않도록 fire-and-forget (이미 DB 저장 완료).
    void this.notifyDiscord(inquiry);

    return this.toInquiryDto(inquiry);
  }

  async listMyInquiries(userId: string): Promise<InquiryDto[]> {
    const inquiries = await this.inquiryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return inquiries.map((inquiry) => this.toInquiryDto(inquiry));
  }

  async listAllInquiries(): Promise<AdminInquiryDto[]> {
    // 누적 증가 대비 최신 N건으로 제한. 추후 필요 시 cursor 페이지네이션으로 확장.
    const inquiries = await this.inquiryRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const userIds = [...new Set(inquiries.map((i) => i.userId))];
    const users =
      userIds.length > 0
        ? await this.userRepository.find({ where: { userId: In(userIds) } })
        : [];
    const userMap = new Map(users.map((u) => [u.userId, u]));

    return inquiries.map((inquiry) => ({
      ...this.toInquiryDto(inquiry),
      userId: inquiry.userId,
      userName: userMap.get(inquiry.userId)?.name ?? null,
      userEmail: userMap.get(inquiry.userId)?.email ?? null,
    }));
  }

  async answerInquiry(
    id: number,
    adminUserId: string,
    dto: AnswerInquiryDto,
  ): Promise<InquiryDto> {
    const inquiry = await this.inquiryRepository.findOne({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    inquiry.answer = dto.answer;
    inquiry.answeredBy = adminUserId;
    inquiry.answeredAt = new Date();
    inquiry.status = INQUIRY_STATUS.ANSWERED;
    const saved = await this.inquiryRepository.save(inquiry);

    void this.fcmService.sendPushNotification({
      userId: saved.userId,
      title: '1:1 문의 답변이 도착했습니다',
      body: dto.answer,
      data: {
        type: 'INQUIRY_ANSWERED',
        inquiryId: String(saved.id),
        path: '/inquiry',
      },
    });

    return this.toInquiryDto(saved);
  }

  private toInquiryDto(inquiry: InquiryEntity): InquiryDto {
    return {
      id: inquiry.id,
      content: inquiry.content,
      status: inquiry.status,
      answer: inquiry.answer,
      answeredAt: inquiry.answeredAt,
      createdAt: inquiry.createdAt,
    };
  }

  private async notifyDiscord(inquiry: InquiryEntity): Promise<void> {
    const url = this.configService.get<string>('DISCORD_INQUIRY_WEBHOOK_URL');
    if (!url) return;

    const user = await this.userRepository.findOne({
      where: { userId: inquiry.userId },
    });

    const payload = {
      embeds: [
        {
          title: '[1:1 문의] 새 문의가 도착했어요',
          description: inquiry.content,
          color: 0x3b82f6,
          fields: [
            { name: '닉네임', value: user?.name ?? '-', inline: true },
            { name: 'user_id', value: inquiry.userId, inline: true },
            { name: '이메일', value: user?.email ?? '-', inline: false },
            { name: 'inquiry_id', value: String(inquiry.id), inline: true },
          ],
          timestamp: inquiry.createdAt.toISOString(),
        },
      ],
    };

    try {
      await firstValueFrom(this.httpService.post(url, payload));
    } catch (err) {
      this.logger.warn('discord webhook failed', err);
    }
  }
}
