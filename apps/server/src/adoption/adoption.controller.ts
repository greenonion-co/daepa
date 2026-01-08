import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdoptionService } from './adoption.service';
import {
  UpdateAdoptionDto,
  AdoptionDetailResponseDto,
  CreateAdoptionDto,
} from './adoption.dto';
import {
  JwtUser,
  OptionalJwtUser,
  Public,
  OptionalJwtAuthGuard,
} from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { UseGuards } from '@nestjs/common';
import { CommonResponseDto } from 'src/common/response.dto';

@ApiTags('분양')
@Controller('/v1/adoption')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '분양 정보 생성 성공',
    type: CommonResponseDto,
  })
  async createAdoption(
    @Body() createAdoptionDto: CreateAdoptionDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.adoptionService.createAdoption(token.userId, createAdoptionDto);
    return {
      success: true,
      message: '분양 정보 생성 성공',
    };
  }

  @Get('/by-pet/:petId')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: '비활성 상태의 분양 정보도 포함할지 여부',
    type: String,
    example: 'true',
  })
  @ApiResponse({
    status: 200,
    description: '펫별 분양 정보 조회 성공 (없으면 data가 null)',
    type: AdoptionDetailResponseDto,
  })
  async getAdoptionByPetId(
    @Param('petId') petId: string,
    @OptionalJwtUser() token: JwtUserPayload | null,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<AdoptionDetailResponseDto> {
    const data = await this.adoptionService.findOne(
      includeInactive === 'true' ? { petId } : { petId, isActive: true },
      token?.userId,
    );
    return {
      success: true,
      message: '펫별 분양 정보 조회 성공',
      data,
    };
  }

  @Patch('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '분양 정보 수정 성공',
    type: CommonResponseDto,
  })
  async update(
    @Param('adoptionId') adoptionId: string,
    @Body() updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<CommonResponseDto> {
    await this.adoptionService.updateAdoption(adoptionId, updateAdoptionDto);
    return {
      success: true,
      message: '분양 정보 수정 성공',
    };
  }
}
