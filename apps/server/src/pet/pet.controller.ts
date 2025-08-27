import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  CompleteHatchingDto,
  CreatePetDto,
  UpdatePetDto,
  FindPetByPetIdResponseDto,
  UnlinkParentDto,
} from './pet.dto';
import { PetService } from './pet.service';
import { ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CreateParentDto } from 'src/parent_request/parent_request.dto';

@Controller('/v1/pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

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

  @Post(':petId/parent')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '부모 연동 요청이 완료되었습니다.',
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
    status: 404,
    description: '부모로 지정된 펫을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '아버지로 지정된 펫은 수컷이어야 합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '어머니로 지정된 펫은 암컷이어야 합니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 해당 역할의 부모가 연동되어 있습니다.',
  })
  async linkParent(
    @Param('petId') petId: string,
    @Body() body: CreateParentDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petService.linkParent(
      petId,
      body.parentId,
      body.role,
      token.userId,
      body.message,
    );

    return {
      success: true,
      message: '부모 연동 요청이 완료되었습니다.',
    };
  }

  @Delete(':petId/parent')
  @ApiParam({
    name: 'petId',
    description: '펫 아이디',
    example: 'XXXXXXXX',
  })
  @ApiResponse({
    status: 200,
    description: '부모 연동 해제가 완료되었습니다.',
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
    status: 404,
    description: '해당 부모 관계를 찾을 수 없습니다.',
  })
  async unlinkParent(
    @Param('petId') petId: string,
    @Body() body: UnlinkParentDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petService.unlinkParent(petId, body.role, token.userId);

    return {
      success: true,
      message: '부모 연동 해제가 완료되었습니다.',
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
      completeHatchingDto.hatchingDate,
    );

    return {
      success: true,
      message: '해칭이 완료되었습니다.',
    };
  }
}
