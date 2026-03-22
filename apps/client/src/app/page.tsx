"use client";

import { PetControllerFindAllFilterType } from "@repo/api-client";
import PetList from "@/components/feed/PetList";

export default function Home() {
  return (
    <div className="relative mx-auto max-w-[480px]">
      {/* 현재 선택된 리스트만 렌더링 */}
      <PetList filterType={PetControllerFindAllFilterType.ALL} isVisible={true} />

      {/*{isLoggedIn && (*/}
      {/*  <FloatingToggle*/}
      {/*    options={[*/}
      {/*      { label: "전체", value: PetControllerFindAllFilterType.ALL },*/}
      {/*      { label: "MY", value: PetControllerFindAllFilterType.MY },*/}
      {/*    ]}*/}
      {/*    value={filterType}*/}
      {/*    onChange={handleFilterChange}*/}
      {/*  />*/}
      {/*)}*/}
    </div>
  );
}
