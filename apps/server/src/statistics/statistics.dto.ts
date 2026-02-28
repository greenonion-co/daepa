import {
  ApiExtraModels,
  ApiProperty,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PET_SPECIES } from 'src/pet/pet.constants';

// ============================================
// Enums
// ============================================

export enum StatisticsPeriodType {
  ALL = 'ALL',
  SEASON = 'SEASON',
  YEAR_MONTH = 'YEAR_MONTH',
}

// ============================================
// Base DTOs
// ============================================

export class StatisticsPeriodDto {
  @ApiProperty({
    description: '기간 타입',
    enum: StatisticsPeriodType,
    example: StatisticsPeriodType.ALL,
    'x-enumNames': Object.keys(StatisticsPeriodType),
  })
  @IsEnum(StatisticsPeriodType)
  type: StatisticsPeriodType;

  @ApiProperty({
    description: '시즌 (예: 2024-2025)',
    example: '2024-2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiProperty({
    description: '연도',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({
    description: '월 (1-12)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  month?: number;
}

export class EggStatisticsDto {
  @ApiProperty({ description: '전체 알 수', example: 50 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: '유정란 수', example: 40 })
  @IsNumber()
  fertilized: number;

  @ApiProperty({ description: '무정란 수', example: 5 })
  @IsNumber()
  unfertilized: number;

  @ApiProperty({ description: '부화 완료 수', example: 35 })
  @IsNumber()
  hatched: number;

  @ApiProperty({ description: '중지란/사망 수', example: 5 })
  @IsNumber()
  dead: number;

  @ApiProperty({ description: '미정 수 (상태 미확인)', example: 3 })
  @IsNumber()
  pending: number;

  @ApiProperty({ description: '유정란 비율 (%)', example: 80.0 })
  @IsNumber()
  fertilizedRate: number;

  @ApiProperty({ description: '부화 성공율 (%)', example: 87.5 })
  @IsNumber()
  hatchingRate: number;
}

export class DistributionItemDto {
  @ApiProperty({ description: '항목명', example: 'Lilly White' })
  @IsString()
  key: string;

  @ApiProperty({ description: '개수', example: 10 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: '비율 (%)', example: 25.0 })
  @IsNumber()
  percentage: number;
}

export class SexStatisticsDto {
  @ApiProperty({ description: '수컷 수', example: 15 })
  @IsNumber()
  male: number;

  @ApiProperty({ description: '암컷 수', example: 20 })
  @IsNumber()
  female: number;

  @ApiProperty({ description: '미확인 수', example: 5 })
  @IsNumber()
  unknown: number;

  @ApiProperty({ description: '수컷 비율 (%)', example: 42.9 })
  @IsNumber()
  maleRate: number;

  @ApiProperty({ description: '암컷 비율 (%)', example: 57.1 })
  @IsNumber()
  femaleRate: number;
}

export class StatisticsMetaDto {
  @ApiProperty({ description: '총 메이팅 횟수', example: 5 })
  @IsNumber()
  totalMatings: number;

  @ApiProperty({ description: '총 산란 횟수', example: 10 })
  @IsNumber()
  totalLayings: number;
}

export class MonthlyStatisticsItemDto {
  @ApiProperty({ description: '월 (1-12)', example: 1 })
  @IsNumber()
  month: number;

  @ApiProperty({ description: '총 알 수', example: 14 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: '유정란 수 (부화 포함)', example: 8 })
  @IsNumber()
  fertilized: number;

  @ApiProperty({ description: '무정란 수', example: 2 })
  @IsNumber()
  unfertilized: number;

  @ApiProperty({ description: '중지란/사망 수', example: 1 })
  @IsNumber()
  dead: number;

  @ApiProperty({ description: '미정 수 (상태 미확인)', example: 3 })
  @IsNumber()
  pending: number;

  @ApiProperty({ description: '부화 완료 수', example: 6 })
  @IsNumber()
  hatched: number;
}

// ============================================
// Statistics Base DTO (공통 통계 필드)
// ============================================

@ApiExtraModels(
  StatisticsPeriodDto,
  EggStatisticsDto,
  DistributionItemDto,
  SexStatisticsDto,
  StatisticsMetaDto,
  MonthlyStatisticsItemDto,
)
class StatisticsBaseDto {
  @ApiProperty({
    description: '기간 정보',
    type: StatisticsPeriodDto,
  })
  @IsObject()
  @Type(() => StatisticsPeriodDto)
  period: StatisticsPeriodDto;

  @ApiProperty({
    description: '알 통계',
    type: EggStatisticsDto,
  })
  @IsObject()
  @Type(() => EggStatisticsDto)
  egg: EggStatisticsDto;

  @ApiProperty({
    description: '모프 분포',
    type: [DistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => DistributionItemDto)
  morphs: DistributionItemDto[];

  @ApiProperty({
    description: '형질 분포',
    type: [DistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => DistributionItemDto)
  traits: DistributionItemDto[];

  @ApiProperty({
    description: '성별 통계',
    type: SexStatisticsDto,
  })
  @IsObject()
  @Type(() => SexStatisticsDto)
  sex: SexStatisticsDto;

  @ApiProperty({
    description: '메타 정보',
    type: StatisticsMetaDto,
  })
  @IsObject()
  @Type(() => StatisticsMetaDto)
  meta: StatisticsMetaDto;

  @ApiProperty({
    description: '월별 통계 (연도만 선택된 경우)',
    type: [MonthlyStatisticsItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => MonthlyStatisticsItemDto)
  monthlyStats?: MonthlyStatisticsItemDto[];
}

// ============================================
// Response DTOs
// ============================================

export class PairStatisticsDto extends StatisticsBaseDto {
  @ApiProperty({
    description: '페어 ID',
    example: 1,
  })
  @IsNumber()
  pairId: number;
}

export class ParentStatisticsDto extends StatisticsBaseDto {
  @ApiProperty({
    description: '부 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '모 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}

export class PairSummaryDto {
  @ApiProperty({ description: '총 메이팅 횟수', example: 2 })
  @IsNumber()
  totalMatings: number;

  @ApiProperty({ description: '총 산란 횟수', example: 1 })
  @IsNumber()
  totalLayings: number;

  @ApiProperty({ description: '알 통계', type: EggStatisticsDto })
  @IsObject()
  @Type(() => EggStatisticsDto)
  egg: EggStatisticsDto;

  @ApiProperty({ description: '모프 분포', type: [DistributionItemDto] })
  @IsArray()
  @Type(() => DistributionItemDto)
  morphs: DistributionItemDto[];
}

// ============================================
// Query DTOs
// ============================================

class StatisticsQueryBaseDto {
  @ApiProperty({
    description: '연도',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  year?: number;

  @ApiProperty({
    description: '월 (1-12)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  month?: number;

  @ApiProperty({
    description: '종',
    enum: PET_SPECIES,
    example: PET_SPECIES.CRESTED,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsEnum(PET_SPECIES)
  species?: PET_SPECIES;

  @ApiProperty({
    description: '부 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '모 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}

export class PairStatisticsQueryDto extends PickType(StatisticsQueryBaseDto, [
  'year',
  'month',
  'species',
  'fatherId',
  'motherId',
]) {}

export class ParentStatisticsQueryDto extends OmitType(
  StatisticsQueryBaseDto,
  [],
) {}

// ============================================
// Adoption Statistics DTOs
// ============================================

/** 분양 분포 항목 DTO (DistributionItemDto 확장) */
export class AdoptionDistributionItemDto extends DistributionItemDto {
  @ApiProperty({ description: '총 수익', example: 2500000 })
  @IsNumber()
  totalRevenue: number;

  @ApiProperty({ description: '평균 분양가', example: 250000 })
  @IsNumber()
  averagePrice: number;
}

/** 분양 성별 항목 DTO */
export class AdoptionSexItemDto {
  @ApiProperty({
    description: '성별 키 (male, female, unknown)',
    example: 'male',
  })
  @IsString()
  key: string;

  @ApiProperty({ description: '개수', example: 15 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: '비율 (%)', example: 42.9 })
  @IsNumber()
  rate: number;

  @ApiProperty({ description: '총 수익', example: 3000000 })
  @IsNumber()
  revenue: number;

  @ApiProperty({ description: '평균 분양가', example: 200000 })
  @IsNumber()
  averagePrice: number;
}

/** 분양 수익 통계 DTO */
export class AdoptionRevenueDto {
  @ApiProperty({ description: '총 수익', example: 5000000 })
  @IsNumber()
  totalRevenue: number;

  @ApiProperty({ description: '평균 분양가', example: 250000 })
  @IsNumber()
  averagePrice: number;

  @ApiProperty({ description: '최저 분양가', example: 100000 })
  @IsNumber()
  minPrice: number;

  @ApiProperty({ description: '최고 분양가', example: 500000 })
  @IsNumber()
  maxPrice: number;
}

/** 수익 관련 기본 DTO (count, revenue, averagePrice) */
class AdoptionRevenueBaseDto {
  @ApiProperty({ description: '분양 수', example: 5 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: '수익', example: 1500000 })
  @IsNumber()
  revenue: number;

  @ApiProperty({ description: '평균 분양가', example: 300000 })
  @IsNumber()
  averagePrice: number;
}

/** 월별 분양 통계 DTO */
export class AdoptionMonthlyItemDto extends AdoptionRevenueBaseDto {
  @ApiProperty({ description: '월 (1-12)', example: 1 })
  @IsNumber()
  month: number;
}

/** 요일별 분양 통계 DTO */
export class AdoptionDayOfWeekItemDto extends AdoptionRevenueBaseDto {
  @ApiProperty({ description: '요일 (0=일, 1=월, ..., 6=토)', example: 1 })
  @IsNumber()
  dayOfWeek: number;
}

/** 가격대별 분양 통계 DTO */
export class PriceRangeItemDto extends AdoptionRevenueBaseDto {
  @ApiProperty({ description: '가격대 라벨', example: '10-30만원' })
  @IsString()
  label: string;

  @ApiProperty({ description: '최소 가격', example: 100000 })
  @IsNumber()
  minPrice: number;

  @ApiProperty({ description: '최대 가격', example: 300000 })
  @IsNumber()
  maxPrice: number;

  @ApiProperty({ description: '비율 (%)', example: 35.5 })
  @IsNumber()
  percentage: number;

  @ApiProperty({
    description: '해당 가격대 분양 ID 목록',
    example: ['adoption-1', 'adoption-2'],
  })
  @IsArray()
  @IsString({ each: true })
  adoptionIds: string[];
}

/** 고객 상세 정보 DTO */
export class CustomerDetailDto {
  @ApiProperty({ description: '고객 ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: '고객 이름', example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ description: '구매 횟수', example: 3 })
  @IsNumber()
  purchaseCount: number;

  @ApiProperty({ description: '총 구매 금액', example: 1500000 })
  @IsNumber()
  totalSpending: number;
}

/** 고객 분석 통계 DTO */
export class CustomerAnalysisDto {
  @ApiProperty({ description: '총 고객 수 (구매자)', example: 50 })
  @IsNumber()
  totalCustomers: number;

  @ApiProperty({ description: '재구매 고객 수 (2회 이상 구매)', example: 15 })
  @IsNumber()
  repeatCustomers: number;

  @ApiProperty({ description: '재구매율 (%)', example: 30.0 })
  @IsNumber()
  repeatRate: number;

  @ApiProperty({ description: '고객당 평균 구매 횟수', example: 1.5 })
  @IsNumber()
  averagePurchaseCount: number;

  @ApiProperty({ description: '고객당 평균 구매 금액', example: 500000 })
  @IsNumber()
  averageCustomerSpending: number;

  @ApiProperty({
    description: 'top 10 상위 고객 목록 (구매금액 순)',
    type: [CustomerDetailDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => CustomerDetailDto)
  topCustomers?: CustomerDetailDto[];

  @ApiProperty({
    description: 'top 10 재구매 고객 목록',
    type: [CustomerDetailDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => CustomerDetailDto)
  repeatCustomerList?: CustomerDetailDto[];
}

/** 분양 통계 응답 DTO */
@ApiExtraModels(
  AdoptionDistributionItemDto,
  AdoptionSexItemDto,
  AdoptionRevenueDto,
  AdoptionMonthlyItemDto,
  AdoptionDayOfWeekItemDto,
  PriceRangeItemDto,
  CustomerAnalysisDto,
  CustomerDetailDto,
)
export class AdoptionStatisticsDto {
  @ApiProperty({
    description: '기간 정보',
    type: StatisticsPeriodDto,
  })
  @IsObject()
  @Type(() => StatisticsPeriodDto)
  period: StatisticsPeriodDto;

  @ApiProperty({ description: '총 분양 수', example: 20 })
  @IsNumber()
  totalCount: number;

  @ApiProperty({
    description: '수익 통계',
    type: AdoptionRevenueDto,
  })
  @IsObject()
  @Type(() => AdoptionRevenueDto)
  revenue: AdoptionRevenueDto;

  @ApiProperty({
    description: '성별 통계',
    type: [AdoptionSexItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionSexItemDto)
  sex: AdoptionSexItemDto[];

  @ApiProperty({
    description: '모프 분포',
    type: [AdoptionDistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionDistributionItemDto)
  morphs: AdoptionDistributionItemDto[];

  @ApiProperty({
    description: '형질 분포',
    type: [AdoptionDistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionDistributionItemDto)
  traits: AdoptionDistributionItemDto[];

  @ApiProperty({
    description: '분양 방식 분포',
    type: [AdoptionDistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionDistributionItemDto)
  methods: AdoptionDistributionItemDto[];

  @ApiProperty({
    description: '월별 통계 (연도만 선택된 경우)',
    type: [AdoptionMonthlyItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionMonthlyItemDto)
  monthlyStats?: AdoptionMonthlyItemDto[];

  @ApiProperty({
    description: '요일별 통계',
    type: [AdoptionDayOfWeekItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => AdoptionDayOfWeekItemDto)
  dayOfWeekStats?: AdoptionDayOfWeekItemDto[];

  @ApiProperty({
    description: '고객 분석',
    type: CustomerAnalysisDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @Type(() => CustomerAnalysisDto)
  customerAnalysis?: CustomerAnalysisDto;

  @ApiProperty({
    description: '가격대별 통계',
    type: [PriceRangeItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => PriceRangeItemDto)
  priceRangeStats?: PriceRangeItemDto[];
}

export class AdoptionStatisticsQueryDto extends PickType(
  StatisticsQueryBaseDto,
  ['year', 'month', 'species', 'fatherId', 'motherId'],
) {}
