import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePairDto } from './pair.dto';
import { PairService } from './pair.service';
import { CommonResponseDto } from 'src/common/response.dto';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';

@ApiTags('펫 쌍')
@Controller('v1/pairs')
@BrAccessOnly()
export class PairController {
  constructor(private readonly pairService: PairService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '정보가 성공적으로 추가되었습니다.',
    type: CommonResponseDto,
  })
  async create(
    @Body() createPairDto: CreatePairDto,
  ): Promise<CommonResponseDto> {
    await this.pairService.createPair(createPairDto);
    return {
      success: true,
      message: '펫 쌍 정보가 성공적으로 추가되었습니다.',
    };
  }
}
