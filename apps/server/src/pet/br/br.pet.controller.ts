import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { PetService } from '../pet.service';
import { PageMetaDto, PageOptionsDto, PageDto } from 'src/common/page.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PetDto } from '../pet.dto';
import { ApiExtraModels } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';

// TODO: UseGuard를 사용하여 breeder 검증
@Controller('/v1/br/pet')
@UseInterceptors(ExcludeNilInterceptor)
export class BrPetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @ApiExtraModels(PetDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: 'BR룸 펫 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PetDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<PetDto>> {
    return this.petService.getPetListFull(pageOptionsDto, token.userId);
  }
}
