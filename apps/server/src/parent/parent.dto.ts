import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: '부모 구분',
    enum: ['father', 'mother'],
    example: 'father',
  })
  @IsString()
  @IsNotEmpty()
  target: 'father' | 'mother';
}

export class DeleteParentDto {
  @ApiProperty({
    description: '부모 구분',
    enum: ['father', 'mother'],
    example: 'father',
  })
  @IsString()
  @IsNotEmpty()
  target: 'father' | 'mother';
}
