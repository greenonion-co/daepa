import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { CHILD_TYPE, PARENT_ROLE, PARENT_STATUS } from './parent.constant';

export class ParentDto {
  @ApiProperty({ description: '부모 관계 테이블 row id' })
  @IsNumber()
  @IsNotEmpty()
  relationId: number;

  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: '부모 구분', enum: PARENT_ROLE })
  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @ApiProperty({
    description: `부모 관계 상태
      - pending: 승인 대기 중
      - approved: 부모 승인됨
      - rejected: 수신자에 의해 요청 거절됨
      - deleted: approved 이후, 부모 정보 변경을 위해 삭제
      - cancelled: 승인 전, 전송자의 요청 취소`,
    enum: PARENT_STATUS,
  })
  @IsNotEmpty()
  @IsEnum(PARENT_STATUS)
  status: PARENT_STATUS;
}

export class FindParentDto extends PickType(ParentDto, ['role']) {
  @ApiProperty({ description: '부모 구분' })
  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;
}

export class CreateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: '부모 구분', enum: PARENT_ROLE })
  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @ApiProperty({ description: '부모 관계 요청 메시지', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: '펫인지 알인지 여부',
    enum: CHILD_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CHILD_TYPE)
  childType?: CHILD_TYPE;
}

export class UpdateParentDto {
  @ApiProperty({ description: '부모 관계 ID (parents 테이블의 id)' })
  @IsNumber()
  @IsNotEmpty()
  relationId: number;

  @ApiProperty({
    description: '업데이트 할 부모 관계 상태',
    enum: [
      PARENT_STATUS.APPROVED,
      PARENT_STATUS.CANCELLED,
      PARENT_STATUS.REJECTED,
    ],
  })
  @IsEnum(PARENT_STATUS)
  @IsNotEmpty()
  status: PARENT_STATUS;

  @ApiProperty({ description: '상대방 유저 ID' })
  @IsString()
  @IsNotEmpty()
  opponentId: string;

  @ApiProperty({ description: '거절 사유', required: false })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}
