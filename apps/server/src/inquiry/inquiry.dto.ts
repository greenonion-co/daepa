import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { INQUIRY_STATUS } from './inquiry.entity';

export class CreateInquiryDto {
  @ApiProperty({
    description: '1:1 문의 내용',
    example: '경매 등록이 안 됩니다. 확인 부탁드립니다.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class AnswerInquiryDto {
  @ApiProperty({
    description: '관리자 답변 내용',
    example: '확인 결과 일시적인 오류였으며 현재는 정상 동작합니다.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  answer: string;
}

export class InquiryDto {
  @ApiProperty({ description: '문의 ID' })
  id: number;

  @ApiProperty({ description: '문의 내용' })
  content: string;

  @ApiProperty({ description: '문의 상태', enum: INQUIRY_STATUS })
  status: INQUIRY_STATUS;

  @ApiProperty({ description: '관리자 답변', type: String, nullable: true })
  answer: string | null;

  @ApiProperty({ description: '답변 시각', type: Date, nullable: true })
  answeredAt: Date | null;

  @ApiProperty({ description: '문의 작성 시각' })
  createdAt: Date;
}

export class AdminInquiryDto extends InquiryDto {
  @ApiProperty({ description: '작성자 userId' })
  userId: string;

  @ApiProperty({ description: '작성자 이름', type: String, nullable: true })
  userName: string | null;

  @ApiProperty({ description: '작성자 이메일', type: String, nullable: true })
  userEmail: string | null;
}
