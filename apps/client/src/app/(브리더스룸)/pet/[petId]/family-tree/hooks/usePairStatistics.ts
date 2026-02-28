import { useQuery } from "@tanstack/react-query";
import {
  pairControllerGetPairList,
  statisticsControllerGetPairSummary,
  type PairSummaryDto,
} from "@repo/api-client";

interface UsePairStatisticsResult {
  statistics: PairSummaryDto | null;
  isLoading: boolean;
  hasPair: boolean;
}

function determinePairRoles(
  petIdA: string,
  petIdB: string,
  sexA?: string,
  sexB?: string,
): { fatherId: string; motherId: string } {
  const isMaleA = sexA === "M" || sexA === "MALE";
  const isFemaleB = sexB === "F" || sexB === "FEMALE";
  const isFemaleA = sexA === "F" || sexA === "FEMALE";
  const isMaleB = sexB === "M" || sexB === "MALE";

  if (isMaleA && isFemaleB) return { fatherId: petIdA, motherId: petIdB };
  if (isFemaleA && isMaleB) return { fatherId: petIdB, motherId: petIdA };
  return { fatherId: petIdA, motherId: petIdB };
}

export function usePairStatistics(
  petIdA?: string,
  petIdB?: string,
  sexA?: string,
  sexB?: string,
): UsePairStatisticsResult {
  const enabled = !!petIdA && !!petIdB;
  const { fatherId, motherId } = enabled
    ? determinePairRoles(petIdA!, petIdB!, sexA, sexB)
    : { fatherId: undefined, motherId: undefined };

  // 페어 존재 여부 확인 (양방향 시도)
  const { data: pairData, isLoading: isPairLoading } = useQuery({
    queryKey: ["pair-lookup", fatherId, motherId],
    queryFn: async () => {
      const [res, resRev] = await Promise.all([
        pairControllerGetPairList({ fatherId, motherId, itemPerPage: 1 }),
        pairControllerGetPairList({ fatherId: motherId, motherId: fatherId, itemPerPage: 1 }),
      ]);
      const pairs = res.data.data ?? [];
      if (pairs.length > 0) return { pairId: pairs[0]!.pairId, fatherId, motherId };
      const pairsRev = resRev.data.data ?? [];
      if (pairsRev.length > 0) return { pairId: pairsRev[0]!.pairId, fatherId: motherId, motherId: fatherId };
      return null;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedFatherId = pairData?.fatherId;
  const resolvedMotherId = pairData?.motherId;

  // 번식 이력 요약 fetch (새 전용 API: 산란 없어도 totalMatings 정확히 반환)
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["pair-summary", resolvedFatherId, resolvedMotherId],
    queryFn: () =>
      statisticsControllerGetPairSummary({
        fatherId: resolvedFatherId!,
        motherId: resolvedMotherId!,
      }),
    select: (res) => res.data,
    enabled: !!pairData && !!resolvedFatherId && !!resolvedMotherId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    statistics: statsData ?? null,
    isLoading: enabled && (isPairLoading || (!!pairData && isStatsLoading)),
    hasPair: !!pairData,
  };
}
