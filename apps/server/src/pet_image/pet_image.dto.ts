import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsString,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PetImageItem {
  @ApiProperty({
    description: '펫 이미지 파일',
    example: 'XXXXXXXX',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '펫 이미지 원본 url',
    example: 'https://media.breedy.kr/XXXXXXXX/bDbKDMjCVBtwRDSqvJvzH',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: '펫 이미지 파일 타입',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: '펫 이미지 파일 크기',
    example: 1024,
  })
  @IsNumber()
  size: number;
}

export class PetImageBaseDto {
  @ApiProperty({
    description: '펫 이미지 아이디',
    example: 1,
  })
  @IsString()
  id: number;

  @ApiProperty({
    description: '펫 이미지 파일',
    example: 'XXXXXXXX',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '펫 이미지 원본 url',
    example: 'https://media.breedy.kr/XXXXXXXX/bDbKDMjCVBtwRDSqvJvzH',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: '펫 이미지 파일 타입',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: '펫 이미지 파일 크기',
    example: 1024,
  })
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}

export class SaveFilesDto {
  @ApiProperty({
    description: '펫 이미지 파일 목록',
    type: () => [PetImageItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetImageItem)
  files: PetImageItem[];
}

export class UpsertPetImageDto extends OmitType(PetImageBaseDto, [
  'id',
  'createdAt',
  'updatedAt',
]) {}

export class PetImageResponseDto {
  @ApiProperty({
    description: '펫 이미지 아이디',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '펫 ID',
    example: 'pet-123',
  })
  @IsString()
  petId: string;

  @ApiProperty({
    description: '펫 이미지 파일 목록',
    type: () => [PetImageItem],
    nullable: true,
  })
  files: PetImageItem[] | null;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}
