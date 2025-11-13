import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  ConflictException,
  Query,
} from '@nestjs/common';
import {
  CompleteHatchingDto,
  CreatePetDto,
  UpdatePetDto,
  FindPetByPetIdResponseDto,
  VerifyPetNameDto,
  PetDto,
  PetFilterDto,
  GetParentsByPetIdResponseDto,
} from './pet.dto';
import { PetService } from './pet.service';
import {
  ApiResponse,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { PageDto, PageMetaDto } from 'src/common/page.dto';

@Controller('/v1/pet')
export class PetController {
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
    @Query() pageOptionsDto: PetFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<PetDto>> {
    return this.petService.getPetListFull(pageOptionsDto, token.userId);
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: '펫 등록이 완료되었습니다. petId: XXXXXX',
    type: CommonResponseDto,
  })
  async create(
    @Body() createPetDto: CreatePetDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petService.createPet(createPetDto, token.userId);

    return {
      success: true,
      message: '펫 등록이 완료되었습니다.',
    };
  }

  @Get(':petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '펫 정보 조회 성공',
    type: FindPetByPetIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫을 찾을 수 없습니다.',
  })
  async findPetByPetId(
    @Param('petId') petId: string,
  ): Promise<FindPetByPetIdResponseDto> {
    const data = await this.petService.findPetByPetId(petId);
    return {
      success: true,
      message: '펫 정보 조회 성공',
      data,
    };
  }

  @Patch(':petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '펫 수정이 완료되었습니다.',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '펫의 소유자가 아닙니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 존재하는 펫 이름입니다.',
  })
  async update(
    @Param('petId') petId: string,
    @Body() updatePetDto: UpdatePetDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petService.updatePet(petId, updatePetDto, token.userId);

    return {
      success: true,
      message: '펫 수정이 완료되었습니다.',
    };
  }

  @Delete(':petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '펫 삭제가 완료되었습니다.',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '펫의 소유자가 아닙니다.',
  })
  @ApiResponse({
    status: 400,
    description: '분양 정보가 있어 삭제할 수 없습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '자식 펫이 있어 삭제할 수 없습니다.',
  })
  async deletePet(
    @Param('petId') petId: string,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petService.deletePet(petId, token.userId);

    return {
      success: true,
      message: '펫 삭제가 완료되었습니다.',
    };
  }

  @Post(':petId/hatching')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '해칭이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async completeHatching(
    @Param('petId') petId: string,
    @JwtUser() token: JwtUserPayload,
    @Body() completeHatchingDto: CompleteHatchingDto,
  ): Promise<CommonResponseDto> {
    await this.petService.completeHatching(
      petId,
      token.userId,
      completeHatchingDto,
    );

    return {
      success: true,
      message: '해칭이 완료되었습니다.',
    };
  }

  @Post('/duplicate-check')
  @ApiResponse({
    status: 200,
    description: '닉네임 중복 확인 성공',
    type: CommonResponseDto,
  })
  async verifyName(
    @Body() verifyNameDto: VerifyPetNameDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    const isExist = await this.petService.isPetNameExist(
      verifyNameDto.name,
      token.userId,
    );
    if (!isExist) {
      return {
        success: true,
        message: '사용 가능한 닉네임입니다.',
      };
    } else {
      throw new ConflictException('이미 사용중인 닉네임입니다.');
    }
  }

  @Get('/parents/:petId')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '펫 부모 정보 조회 성공',
    type: GetParentsByPetIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '펫 부모 정보를 찾을 수 없습니다.',
  })
  async getParentsByPetId(
    @Param('petId') petId: string,
    @JwtUser() token: JwtUserPayload,
  ): Promise<GetParentsByPetIdResponseDto> {
    const data = await this.petService.getParentsByPetId(petId, token.userId);
    return {
      success: true,
      message: '펫 정보 조회 성공',
      data,
    };
  }
}
