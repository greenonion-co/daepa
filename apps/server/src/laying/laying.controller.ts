import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { LayingService } from './laying.service';
import { CreateLayingDto, UpdateLayingDto } from './laying.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CommonResponseDto } from 'src/common/response.dto';

@ApiTags('산란')
@Controller('v1/layings')
@UseGuards(JwtAuthGuard)
export class LayingController {
  constructor(private readonly layingService: LayingService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '산란 정보가 성공적으로 추가되었습니다.',
    type: CommonResponseDto,
  })
  async create(
    @Body() createLayingDto: CreateLayingDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.layingService.createLaying(createLayingDto, token.userId);
    return {
      success: true,
      message: '산란 정보가 성공적으로 추가되었습니다.',
    };
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: '산란 정보가 성공적으로 수정되었습니다.',
    type: CommonResponseDto,
  })
  async update(
    @Param('id') id: number,
    @Body() updateLayingDto: UpdateLayingDto,
  ) {
    await this.layingService.updateLaying(id, updateLayingDto);
    return {
      success: true,
      message: '산란 정보가 성공적으로 수정되었습니다.',
    };
  }
}
