"use client";

import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  statisticsControllerGetAdoptionStatistics,
  StatisticsControllerGetPairStatisticsSpecies,
  PetParentDto,
  PetDtoSex,
} from "@repo/api-client";
import { overlay } from "overlay-kit";
import FilterItem from "../../hatching/components/Filters/FilterItem";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { ChartConfig } from "@/components/ui/chart";
import SingleSelect from "../../components/selector/SingleSelect";
import {
  StatCard,
  ChartCard,
  StatsPieChart,
  StatsBarChart,
  CustomSelect,
  CustomSelectOption,
  getMorphOrTraitColor,
  AdoptionMonthlyChart,
  DayOfWeekChart,
  CustomerAnalysisCard,
  PriceRangeChart,
  PriceRangePetsModal,
} from "./Charts";
import { PriceRangeItemDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import Image from "next/image";
import { STATISTICS_COLORS, ADOPTION_STATISTICS_COLORS } from "../../constants";
import { cn, formatPrice } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { AlertCircle, ChevronDown } from "lucide-react";
import SiblingPetCard from "../../pet/[petId]/relation/components/SiblingPetCard";

// 연도 옵션 생성 (최근 5년)
const generateYearOptions = (): CustomSelectOption[] => {
  const currentYear = new Date().getFullYear();
  const options: CustomSelectOption[] = [{ key: "all", value: "전체" }];

  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    options.push({ key: String(year), value: `${year}년` });
  }

  return options;
};

// 월 옵션 생성 (1-12월)
const MONTH_OPTIONS: CustomSelectOption[] = [
  { key: "all", value: "전체" },
  { key: "1", value: "1월" },
  { key: "2", value: "2월" },
  { key: "3", value: "3월" },
  { key: "4", value: "4월" },
  { key: "5", value: "5월" },
  { key: "6", value: "6월" },
  { key: "7", value: "7월" },
  { key: "8", value: "8월" },
  { key: "9", value: "9월" },
  { key: "10", value: "10월" },
  { key: "11", value: "11월" },
  { key: "12", value: "12월" },
];

// 성별 한글 변환
const SEX_LABELS: Record<string, string> = {
  male: "수컷",
  female: "암컷",
  unknown: "미구분",
};

// 성별 색상
const getSexColor = (sex: string): string => {
  const colorMap: Record<string, string> = {
    male: STATISTICS_COLORS.male,
    female: STATISTICS_COLORS.female,
    unknown: STATISTICS_COLORS.unknown,
  };
  return colorMap[sex] || "#94a3b8";
};

// 분양 방식 한글 변환
const METHOD_LABELS: Record<string, string> = {
  NONE: "알 수 없음",
  PICKUP: "직거래",
  DELIVERY: "배송",
  WHOLESALE: "도매",
  EXPORT: "수출",
};

// 분양 방식 색상
const getMethodColor = (method: string): string => {
  const colorMap: Record<string, string> = {
    NONE: ADOPTION_STATISTICS_COLORS.none,
    PICKUP: ADOPTION_STATISTICS_COLORS.pickup,
    DELIVERY: ADOPTION_STATISTICS_COLORS.delivery,
    WHOLESALE: ADOPTION_STATISTICS_COLORS.wholesale,
    EXPORT: ADOPTION_STATISTICS_COLORS.export,
  };
  return colorMap[method] || "#94a3b8";
};

