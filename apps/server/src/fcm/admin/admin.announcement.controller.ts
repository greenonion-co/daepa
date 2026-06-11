import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from 'src/user/user.constant';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { AnnouncementService } from '../announcement.service';
import {
  CreateAnnouncementDto,
  CreateAnnouncementResponseDto,
  TestAnnouncementDto,
  TestAnnouncementResponseDto,
} from '../announcement.dto';

@ApiTags('Admin Announcement')
@Controller('/v1/admin/announcement')
@Roles(USER_ROLE.ADMIN)
@UseGuards(RolesGuard)
export class AdminAnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @ApiOperation({
    summary: '전체 사용자에게 공지 푸시 발송 (관리자 전용)',
    description:
      '활성 FCM 토큰을 가진 모든 사용자에게 공지를 발송한다. 발송은 백그라운드에서 처리되며 즉시 응답한다.',
  })
  @ApiResponse({ status: 201, type: CreateAnnouncementResponseDto })
  @ApiResponse({ status: 403, description: '관리자 권한이 필요합니다.' })
  async createAnnouncement(
    @JwtUser() user: JwtUserPayload,
    @Body() dto: CreateAnnouncementDto,
  ): Promise<CreateAnnouncementResponseDto> {
    const announcement = await this.announcementService.createAndBroadcast(
      dto,
      user.userId,
    );

    return {
      id: announcement.id,
      status: announcement.status,
      message: '공지 발송이 시작되었습니다.',
    };
  }

  @Post('test')
  @ApiOperation({
    summary: '공지 푸시 테스트 발송 (특정 유저에게만)',
    description:
      'broadcast 와 동일한 멀티캐스트 발송 로직을 공유하되, targetUserId(생략 시 관리자 본인)의 활성 토큰에만 전송한다. 이력은 저장하지 않으며 발송 결과를 동기 반환한다.',
  })
  @ApiResponse({ status: 201, type: TestAnnouncementResponseDto })
  @ApiResponse({ status: 403, description: '관리자 권한이 필요합니다.' })
  async sendTestAnnouncement(
    @JwtUser() user: JwtUserPayload,
    @Body() dto: TestAnnouncementDto,
  ): Promise<TestAnnouncementResponseDto> {
    return this.announcementService.sendTest(dto, user.userId);
  }
}
