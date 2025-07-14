import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AdoptionService } from './adoption.service';
import {
  CreateAdoptionDto,
  UpdateAdoptionDto,
  AdoptionDto,
  AdoptionSummaryDto,
} from './adoption.dto';
import { JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
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
  @ApiExtraModels(AdoptionSummaryDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '분양 전체 리스트 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AdoptionSummaryDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
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
  @ApiResponse({
    status: 404,
    description: '분양 정보를 찾을 수 없음',
  })
  async getAdoptionByAdoptionId(
    @Param('adoptionId') adoptionId: string,
  ): Promise<AdoptionDto> {
    return this.adoptionService.findByAdoptionId(adoptionId);
  }

  @Patch('/:adoptionId')
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
}
