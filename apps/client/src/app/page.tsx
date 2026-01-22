"use client";

import { useState, useRef, useCallback } from "react";
import { PetControllerFindAllFilterType } from "@repo/api-client";
import FloatingToggle from "@/components/common/FloatingToggle";
import PetList from "@/components/feed/PetList";

export default function Home() {
  const [filterType, setFilterType] = useState<PetControllerFindAllFilterType>(
    PetControllerFindAllFilterType.ALL,
  );

  // 각 탭별 스크롤 위치 저장
  const scrollPositions = useRef<Record<string, number>>({});

  const handleFilterChange = useCallback(
    (newFilter: PetControllerFindAllFilterType) => {
      // 현재 스크롤 위치 저장
      scrollPositions.current[filterType] = window.scrollY;

      // 필터 변경
      setFilterType(newFilter);

      // 새 탭의 스크롤 위치로 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositions.current[newFilter] ?? 0);
      });
    },
    [filterType],
  );

  return (
    <div className="relative mx-auto max-w-[480px]" key={filterType}>
      {/* 현재 선택된 리스트만 렌더링 */}
      <PetList filterType={filterType} isVisible={true} />

      <FloatingToggle
        options={[
          { label: "전체", value: PetControllerFindAllFilterType.ALL },
          { label: "내 펫", value: PetControllerFindAllFilterType.MY },
        ]}
        value={filterType}
        onChange={handleFilterChange}
      />
    </div>
  );
}
