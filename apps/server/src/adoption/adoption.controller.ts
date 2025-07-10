import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdoptionService } from './adoption.service';
import {
  CreateAdoptionDto,
  UpdateAdoptionDto,
  AdoptionDto,
  AdoptionSummaryDto,
} from './adoption.dto';
import { JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { PageOptionsDto } from 'src/common/page.dto';
import { CommonResponseDto } from '../common/response.dto';
import { PageDto } from 'src/common/page.dto';

@ApiTags('분양')
@Controller('/v1/adoption')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '분양 정보 생성 성공',
    type: AdoptionDto,
  })
  async createAdoption(
    @JwtUser() token: JwtUserPayload,
    @Body() createAdoptionDto: CreateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.adoptionService.createAdoption(token.userId, createAdoptionDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: '분양 전체 리스트 조회 성공',
    type: [AdoptionSummaryDto],
  })
  async getAllAdoptions(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdoptionSummaryDto>> {
    return this.adoptionService.findAll(pageOptionsDto);
  }

  @Get('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '펫별 분양 정보 조회 성공',
    type: AdoptionDto,
  })
  async getAdoptionByAdoptionId(
    @Param('adoptionId') adoptionId: string,
  ): Promise<AdoptionDto | null> {
    return this.adoptionService.findByAdoptionId(adoptionId);
  }

  @Put('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '분양 정보 수정 성공',
    type: AdoptionDto,
  })
  async updateAdoption(
    @Param('adoptionId') adoptionId: string,
    @Body() updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.adoptionService.updateAdoption(adoptionId, updateAdoptionDto);
  }

  @Put('/:adoptionId/confirm')
  @ApiResponse({
    status: 200,
    description: '분양 확정 성공',
    type: AdoptionDto,
  })
  async confirmAdoption(
    @Param('adoptionId') adoptionId: string,
    @Body() body: { buyerId: string },
  ): Promise<AdoptionDto> {
    return this.adoptionService.confirmAdoption(adoptionId, body.buyerId);
  }

  @Put('/:adoptionId/complete')
  @ApiResponse({
    status: 200,
    description: '분양 완료 성공',
    type: AdoptionDto,
  })
  async completeAdoption(
    @Param('adoptionId') adoptionId: string,
  ): Promise<AdoptionDto> {
    return this.adoptionService.completeAdoption(adoptionId);
  }

  @Put('/:adoptionId/cancel')
  @ApiResponse({
    status: 200,
    description: '분양 취소 성공',
    type: AdoptionDto,
  })
  async cancelAdoption(
    @Param('adoptionId') adoptionId: string,
  ): Promise<AdoptionDto> {
    return this.adoptionService.cancelAdoption(adoptionId);
  }

  @Delete('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '분양 정보 삭제 성공',
    type: CommonResponseDto,
  })
  async deleteAdoption(
    @Param('adoptionId') adoptionId: string,
  ): Promise<CommonResponseDto> {
    await this.adoptionService.deleteAdoption(adoptionId);
    return {
      success: true,
      message: '분양 정보가 삭제되었습니다.',
    };
  }
}
