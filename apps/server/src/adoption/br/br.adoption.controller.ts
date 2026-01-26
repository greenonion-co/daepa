import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PageMetaDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import { JwtUser } from '../../auth/auth.decorator';
import { AdoptionService } from '../adoption.service';
import { AdoptionDto, AdoptionFilterDto } from '../adoption.dto';
import { JwtUserPayload } from '../../auth/strategies/jwt.strategy';

@Controller('/v1/br/adoption')
export class BrAdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

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
}
