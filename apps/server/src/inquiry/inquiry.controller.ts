import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto, InquiryDto } from './inquiry.dto';

@ApiTags('Inquiry')
@Controller('/v1/inquiry')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  @ApiOperation({ summary: '1:1 문의 등록' })
  @ApiResponse({ status: 201, type: InquiryDto })
  async create(
    @JwtUser() user: JwtUserPayload,
    @Body() dto: CreateInquiryDto,
  ): Promise<InquiryDto> {
    return this.inquiryService.createInquiry(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 1:1 문의 내역 조회' })
  @ApiResponse({ status: 200, type: [InquiryDto] })
  async listMine(@JwtUser() user: JwtUserPayload): Promise<InquiryDto[]> {
    return this.inquiryService.listMyInquiries(user.userId);
  }
}
