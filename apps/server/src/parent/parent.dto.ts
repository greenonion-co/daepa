import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { PARENT_ROLE, PARENT_STATUS } from './parent.constant';

export class ParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: '부모 구분' })
  @IsNotEmpty()
  role: PARENT_ROLE;

  @ApiProperty({ description: '부모 관계 상태' })
  @IsNotEmpty()
  status: PARENT_STATUS;
}

export class FindParentDto extends PickType(ParentDto, ['role']) {
  @ApiProperty({ description: '부모 구분' })
  @IsNotEmpty()
  role: PARENT_ROLE;
}

export class CreateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: '부모 구분' })
  @IsNotEmpty()
  role: PARENT_ROLE;
}

export class UpdateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: '변경할 상태',
    example: 'pending',
  })
  @IsString()
  @IsNotEmpty()
  updateStatus: PARENT_STATUS;
}

export class DeleteParentDto {
  @ApiProperty({
    description: '부모 ID',
  })
  @IsString()
  @IsNotEmpty()
  parentId: string;
}
