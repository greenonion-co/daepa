import { useCallback, useMemo } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  pairControllerGetPairList,
  matingControllerCreateMating,
  type CreateMatingDtoSpecies,
} from "@repo/api-client";
import { overlay } from "overlay-kit";
import { PairDetailContent } from "../components/PairDetailContent";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { usePairStatistics } from "./usePairStatistics";
import type { FamilyTreeNodeData, FamilyPetData } from "../lib/types";

interface PairChildInfo {
  petId: string;
  name?: string;
  sex?: string;
  morphs?: string[];
}

interface UsePairActionsParams {
  pairFatherId?: string;
  pairMotherId?: string;
  pairFather?: FamilyPetData;
  pairMother?: FamilyPetData;
  selectedNodes: string[];
  selectedPetA?: FamilyPetData;
  selectedPetB?: FamilyPetData;
  visibleNodes: FamilyTreeNodeData[];
  nodeKey: string;
  addPairEdge: (petIdA: string, petIdB: string) => void;
  removePairEdge: (petIdA: string, petIdB: string) => void;
  invalidatePair: () => void;
  queryClient: QueryClient;
  petId: string;
}

export function usePairActions({
  pairFatherId,
  pairMotherId,
  pairFather,
  pairMother,
  selectedNodes,
  selectedPetA,
  selectedPetB,
  visibleNodes,
  nodeKey,
  addPairEdge,
  removePairEdge,
  invalidatePair,
  queryClient,
  petId,
}: UsePairActionsParams) {
  // 클러치 이력 통계
  const {
    statistics: pairStatistics,
    isLoading: isPairStatsLoading,
    hasPair,
  } = usePairStatistics(selectedNodes[0], selectedNodes[1], selectedPetA?.sex, selectedPetB?.sex);

  // 트리에서 두 개체의 자식 목록
  const pairChildren: PairChildInfo[] = useMemo(() => {
    if (!pairFatherId || !pairMotherId) return [];
    const result: PairChildInfo[] = [];
    for (const node of visibleNodes) {
      if (
        (node.fatherId === pairFatherId && node.motherId === pairMotherId) ||
        (node.fatherId === pairMotherId && node.motherId === pairFatherId)
      ) {
        result.push({
          petId: node.petId,
          name: node.pet?.name,
          sex: node.pet?.sex,
          morphs: node.pet?.morphs,
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairFatherId, pairMotherId, nodeKey]);

  // 산란 추가 모달용 메이팅 목록 (저장 시 성별 정규화 보장)
  const { data: pairMatingsByDate } = useQuery({
    queryKey: ["pair-matings-for-laying", pairFatherId, pairMotherId],
    queryFn: async () => {
      const res = await pairControllerGetPairList({ fatherId: pairFatherId!, motherId: pairMotherId! });
      const data = res.data.data ?? [];
      if (data.length > 0) return data[0]!.matingsByDate;
      return [];
    },
    enabled: !!pairFatherId && !!pairMotherId,
    staleTime: 5 * 60 * 1000,
  });

  // 산란 추가 모달용 메이팅 날짜/시즌 계산
  const matingDatesForCalendar = useMemo(
    () => (pairMatingsByDate ?? []).map((m) => m.matingDate).filter(Boolean) as string[],
    [pairMatingsByDate],
  );
  const latestMatingSeasonForCalendar = useMemo(() => {
    const seasons = (pairMatingsByDate ?? [])
      .map((m) => m.season)
      .filter((s): s is number => s != null);
    return seasons.length > 0 ? Math.max(...seasons) : undefined;
  }, [pairMatingsByDate]);

  const handleAddMating = useCallback(
    async (matingDate: string, season: number) => {
      if (!pairFatherId || !pairMotherId) return;
      const species = (pairFather?.species ??
        pairMother?.species ??
        "CRESTED") as CreateMatingDtoSpecies;
      await matingControllerCreateMating({
        fatherId: pairFatherId,
        motherId: pairMotherId,
        matingDate,
        season,
        species,
      });
      addPairEdge(pairFatherId, pairMotherId);
      invalidatePair();
      queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
    },
    [
      pairFatherId,
      pairMotherId,
      pairFather?.species,
      pairMother?.species,
      addPairEdge,
      queryClient,
      petId,
      invalidatePair,
    ],
  );

  // 번식 이력 상세 모달
  const handleViewPairDetail = useCallback(() => {
    if (!pairFatherId || !pairMotherId) return;
    const fId = pairFatherId;
    const mId = pairMotherId;
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="mt-[-10px] h-[90vh] max-h-[700px] max-w-xl overflow-y-auto rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>번식 이력</DialogTitle>
          </VisuallyHidden>
          <PairDetailContent
            fatherId={fId}
            motherId={mId}
            onDataChange={async () => {
              invalidatePair();
              queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
              try {
                const res = await pairControllerGetPairList({ fatherId: fId, motherId: mId });
                const data = res.data.data ?? [];
                const hasMating = data.some(
                  (p) => (p.matingsByDate?.length ?? 0) > 0,
                );
                if (!hasMating) {
                  removePairEdge(fId, mId);
                }
              } catch {
                // 실패 시 무시 (family tree refetch가 처리)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [pairFatherId, pairMotherId, queryClient, petId, invalidatePair, removePairEdge]);

  return {
    pairStatistics,
    isPairStatsLoading,
    hasPair,
    pairChildren,
    pairMatingsByDate,
    matingDatesForCalendar,
    latestMatingSeasonForCalendar,
    handleAddMating,
    handleViewPairDetail,
  };
}
