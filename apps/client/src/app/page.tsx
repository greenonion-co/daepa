"use client";

import { useState } from "react";
import { PetControllerFindAllFilterType } from "@repo/api-client";
import FloatingToggle from "@/components/common/FloatingToggle";
import PetList from "@/components/feed/PetList";

export default function Home() {
  const [filterType, setFilterType] = useState<PetControllerFindAllFilterType>(
    PetControllerFindAllFilterType.ALL,
  );

  return (
    <div className="relative w-full">
      {/* 전체 리스트 */}
      <div
        className={filterType === PetControllerFindAllFilterType.ALL ? "block" : "hidden"}
      >
        <PetList
          filterType={PetControllerFindAllFilterType.ALL}
          isVisible={filterType === PetControllerFindAllFilterType.ALL}
        />
      </div>

      {/* 내 펫 리스트 */}
      <div
        className={filterType === PetControllerFindAllFilterType.MY ? "block" : "hidden"}
      >
        <PetList
          filterType={PetControllerFindAllFilterType.MY}
          isVisible={filterType === PetControllerFindAllFilterType.MY}
        />
      </div>

      <FloatingToggle
        options={[
          { label: "전체", value: PetControllerFindAllFilterType.ALL },
          { label: "내 펫", value: PetControllerFindAllFilterType.MY },
        ]}
        value={filterType}
        onChange={setFilterType}
      />
    </div>
  );
}
