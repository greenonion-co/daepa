import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ParentRequestService } from './parent_request.service';
import {
  CreateParentRequestDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { JwtAuthGuard, JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { ParentRequestEntity } from './parent_request.entity';

@Controller('parent-requests')
@UseGuards(JwtAuthGuard)
export class ParentRequestController {
  constructor(private readonly parentRequestService: ParentRequestService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태 업데이트 성공',
    type: CommonResponseDto,
  })
  async createParentRequest(
    @Body() createParentRequestDto: CreateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    // 요청자 ID를 현재 로그인한 사용자로 설정
    createParentRequestDto.requesterId = token.userId;
    await this.parentRequestService.createParentRequest(createParentRequestDto);
    return {
      success: true,
      message: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    };
  }

  @Get('pending/:userId')
  @ApiResponse({
    status: 200,
    description: '유저의 부모 요청 목록을 성공적으로 조회했습니다.',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ParentRequestEntity) },
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getPendingRequests(@Param('userId') userId: string) {
    const parentRequests =
      await this.parentRequestService.findPendingRequestsByReceiverId(userId);
    return {
      success: true,
      message: '부모 요청 목록을 성공적으로 조회했습니다.',
      data: parentRequests,
    };
  }

  @Get('sent/:userId')
  @ApiResponse({
    status: 200,
    description: '유저의 부모 요청 목록을 성공적으로 조회했습니다.',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ParentRequestEntity) },
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getSentRequests(@Param('userId') userId: string) {
    const parentRequests =
      await this.parentRequestService.findRequestsByRequesterId(userId);
    return {
      success: true,
      message: '부모 요청 목록을 성공적으로 조회했습니다.',
      data: parentRequests,
    };
  }

  @Put(':notificationId/status')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    type: CommonResponseDto,
  })
  async updateStatus(
    @Param('notificationId') notificationId: number,
    @Body() updateParentRequestDto: UpdateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.parentRequestService.updateParentRequestByNotificationId(
      token.userId,
      notificationId,
      updateParentRequestDto,
    );

    return {
      success: true,
      message: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    };
  }

  @Put(':id/approve')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 승인되었습니다.',
    type: CommonResponseDto,
  })
  async approveRequest(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.parentRequestService.approveParentRequest(id, token.userId);
    return {
      success: true,
      message: '부모 관계 상태가 승인되었습니다.',
    };
  }

  @Put(':id/reject')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 거절되었습니다.',
    type: CommonResponseDto,
  })
  async rejectRequest(
    @Param('id') id: number,
    @Body() body: { reason?: string },
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.parentRequestService.rejectParentRequest(
      id,
      token.userId,
      body.reason,
    );
    return {
      success: true,
      message: '부모 관계 상태가 거절되었습니다.',
    };
  }

  @Delete(':id/cancel')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 취소되었습니다.',
    type: CommonResponseDto,
  })
  async cancelRequest(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.parentRequestService.cancelParentRequest(id, token.userId);
    return {
      success: true,
      message: '부모 관계 상태가 취소되었습니다.',
    };
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태를 성공적으로 조회했습니다.',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ParentRequestEntity) },
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getRequestById(@Param('id') id: number) {
    const parentRequest = await this.parentRequestService.findById(id);
    return {
      success: true,
      message: '부모 관계 상태를 성공적으로 조회했습니다.',
      data: parentRequest,
    };
  }
}
