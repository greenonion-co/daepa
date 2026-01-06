import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PairControllerGetPairListSpecies,
  statisticsControllerGetPairStatistics,
  PetParentDto,
  PetDtoSex,
} from "@repo/api-client";
import { ChartConfig } from "@/components/ui/chart";
import { overlay } from "overlay-kit";
import SingleSelect from "../../components/selector/SingleSelect";
import FilterItem from "./Filters/FilterItem";
import ParentSearchSelector from "../../components/selector/parentSearch";
import {
  StatCard,
  ChartCard,
  StatsPieChart,
  StatsBarChart,
  MonthlyStatsChart,
  CustomSelect,
  CustomSelectOption,
  getMorphOrTraitColor,
} from "./Charts";
import Loading from "@/components/common/Loading";
import Image from "next/image";
import { STATISTICS_COLORS } from "../../constants";

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

const PairStatisticsDashboard = memo(() => {
  const currentYear = String(new Date().getFullYear());

  const [species, setSpecies] = useState<PairControllerGetPairListSpecies>(
    PairControllerGetPairListSpecies.CR,
  );
  const [father, setFather] = useState<PetParentDto | undefined>(undefined);
  const [mother, setMother] = useState<PetParentDto | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const yearOptions = useMemo(() => generateYearOptions(), []);

  // 연도 변경 시 월 선택 초기화
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year === "all") {
      setSelectedMonth("all");
    }
  };

  // 종이 선택되었는지 확인 (종만 선택해도 통계 조회 가능)
  const canQueryStatistics = !!species;

  // 통계 조회 (종만 선택해도 조회 가능, 부/모 개체는 선택 사항)
  const { data: statistics, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      statisticsControllerGetPairStatistics.name,
      species,
      father?.petId,
      mother?.petId,
      selectedYear,
      selectedMonth,
    ],
    queryFn: () =>
      statisticsControllerGetPairStatistics({
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

  // 종 변경 시 부모 선택 초기화
  const handleSpeciesChange = (item: PairControllerGetPairListSpecies) => {
    if (species !== item) {
      setFather(undefined);
      setMother(undefined);
    }
    setSpecies(item);
  };

  // 알 통계 차트 데이터
  const eggChartData = useMemo(() => {
    if (!statistics?.egg) return [];
    const { fertilized, unfertilized, hatched, dead } = statistics.egg;
    const pending = statistics.egg.pending;
    return [
      { name: "유정란", value: fertilized, fill: STATISTICS_COLORS.fertilized },
      { name: "무정란", value: unfertilized, fill: STATISTICS_COLORS.unfertilized },
      { name: "부화완료", value: hatched, fill: STATISTICS_COLORS.hatched },
      { name: "중지란", value: dead, fill: STATISTICS_COLORS.dead },
      { name: "미정", value: pending, fill: STATISTICS_COLORS.pending },
    ].filter((item) => item.value > 0);
  }, [statistics]);

  // 성별 통계 차트 데이터
  const sexChartData = useMemo(() => {
    if (!statistics?.sex) return [];
    const { male, female, unknown } = statistics.sex;
    return [
      { name: "수컷", value: male, fill: STATISTICS_COLORS.male },
      { name: "암컷", value: female, fill: STATISTICS_COLORS.female },
      { name: "미확인", value: unknown, fill: STATISTICS_COLORS.unknown },
    ].filter((item) => item.value > 0);
  }, [statistics]);

  // 모프 분포 차트 데이터 (실제 모프 색상 적용)
  const morphChartData = useMemo(() => {
    if (!statistics?.morphs) return [];
    return statistics.morphs.map((morph, index) => ({
      name: morph.key,
      count: morph.count,
      percentage: morph.percentage,
      fill: getMorphOrTraitColor(morph.key, index),
    }));
  }, [statistics]);

  // 형질 분포 차트 데이터 (실제 형질 색상 적용)
  const traitChartData = useMemo(() => {
    if (!statistics?.traits) return [];
    return statistics.traits.map((trait, index) => ({
      name: trait.key,
      count: trait.count,
      percentage: trait.percentage,
      fill: getMorphOrTraitColor(trait.key, index),
    }));
  }, [statistics]);

  const eggChartConfig: ChartConfig = {
    fertilized: { label: "유정란", color: STATISTICS_COLORS.fertilized },
    unfertilized: { label: "무정란", color: STATISTICS_COLORS.unfertilized },
    hatched: { label: "부화완료", color: STATISTICS_COLORS.hatched },
    dead: { label: "중지란", color: STATISTICS_COLORS.dead },
    pending: { label: "미정", color: STATISTICS_COLORS.pending },
  };

  const sexChartConfig: ChartConfig = {
    male: { label: "수컷", color: STATISTICS_COLORS.male },
    female: { label: "암컷", color: STATISTICS_COLORS.female },
    unknown: { label: "미확인", color: STATISTICS_COLORS.unknown },
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

      {!species ? (
        <div className="text-muted-foreground flex h-40 flex-col items-center justify-center text-sm">
          <Image src="/assets/lizard.png" alt="통계 데이터 없음" width={100} height={100} />
          종을 선택해주세요.
        </div>
      ) : isStatsLoading ? (
        <Loading />
      ) : statistics && statistics.egg.total > 0 ? (
        <div>
          {/* 메타 정보 */}
          <div className="my-4 grid grid-cols-2 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 sm:grid-cols-3 lg:grid-cols-5 dark:from-blue-900/30 dark:to-purple-900/30">
            <StatCard label="산란된 알" value={statistics.egg.total} />
            <StatCard
              label="인큐베이팅 중"
              value={statistics.egg.fertilized}
              valueClassName="text-[#3b82f6]"
            />
            <StatCard
              label="유정란 비율"
              value={`${statistics.egg.fertilizedRate.toFixed(1)}%`}
              valueClassName="text-[#ff9900ff]"
            />
            <StatCard
              label="부화 성공률"
              value={`${statistics.egg.hatchingRate.toFixed(1)}%`}
              valueClassName="text-[#1b9648ff]"
            />
            <StatCard label="메이팅 횟수" value={statistics.meta.totalMatings} />
            <StatCard label="산란 횟수" value={statistics.meta.totalLayings} />
          </div>

          {/* 월별 통계 차트 (연도만 선택된 경우) */}
          {selectedYear !== "all" && selectedMonth === "all" && statistics.monthlyStats && (
            <div className="mb-6">
              <ChartCard title={`${selectedYear}년 월별 통계`}>
                <MonthlyStatsChart data={statistics.monthlyStats} />
              </ChartCard>
            </div>
          )}

          {/* 차트 그리드 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 알 통계 파이 차트 */}
            {eggChartData.length > 0 && (
              <ChartCard title="알 상태 분포">
                <StatsPieChart
                  data={eggChartData}
                  config={eggChartConfig}
                  format={(value) => `${value}개`}
                />
              </ChartCard>
            )}

            {/* 성별 통계 파이 차트 */}
            {sexChartData.length > 0 && (
              <ChartCard
                title="성별 분포"
                footer={
                  <div className="mt-2 text-center text-sm font-[600] text-gray-700 dark:text-gray-300">
                    수컷 {statistics.sex.maleRate.toFixed(1)}% / 암컷{" "}
                    {statistics.sex.femaleRate.toFixed(1)}%
                  </div>
                }
              >
                <StatsPieChart
                  data={sexChartData}
                  config={sexChartConfig}
                  format={(value) => `${value}개`}
                />
              </ChartCard>
            )}

            {/* 모프 분포 바 차트 */}
            {morphChartData.length > 0 && (
              <ChartCard title="모프 분포">
                <StatsBarChart data={morphChartData} />
              </ChartCard>
            )}

            {/* 형질 분포 바 차트 */}
            {traitChartData.length > 0 && (
              <ChartCard title="형질 분포">
                <StatsBarChart data={traitChartData} />
              </ChartCard>
            )}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground mt-6 flex flex-col items-center text-sm">
          <Image src="/assets/lizard.png" alt="통계 데이터 없음" width={200} height={200} />
          조회된 해칭 내역이 없습니다.
        </div>
      )}
    </div>
  );
});

PairStatisticsDashboard.displayName = "PairStatisticsDashboard";

export default PairStatisticsDashboard;
