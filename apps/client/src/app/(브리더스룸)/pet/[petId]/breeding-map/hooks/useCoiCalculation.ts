import { useQuery } from "@tanstack/react-query";
import {
  buildPedigree,
  calculateCOI,
  type CoiLevel,
  type CommonAncestorDetail,
} from "../lib/coi";

interface UseCoiResult {
  coi: number;
  level: CoiLevel;
  commonAncestors: CommonAncestorDetail[];
  equivalentRelation: string;
  isLoading: boolean;
}

export function useCoiCalculation(
  petIdA?: string,
  petIdB?: string,
): UseCoiResult {
  const enabled = !!petIdA && !!petIdB;

  const { data, isLoading } = useQuery({
    queryKey: ["coi-calculation", petIdA, petIdB],
    queryFn: async () => {
      if (!petIdA || !petIdB) {
        return {
          coi: 0,
          level: "safe" as CoiLevel,
          commonAncestors: [],
          equivalentRelation: "무관",
        };
      }

      const pedigree = await buildPedigree([petIdA, petIdB], 5);
      return calculateCOI(petIdA, petIdB, pedigree);
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    coi: data?.coi ?? 0,
    level: data?.level ?? "safe",
    commonAncestors: data?.commonAncestors ?? [],
    equivalentRelation: data?.equivalentRelation ?? "무관",
    isLoading: enabled && isLoading,
  };
}
