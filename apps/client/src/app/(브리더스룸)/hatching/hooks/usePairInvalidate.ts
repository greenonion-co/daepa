"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pairControllerGetPairList, statisticsControllerGetPairStatistics } from "@repo/api-client";

/**
 * 페어 관련 데이터 전체를 무효화하는 훅.
 * 메이팅/산란/알 상태 변경 후 호출하면 관련 쿼리가 모두 갱신됩니다.
 */
export function usePairInvalidate() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    // 브리딩 메인 페이지의 페어 목록 무한스크롤 쿼리 (PairList.tsx)
    queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
    // 가계도 번식 이력 패널에서 페어 존재 여부 확인용 쿼리 (usePairStatistics.ts)
    queryClient.invalidateQueries({ queryKey: ["pair-lookup"] });
    // 가계도 번식 이력 패널의 요약 통계 쿼리 — GET /v1/statistics/pair-summary (usePairStatistics.ts)
    queryClient.invalidateQueries({ queryKey: ["pair-summary"] });
    // 가계도 '브리딩 상세' 패널의 메이팅/산란 상세 데이터 쿼리 (PairDetailContent.tsx)
    queryClient.invalidateQueries({ queryKey: ["pair-detail-modal"] });
    // PairStatisticsPanel 메이팅 추가 캘린더의 기존 메이팅 날짜 목록 쿼리 (FamilyTreeCanvas.tsx)
    queryClient.invalidateQueries({ queryKey: ["pair-matings-for-laying"] });
    // 브리딩 통계 대시보드의 메이팅/산란 집계 쿼리 — GET /v1/statistics/pair-statistics (PairStatisticsDashboard.tsx)
    queryClient.invalidateQueries({ queryKey: [statisticsControllerGetPairStatistics.name] });
  }, [queryClient]);
}
