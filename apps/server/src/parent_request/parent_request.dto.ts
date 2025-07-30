import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { ApiProperty } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { ParentRequestEntity } from './parent_request.entity';

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

export class ParentRequestResponseDto {
  id: number;
  requesterId: string;
  childPetId: string;
  parentPetId: string;
  role: PARENT_ROLE;
  status: PARENT_STATUS;
  message?: string;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
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

export class RequestsByRequesterIdResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '부모 요청 정보',
    type: [ParentRequestResponseDto],
  })
  data: ParentRequestResponseDto[];
}

export class RequestsByReceiverIdResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '부모 요청 정보',
    type: [ParentRequestEntity],
  })
  data: ParentRequestEntity[];
}

export class RequestByIdResponseDto extends CommonResponseDto {
  @ApiProperty({
    description: '부모 요청 정보',
    type: ParentRequestEntity,
  })
  data: ParentRequestEntity | null;
}
