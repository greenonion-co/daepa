import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploaImagesDto {
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  petId: string;
}

export class UploadImagesRequestDto {
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  petId: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      '업로드할 이미지 파일 (jpg, jpeg, png, gif, webp, heic, heif, avif)',
    required: true,
  })
  files: Express.Multer.File[];
}
