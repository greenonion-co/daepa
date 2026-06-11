import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ANNOUNCEMENT_STATUS } from './announcement.entity';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '공지 제목', example: '서비스 점검 안내' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255) // announcements.title VARCHAR(255)
  title: string;

  @ApiProperty({
    description: '공지 내용',
    example: '6월 8일 02:00~04:00 점검이 예정되어 있습니다.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // FCM payload(4KB) 안전 경계
  body: string;

  @ApiProperty({
    description: '알림 클릭 시 이동 경로',
    required: false,
    example: '/notice/1',
  })
  @IsString()
  @IsOptional()
  path?: string;
}

export class TestAnnouncementDto extends CreateAnnouncementDto {
  @ApiProperty({
    description: '발송 대상 userId. 생략 시 요청한 관리자 본인에게 발송.',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetUserId?: string;
}

export class TestAnnouncementResponseDto {
  @ApiProperty({ description: '발송 대상 토큰 수' })
  targetCount: number;

  @ApiProperty({ description: '성공 토큰 수' })
  successCount: number;

  @ApiProperty({ description: '실패 토큰 수' })
  failureCount: number;

  @ApiProperty({
    description: 'FCM 에러 코드별 실패 토큰 수',
    example: { 'messaging/registration-token-not-registered': 2 },
  })
  failuresByCode: Record<string, number>;
}

export class CreateAnnouncementResponseDto {
  @ApiProperty({ description: '생성된 공지 ID' })
  id: number;

  @ApiProperty({ description: '발송 상태', enum: ANNOUNCEMENT_STATUS })
  status: ANNOUNCEMENT_STATUS;

  @ApiProperty({ description: '안내 메시지' })
  message: string;
}
