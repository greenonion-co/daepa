import { Body, Controller, Post } from '@nestjs/common';
import { LayingService } from './laying.service';
import { CreateLayingDto } from './laying.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/v1/laying')
export class LayingController {
  constructor(private readonly layingService: LayingService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: '산란 정보 등록이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async createLaying(@Body() createLayingDto: CreateLayingDto) {
    await this.layingService.createLaying(createLayingDto);
    return {
      success: true,
      message: '산란 정보 등록이 완료되었습니다.',
    };
  }
}
