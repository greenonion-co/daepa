import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  Post,
  Delete,
} from '@nestjs/common';
import { ParentRequestService } from './parent_request.service';
import { CreateParentDto, UpdateParentRequestDto } from './parent_request.dto';
import { JwtAuthGuard, JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { UnlinkParentDto } from 'src/pet/pet.dto';

@Controller('v1/parent-requests')
@UseGuards(JwtAuthGuard)
export class ParentRequestController {
  constructor(private readonly parentRequestService: ParentRequestService) {}

  @Post(':petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '부모 연동 요청이 완료되었습니다.',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '펫의 소유자가 아닙니다.',
  })
  @ApiResponse({
    status: 404,
    description: '부모로 지정된 펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '아버지로 지정된 펫은 수컷이어야 합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '어머니로 지정된 펫은 암컷이어야 합니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 해당 역할의 부모가 연동되어 있습니다.',
  })
  async linkParent(
    @Param('petId') petId: string,
    @Body() createParentDto: CreateParentDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.parentRequestService.linkParent(
      petId,
      token.userId,
      createParentDto,
    );

    return {
      success: true,
      message: '부모 연동 요청이 완료되었습니다.',
    };
  }

  @Delete(':petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '부모 연동 해제가 완료되었습니다.',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '펫의 소유자가 아닙니다.',
  })
  @ApiResponse({
    status: 404,
    description: '해당 부모 관계를 찾을 수 없습니다.',
  })
  async unlinkParent(
    @Param('petId') petId: string,
    @Body() unlinkParentDto: UnlinkParentDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.parentRequestService.unlinkParent(
      petId,
      token.userId,
      unlinkParentDto,
    );

    return {
      success: true,
      message: '부모 연동 해제가 완료되었습니다.',
    };
  }

  @Put(':id/status')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    type: CommonResponseDto,
  })
  async updateStatus(
    @Param('id') notificationId: number,
    @Body() updateParentRequestDto: UpdateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
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
}
