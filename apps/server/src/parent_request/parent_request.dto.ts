import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParentRequestDto {
  @IsNotEmpty()
  @IsString()
  requesterId: string;

  @IsNotEmpty()
  @IsString()
  childPetId: string;

  @IsNotEmpty()
  @IsString()
  parentPetId: string;

  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateParentRequestDto {
  @ApiProperty({
    description: '부모 관계 상태',
    enum: PARENT_STATUS,
    'x-enumNames': Object.keys(PARENT_STATUS),
  })
  @IsNotEmpty()
  @IsEnum(PARENT_STATUS)
  status: PARENT_STATUS;

  @ApiProperty({
    description: '거절 사유',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class CreateParentDto {
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @IsOptional()
  @IsString()
  message?: string;
}
