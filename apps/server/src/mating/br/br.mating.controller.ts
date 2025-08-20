import { Controller, Get, Query } from '@nestjs/common';
import { PageMetaDto, PageDto, PageOptionsDto } from 'src/common/page.dto';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { MatingService } from '../mating.service';
import { MatingByParentsDto } from '../mating.dto';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';

@Controller('/v1/br/mating')
@BrAccessOnly()
export class BrMatingController {
  constructor(private readonly matingService: MatingService) {}

  @Get()
  @ApiExtraModels(MatingByParentsDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: 'BR룸 메이팅 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(MatingByParentsDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<MatingByParentsDto>> {
    return this.matingService.getMatingListFull(pageOptionsDto, token.userId);
  }
}
