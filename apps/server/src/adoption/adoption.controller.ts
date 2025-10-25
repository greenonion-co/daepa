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
  AdoptionDetailResponseDto,
  AdoptionFilterDto,
} from './adoption.dto';
import { JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { PageMetaDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
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

  @Get()
  @ApiExtraModels(AdoptionDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '분양 전체 리스트 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AdoptionDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getAllAdoptions(
    @Query() pageOptionsDto: AdoptionFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<AdoptionDto>> {
    return this.adoptionService.findAll(pageOptionsDto, token.userId);
  }

  @Get('/:petId')
  @ApiResponse({
    status: 200,
    description: '펫별 분양 정보 조회 성공',
    type: AdoptionDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '분양 정보를 찾을 수 없음',
  })
  async getAdoptionByPetId(
    @Param('petId') petId: string,
  ): Promise<AdoptionDetailResponseDto> {
    const data = await this.adoptionService.findOne({ petId });
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
