import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParentRequestDto {
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

  @IsOptional()
  @IsEnum(PARENT_STATUS)
  status?: PARENT_STATUS;
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
  @ApiProperty({
    description: '부모 펫 아이디',
    example: 'XXXXXXXX',
  })
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @ApiProperty({
    description: '부모 역할',
    enum: PARENT_ROLE,
    'x-enumNames': Object.keys(PARENT_ROLE),
  })
  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @ApiProperty({
    description: '연동 요청 메시지',
    required: false,
    example: '혈통 정보를 위해 연동 요청합니다.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UnlinkParentDto {
  @ApiProperty({
    description: '부모 역할',
    enum: PARENT_ROLE,
    'x-enumNames': Object.keys(PARENT_ROLE),
    example: PARENT_ROLE.FATHER,
  })
  @IsEnum(PARENT_ROLE)
  @IsNotEmpty()
  role: PARENT_ROLE;
}
