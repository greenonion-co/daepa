import { useQuery } from "@tanstack/react-query";
import { statisticsControllerGetPairStatistics, type EggStatisticsDto } from "@repo/api-client";

export interface PairStatisticsSummary {
  totalMatings: number;
  totalLayings: number;
  egg: EggStatisticsDto;
}

interface UsePairStatisticsResult {
  statistics: PairStatisticsSummary | null;
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

  const { data, isLoading } = useQuery({
    queryKey: [statisticsControllerGetPairStatistics.name, fatherId, motherId],
    queryFn: () => statisticsControllerGetPairStatistics({ fatherId, motherId }),
    select: (res) => {
      const { meta, egg } = res.data;
      return {
        totalMatings: meta.totalMatings,
        totalLayings: meta.totalLayings,
        egg,
        hasPair: meta.totalMatings > 0,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    statistics: data ? { totalMatings: data.totalMatings, totalLayings: data.totalLayings, egg: data.egg } : null,
    isLoading: enabled && isLoading,
    hasPair: data?.hasPair ?? false,
  };
}
