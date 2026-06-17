import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from 'src/user/user.constant';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { InquiryService } from '../inquiry.service';
import { AdminInquiryDto, AnswerInquiryDto, InquiryDto } from '../inquiry.dto';

@ApiTags('Admin Inquiry')
@Controller('/v1/admin/inquiry')
@Roles(USER_ROLE.ADMIN)
@UseGuards(RolesGuard)
export class AdminInquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  @ApiOperation({ summary: '전체 1:1 문의 목록 조회 (관리자 전용)' })
  @ApiResponse({ status: 200, type: [AdminInquiryDto] })
  @ApiResponse({ status: 403, description: '관리자 권한이 필요합니다.' })
  async listAll(): Promise<AdminInquiryDto[]> {
    return this.inquiryService.listAllInquiries();
  }

  @Post(':id/answer')
  @ApiOperation({ summary: '1:1 문의 답변 등록 (관리자 전용)' })
  @ApiResponse({ status: 201, type: InquiryDto })
  @ApiResponse({ status: 403, description: '관리자 권한이 필요합니다.' })
  async answer(
    @JwtUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnswerInquiryDto,
  ): Promise<InquiryDto> {
    return this.inquiryService.answerInquiry(id, user.userId, dto);
  }
}
