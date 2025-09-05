import { Body, Controller, Post, Patch, Delete, Param } from '@nestjs/common';
import { MatingService } from './mating.service';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CreateMatingDto } from './mating.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';
import { UpdateMatingDto } from './mating.dto';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';

@Controller('/v1/mating')
@BrAccessOnly()
export class MatingController {
  constructor(private readonly matingService: MatingService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 등록이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async createMating(
    @Body() createMatingDto: CreateMatingDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.matingService.saveMating(token.userId, createMatingDto);
    return {
      success: true,
      message: '메이팅 정보 등록이 완료되었습니다.',
    };
  }

  @Patch(':matingId')
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 수정이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async updateMating(
    @Param('matingId') matingId: number,
    @Body() updateMatingDto: UpdateMatingDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.matingService.updateMating(
      token.userId,
      matingId,
      updateMatingDto,
    );
    return {
      success: true,
      message: '메이팅 정보 수정이 완료되었습니다.',
    };
  }

  @Delete(':matingId')
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 삭제가 완료되었습니다.',
    type: CommonResponseDto,
  })
  async deleteMating(
    @Param('matingId') matingId: number,
  ): Promise<CommonResponseDto> {
    await this.matingService.deleteMating(matingId);
    return {
      success: true,
      message: '메이팅 정보 삭제가 완료되었습니다.',
    };
  }
}
