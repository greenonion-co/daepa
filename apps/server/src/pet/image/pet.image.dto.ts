import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PetImageDto {
  @ApiProperty({
    description: '펫 이미지 아이디',
    example: 1,
    required: true,
  })
 @IsNumber()
 id: number;
  @ApiProperty({
    description: '펫 아이디',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '펫 이미지 파일',
    example: 'XXXXXXXX',
    required: true,
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '펫 이미지 원본 url',
    example: 'https://daepa.com/images/pet/1234567890.jpg',
    required: true,
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: '펫 이미지 크기',
    example: 1000,
    required: true,
  })
  @IsNumber()
  size: number;

  @ApiProperty({
    description: '펫 이미지 mime type',
    example: 'image/jpeg',
    required: true,
  })
  @IsString()
  mimeType: string;
}

export class UploadedPetImageDto extends PickType(PetImageDto, [
  'fileName',
  'url',
  'size',
  'mimeType',
]) {}
