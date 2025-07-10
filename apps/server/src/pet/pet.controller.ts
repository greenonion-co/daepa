import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CreatePetDto, PetDto, PetSummaryDto, UpdatePetDto } from './pet.dto';
import { PetService } from './pet.service';
import { PageOptionsDto, PageDto, PageMetaDto } from 'src/common/page.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { CommonResponseDto } from 'src/common/response.dto';
import { ParentWithChildrenDto } from './pet.dto';

@Controller('/v1/pet')
@UseInterceptors(ExcludeNilInterceptor)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @ApiExtraModels(PetSummaryDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '펫 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PetSummaryDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetSummaryDto>> {
    return await this.petService.getPetListSummary(pageOptionsDto);
  }

  @Get('children')
  @ApiExtraModels(ParentWithChildrenDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '자식이 있는 개체 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ParentWithChildrenDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getPetsWithChildren(@Query() pageOptionsDto: PageOptionsDto) {
    return await this.petService.getPetsWithChildren(pageOptionsDto);
  }

  @Get(':petId')
  @ApiResponse({
    status: 200,
    description: '펫 정보 조회 성공',
    type: PetDto,
  })
  async findOne(@Param('petId') petId: string) {
    return await this.petService.getPet(petId);
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: '펫 등록이 완료되었습니다. petId: XXXXXX',
    type: CommonResponseDto,
  })
  async create(@Body() createPetDto: CreatePetDto) {
    // TODO: userId를 ownerId로 사용
    const tempOwnerId = 'ADMIN';

    const { petId } = await this.petService.createPet({
      ...createPetDto,
      ownerId: tempOwnerId,
    });

    return {
      success: true,
      message: '펫 등록이 완료되었습니다. petId: ' + petId,
    };
  }

  @Patch(':petId')
  @ApiResponse({
    status: 200,
    description: '펫 수정이 완료되었습니다. petId: XXXXXX',
    type: CommonResponseDto,
  })
  async update(
    @Param('petId') petId: string,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    const tempOwnerId = 'ADMIN';
    await this.petService.updatePet(tempOwnerId, petId, updatePetDto);
    return {
      success: true,
      message: '펫 수정이 완료되었습니다. petId: ' + petId,
    };
  }

  @Delete(':petId')
  async delete(@Param('petId') petId: string) {
    return await this.petService.deletePet(petId);
  }
}
