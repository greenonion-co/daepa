import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { ApiConsumes, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { FileService } from './file.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadImagesRequestDto } from './file.dto';

@Controller('/v1/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload/pet')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      // 최대 3개 파일
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const name = (file.originalname || '').toLowerCase();
        if (!name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
          return callback(new Error('허용되지 않는 이미지 형식입니다.'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImagesRequestDto })
  @ApiResponse({
    status: 200,
    description: '파일 업로드가 완료되었습니다.',
    type: CommonResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 파일 형식 또는 파일 크기 초과',
  })
  @ApiResponse({
    status: 413,
    description: '파일 크기가 너무 큽니다 (최대 10MB)',
  })
  async uploadImages(
    @Body() uploadImagesDto: Pick<UploadImagesRequestDto, 'petId'>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.fileService.uploadImages({
      petId: uploadImagesDto.petId,
      files,
    });
  }
}
