import { Controller, Get, Body, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PetAdoptionService } from './pet_adoption.service';
import {
  UpdateAdoptionDto,
  AdoptionDetailResponseDto,
  CreateAdoptionDto,
} from './pet_adoption.dto';
import {
  JwtUser,
  OptionalJwtUser,
  Public,
  OptionalJwtAuthGuard,
} from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { UseGuards } from '@nestjs/common';
import { CommonResponseDto } from 'src/common/response.dto';

@ApiTags('개체 분양 정보')
@Controller('/v1/pet-adoption')
export class PetAdoptionController {
  constructor(private readonly petAdoptionService: PetAdoptionService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '분양 정보 생성 성공',
    type: CommonResponseDto,
  })
  async createPetAdoption(
    @Body() createAdoptionDto: CreateAdoptionDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petAdoptionService.createAdoption(
      token.userId,
      createAdoptionDto,
    );
    return {
      success: true,
      message: '분양 정보 생성 성공',
    };
  }

  @Get('/:petId')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: '펫별 분양 정보 조회 성공 (없으면 data가 null)',
    type: AdoptionDetailResponseDto,
  })
  async getPetAdoption(
    @Param('petId') petId: string,
    @OptionalJwtUser() token: JwtUserPayload | null,
  ): Promise<AdoptionDetailResponseDto> {
    const data = await this.petAdoptionService.findOne(petId, token?.userId);
    return {
      success: true,
      message: '펫별 분양 정보 조회 성공',
      data,
    };
  }

  @Patch('/:petId')
  @ApiResponse({
    status: 200,
    description: '분양 정보 수정 성공',
    type: CommonResponseDto,
  })
  async updatePetAdoption(
    @Param('petId') petId: string,
    @Body() updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<CommonResponseDto> {
    await this.petAdoptionService.updateAdoption(petId, updateAdoptionDto);
    return {
      success: true,
      message: '분양 정보 수정 성공',
    };
  }
}