const AdoptionDashboard = memo(() => {
  const isMobile = useIsMobile();
  const [species, setSpecies] = useState<StatisticsControllerGetPairStatisticsSpecies>(
    StatisticsControllerGetPairStatisticsSpecies.CR,
  );
  const [father, setFather] = useState<PetParentDto | undefined>(undefined);
  const [mother, setMother] = useState<PetParentDto | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeItemDto | null>(null);
  const [isParentSectionOpen, setIsParentSectionOpen] = useState(false);

  const yearOptions = useMemo(() => generateYearOptions(), []);

  // 연도 변경 시 월 선택 초기화
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year === "all") {
      setSelectedMonth("all");
    }
  };

  // 종이 선택되었는지 확인
  const canQueryStatistics = !!species;

  // 통계 조회
  const { data: statistics, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      statisticsControllerGetAdoptionStatistics.name,
      species,
      father?.petId,
      mother?.petId,
      selectedYear,
      selectedMonth,
    ],
    queryFn: () =>
      statisticsControllerGetAdoptionStatistics({
        species: species ?? undefined,
        fatherId: father?.petId,
        motherId: mother?.petId,
        year: selectedYear !== "all" ? Number(selectedYear) : undefined,
        month: selectedMonth !== "all" ? Number(selectedMonth) : undefined,
      }),
    select: (data) => data.data,
    enabled: canQueryStatistics,
  });

  // 부모 선택 셀렉터 열기
  const openParentSearchSelector = (sex: PetDtoSex) =>
    overlay.open(({ isOpen, close, unmount }) => (
      <ParentSearchSelector
        isOpen={isOpen}
        onClose={close}
        onSelect={(item) => {
          close();
          if (sex === PetDtoSex.MALE) {
            setFather(item);
          } else {
            setMother(item);
          }
        }}
        sex={sex}
        onExit={unmount}
        onlySelect
        allowMyPetOnly
        species={species ?? undefined}
      />
    ));

  // 종 변경 핸들러
  const handleSpeciesChange = (item: StatisticsControllerGetPairStatisticsSpecies) => {
    if (species !== item) {
      setFather(undefined);
      setMother(undefined);
    }
    setSpecies(item);
  };

  // 성별 통계 차트 데이터 (분양가 기준)
  const sexChartData = useMemo(() => {
    if (!statistics?.sex) return [];
    return statistics.sex.map((item) => ({
      name: SEX_LABELS[item.key] || item.key,
      value: item.revenue,
      fill: getSexColor(item.key),
    }));
  }, [statistics]);

  // 분양 방식 분포 차트 데이터 (분양가 기준)
  const methodChartData = useMemo(() => {
    if (!statistics?.methods) return [];
    return statistics.methods
      .map((method) => ({
        name: METHOD_LABELS[method.key] || method.key,
        value: method.totalRevenue,
        fill: getMethodColor(method.key),
      }))
      .filter((item) => item.value > 0);
  }, [statistics]);

  // 모프 분포 차트 데이터 (분양가 기준)
  const morphChartData = useMemo(() => {
    if (!statistics?.morphs) return [];
    const totalRevenue = statistics.morphs.reduce((sum, m) => sum + m.totalRevenue, 0);
    return statistics.morphs
      .map((morph, index) => ({
        name: morph.key,
        count: morph.count,
        percentage: totalRevenue > 0 ? (morph.totalRevenue / totalRevenue) * 100 : 0,
        fill: getMorphOrTraitColor(morph.key, index),
        averagePrice: morph.averagePrice,
        totalRevenue: morph.totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [statistics]);

  // 형질 분포 차트 데이터 (분양가 기준)
  const traitChartData = useMemo(() => {
    if (!statistics?.traits) return [];
    const totalRevenue = statistics.traits.reduce((sum, t) => sum + t.totalRevenue, 0);
    return statistics.traits
      .map((trait, index) => ({
        name: trait.key,
        count: trait.count,
        percentage: totalRevenue > 0 ? (trait.totalRevenue / totalRevenue) * 100 : 0,
        fill: getMorphOrTraitColor(trait.key, index),
        averagePrice: trait.averagePrice,
        totalRevenue: trait.totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [statistics]);

  const sexChartConfig: ChartConfig = {
    male: { label: "수컷", color: STATISTICS_COLORS.male },
    female: { label: "암컷", color: STATISTICS_COLORS.female },
    unknown: { label: "미구분", color: STATISTICS_COLORS.unknown },
  };

  const methodChartConfig: ChartConfig = {
    none: { label: "알 수 없음", color: ADOPTION_STATISTICS_COLORS.none },
    pickup: { label: "직거래", color: ADOPTION_STATISTICS_COLORS.pickup },
    delivery: { label: "배송", color: ADOPTION_STATISTICS_COLORS.delivery },
    wholesale: { label: "도매", color: ADOPTION_STATISTICS_COLORS.wholesale },
    export: { label: "수출", color: ADOPTION_STATISTICS_COLORS.export },
  };

  return (
    <div className="max-w-7xl px-2 pb-10">
      <div className="flex flex-wrap gap-2">
        <SingleSelect
          showTitle
          type="species"
          saveASAP
          initialItem={species}
          onSelect={handleSpeciesChange}
        />

        {/* 부모 개체 선택 */}
        <FilterItem
          value={father?.name}
          placeholder="부 개체"
          disabled={!species}
          onClose={() => setFather(undefined)}
          onClick={() => openParentSearchSelector(PetDtoSex.MALE)}
        />
        <FilterItem
          value={mother?.name}
          placeholder="모 개체"
          disabled={!species}
          onClose={() => setMother(undefined)}
          onClick={() => openParentSearchSelector(PetDtoSex.FEMALE)}
        />

        <CustomSelect
          title="연도"
          options={yearOptions}
          selectedKey={selectedYear}
          onChange={handleYearChange}
          defaultOptionKey="all"
          disabled={!species}
        />
        <CustomSelect
          title="월"
          options={MONTH_OPTIONS}
          selectedKey={selectedMonth}
          onChange={setSelectedMonth}
          defaultOptionKey="all"
          disabled={selectedYear === "all"}
        />
      </div>

      {/* 선택된 부모 개체 표시 */}
      {(father || mother) && (
        <div className="my-2 rounded-2xl bg-gradient-to-r from-blue-300/50 to-purple-300/50 p-[1px] dark:from-blue-600/40 dark:to-purple-600/40">
          <div className="relative overflow-hidden rounded-2xl bg-white py-2 dark:bg-gray-900">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 dark:from-blue-800/20 dark:to-purple-800/20" />
            <button
              type="button"
              onClick={() => setIsParentSectionOpen(!isParentSectionOpen)}
              className="relative flex w-full items-center justify-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(90deg, #3b82f6, #a855f7)",
                }}
              >
                선택된 부모 개체
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-[#a855f7] transition-transform duration-200",
                  isParentSectionOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "relative grid transition-all duration-200",
                isParentSectionOpen
                  ? "mt-4 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {father && (
                    <div className="mb-2 flex flex-col gap-1">
                      <SiblingPetCard pet={father} width={140} />
                    </div>
                  )}

                  {mother && (
                    <div className="mb-2 flex flex-col gap-1">
                      <SiblingPetCard pet={mother} width={140} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!species ? (
        <div className="text-muted-foreground flex h-40 flex-col items-center justify-center text-sm">
          <Image src="/assets/lizard.png" alt="통계 데이터 없음" width={100} height={100} />
          종을 선택해주세요.
        </div>
      ) : isStatsLoading ? (
        <Loading />
      ) : statistics && statistics.totalCount > 0 ? (
        <div>
          {/* 메타 정보 */}
          <div
            className={cn(
              "my-4 grid grid-cols-2 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 sm:grid-cols-4 dark:from-blue-900/30 dark:to-purple-900/30",
              isMobile && "px-0",
            )}
          >
            <StatCard label="총 분양" value={statistics.totalCount} />
            <StatCard
              label="총 수익"
              value={formatPrice(statistics.revenue.totalRevenue)}
              valueClassName="text-green-600"
            />
            <StatCard
              label="평균 분양가"
              value={formatPrice(statistics.revenue.averagePrice)}
              valueClassName="text-[#3b82f6]"
            />
            <StatCard
              label="분양가 범위"
              value={`${formatPrice(statistics.revenue.minPrice)} ~ ${formatPrice(statistics.revenue.maxPrice)}`}
            />
          </div>

          {/* 월별 통계 차트 (연도만 선택된 경우) */}
          {selectedYear !== "all" && selectedMonth === "all" && statistics.monthlyStats && (
            <div className="mb-6">
              <ChartCard title={`${selectedYear}년 월별 분양 통계`}>
                <AdoptionMonthlyChart data={statistics.monthlyStats} />
              </ChartCard>
            </div>
          )}

          {/* 차트 그리드 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 요일별 분양 통계 */}
            {statistics.dayOfWeekStats && statistics.dayOfWeekStats.some((d) => d.count > 0) && (
              <ChartCard title="요일별 분양 통계">
                <DayOfWeekChart data={statistics.dayOfWeekStats} />
              </ChartCard>
            )}

            {/* 고객 분석 */}
            {statistics.customerAnalysis && (
              <CustomerAnalysisCard data={statistics.customerAnalysis} />
            )}

            {/* 가격대별 분양 통계 */}
            {statistics.priceRangeStats && statistics.priceRangeStats.length > 0 && (
              <ChartCard
                title="가격대별 분양 분포"
                footer={
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-blue-200/50 to-purple-200/65 px-2 py-4 dark:from-blue-900/40 dark:to-purple-900/50">
                    <span className="text-center text-[14px] font-[500] text-gray-900 dark:text-purple-200">
                      막대 차트를 클릭하면 해당 가격대의 분양 개체 목록을 확인할 수 있습니다.
                    </span>
                    <div className="mt-1 flex gap-1 text-[13px] text-red-500 dark:text-purple-300/90">
                      <AlertCircle size={15} />
                      <span>가격을 등록하지 않은 분양은 제외됩니다.</span>
                    </div>
                  </div>
                }
              >
                <PriceRangeChart
                  data={statistics.priceRangeStats}
                  onRangeClick={setSelectedPriceRange}
                />
              </ChartCard>
            )}

            {/* 성별 통계 파이 차트 (분양가 기준) */}
            {sexChartData.length > 0 && (
              <ChartCard
                title="성별 분포 (분양가 기준)"
                footer={
                  <div className="flex flex-col flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-700 dark:text-gray-300">
                    <div>
                      {statistics.sex.map((item) => (
                        <div key={item.key}>
                          <span
                            className="ml-0.5 mr-2 inline-block h-3 w-3"
                            style={{ backgroundColor: getSexColor(item.key) }}
                          />
                          <span className="font-bold">{formatPrice(item.revenue)}</span>{" "}
                          <span className="font-[500] text-gray-500 dark:text-gray-400">
                            ({item.count}마리)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 font-[500] text-gray-500 dark:text-gray-400">
                      평균:{" "}
                      {statistics.sex.map((item, index) => (
                        <span key={item.key}>
                          {SEX_LABELS[item.key] || item.key}{" "}
                          <span className="font-[600] text-[#1b64da]">
                            {formatPrice(item.averagePrice)}
                          </span>
                          {index < statistics.sex.length - 1 ? " | " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                }
              >
                <StatsPieChart data={sexChartData} config={sexChartConfig} />
              </ChartCard>
            )}

            {/* 분양 방식 분포 파이 차트 (분양가 기준) */}
            {methodChartData.length > 0 && (
              <ChartCard
                title="분양 방식 분포 (분양가 기준)"
                footer={
                  <div className="flex flex-col flex-wrap items-center text-[13px] text-gray-700 dark:text-gray-300">
                    <div>
                      {statistics.methods.map((method) => (
                        <span key={method.key} className="flex items-center gap-1 font-[600]">
                          <span
                            className="inline-block h-3 w-3"
                            style={{ backgroundColor: getMethodColor(method.key) }}
                          />
                          {METHOD_LABELS[method.key] || method.key}:{" "}
                          {formatPrice(method.totalRevenue)}
                          <span className="font-[500] text-gray-500 dark:text-gray-400">
                            ({method.count}마리)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                }
              >
                <StatsPieChart data={methodChartData} config={methodChartConfig} />
              </ChartCard>
            )}

            {/* 모프 분포 바 차트 (분양가 기준) */}
            {morphChartData.length > 0 && (
              <ChartCard
                title="모프 분포 (분양가 기준)"
                footer={
                  <div className="mt-7 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                    {morphChartData.slice(0, 5).map((morph) => (
                      <span key={morph.name} className="flex items-center gap-1 font-[500]">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: morph.fill }}
                        />
                        {morph.name}:
                        <span className="font-bold"> {formatPrice(morph.totalRevenue)}</span>
                        <span className="font-[500] text-gray-500 dark:text-gray-400">
                          ({morph.count}마리)
                        </span>
                      </span>
                    ))}
                  </div>
                }
              >
                <StatsBarChart data={morphChartData} mode="revenue" />
              </ChartCard>
            )}

            {/* 형질 분포 바 차트 (분양가 기준) */}
            {traitChartData.length > 0 && (
              <ChartCard
                title="형질 분포 (분양가 기준)"
                footer={
                  <div className="mt-7 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
                    {traitChartData.slice(0, 5).map((trait) => (
                      <span key={trait.name} className="flex items-center gap-1 font-[500]">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: trait.fill }}
                        />
                        {trait.name}:
                        <span className="font-bold"> {formatPrice(trait.totalRevenue)}</span>
                        <span className="font-[500] text-gray-500 dark:text-gray-400">
                          ({trait.count}마리)
                        </span>
                      </span>
                    ))}
                  </div>
                }
              >
                <StatsBarChart data={traitChartData} mode="revenue" />
              </ChartCard>
            )}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground mt-6 flex flex-col items-center text-sm">
          <Image src="/assets/lizard.png" alt="통계 데이터 없음" width={200} height={200} />
          조회된 분양 내역이 없습니다.
        </div>
      )}

      {/* 가격대별 분양 목록 모달 */}
      <PriceRangePetsModal
        isOpen={!!selectedPriceRange}
        onClose={() => setSelectedPriceRange(null)}
        priceRange={selectedPriceRange}
        species={species}
      />
    </div>
  );
});

AdoptionDashboard.displayName = "AdoptionDashboard";

export default AdoptionDashboard;
