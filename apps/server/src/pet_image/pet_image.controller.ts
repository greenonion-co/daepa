import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PetImageService } from './pet_image.service';
import {
  SaveFilesDto,
  FindThumbnailResponseDto,
  FindPetImagesResponseDto,
} from './pet_image.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { JwtUser, Public } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('pet-image')
@Controller('v1/pet-image')
export class PetImageController {
  constructor(private readonly petImageService: PetImageService) {}

  @Get('/thumbnail/:petId')
  @Public()
  @ApiOperation({
    summary: '펫 대표이미지(썸네일) 조회',
    description:
      '펫 ID를 기반으로 해당 펫의 대표 이미지를 조회합니다. 이미지가 없는 경우 data가 null입니다.',
  })
  @ApiParam({
    name: 'petId',
    type: 'string',
    description: '펫 ID',
    example: 'pet-123',
  })
  @ApiResponse({
    status: 200,
    description: '펫 대표 이미지 조회 성공',
    type: FindThumbnailResponseDto,
  })
  async findThumbnail(
    @Param('petId') petId: string,
  ): Promise<FindThumbnailResponseDto> {
    const thumbnail = await this.petImageService.findThumbnailByPetId(petId);
    return {
      success: true,
      message: '펫 대표 이미지 조회가 완료되었습니다.',
      data: thumbnail,
    };
  }

  @Get(':petId')
  @Public()
  @ApiOperation({
    summary: '펫 이미지 조회',
    description:
      '펫 ID를 기반으로 해당 펫의 이미지 파일 목록을 조회합니다. 이미지가 없는 경우 빈 배열을 반환합니다.',
  })
  @ApiParam({
    name: 'petId',
    type: 'string',
    description: '펫 ID',
    example: 'pet-123',
  })
  @ApiResponse({
    status: 200,
    description: '펫 이미지 파일 목록 조회 성공',
    type: FindPetImagesResponseDto,
  })
  async findOne(
    @Param('petId') petId: string,
  ): Promise<FindPetImagesResponseDto> {
    const images = await this.petImageService.findOneByPetId(petId);
    return {
      success: true,
      message: '펫 이미지 조회가 완료되었습니다.',
      data: images,
    };
  }

  @Put(':petId')
  @ApiOperation({
    summary: '펫 이미지 저장',
    description:
      '펫 ID를 기반으로 이미지를 저장하거나 수정합니다. 기존 이미지가 있으면 업데이트하고, 없으면 새로 생성합니다.',
  })
  @ApiParam({
    name: 'petId',
    type: 'string',
    description: '펫 ID',
    example: 'pet-123',
  })
  @ApiResponse({
    status: 200,
    description: '펫 이미지 저장 성공',
    type: CommonResponseDto,
  })
  async savePetImages(
    @Param('petId') petId: string,
    @Body() saveFilesDto: SaveFilesDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.petImageService.saveAndUploadConfirmedImages(
      petId,
      saveFilesDto.files,
      token.userId,
      'update',
    );

    return {
      success: true,
      message: '펫 이미지 저장이 완료되었습니다.',
    };
  }
}
