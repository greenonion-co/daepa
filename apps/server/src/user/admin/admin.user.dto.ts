import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class UpdatePetLimitOverrideDto {
  /**
   * 사용자별 공개 펫 슬롯 한도 override.
   *
   * - 양의 정수: 해당 값으로 한도 고정
   * - 0: 해당 사용자는 새로운 펫을 공개할 수 없음 (어뷰저 제재 등)
   * - null: override 해제 → role 기본값(DEFAULT_PET_LIMIT_BY_ROLE)으로 복귀
   */
  @ApiProperty({
    description:
      '사용자별 공개 펫 슬롯 한도 override (null = role 기본값으로 복귀)',
    example: 50,
    nullable: true,
    required: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  petLimitOverride: number | null;
}

export class UpdatePetLimitOverrideResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '응답 메시지' })
  message: string;

  @ApiProperty({
    description: '적용 후 유효 한도',
    example: 50,
  })
  effectiveLimit: number;

  @ApiProperty({
    description: '한도 변경으로 인해 자동 비공개로 강등된 펫 ID 목록',
    type: [String],
    example: [],
  })
  demotedPetIds: string[];
}
