import { Body, Controller, Get, Post } from '@nestjs/common';
import { MatingService } from './mating.service';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CreateMatingDto, MatingBaseDto } from './mating.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/v1/mating')
export class MatingController {
  constructor(private readonly matingService: MatingService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 조회가 완료되었습니다.',
    type: [MatingBaseDto],
  })
  async findAll(@JwtUser() token: JwtUserPayload) {
    return await this.matingService.findAll(token.userId);
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 등록이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async createMating(
    @Body() createMatingDto: CreateMatingDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.matingService.saveMating(token.userId, createMatingDto);
    return {
      success: true,
      message: '메이팅 정보 등록이 완료되었습니다.',
    };
  }
}
