import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth.decorator';
import { CreatePairDto } from './pair.dto';
import { PairService } from './pair.service';
import { CommonResponseDto } from 'src/common/response.dto';

@ApiTags('펫 쌍')
@Controller('v1/pairs')
@UseGuards(JwtAuthGuard)
export class PairController {
  constructor(private readonly pairService: PairService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '정보가 성공적으로 추가되었습니다.',
    type: CommonResponseDto,
  })
  async create(@Body() createPairDto: CreatePairDto) {
    await this.pairService.createPair(createPairDto);
    return {
      success: true,
      message: '펫 쌍 정보가 성공적으로 추가되었습니다.',
    };
  }
}
