"use client";

import { PetDto } from "@repo/api-client";
import PetCard from "./PetCard";
import Loading from "@/components/common/Loading";
import React, { useState, useCallback } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useIsMobile } from "@/hooks/useMobile";
import PetDetailModal from "../[petId]/components/PetDetailModal";
import useTableStore from "../store/table";

interface PetCardListProps {
  data: PetDto[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction?: (node?: Element | null) => void;
  isEmpty?: boolean;
}

export default function PetCardList({
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  isEmpty,
}: PetCardListProps) {
  const isMobile = useIsMobile();
  const router = useAppRouter();
  const [selectedPet, setSelectedPet] = useState<PetDto | null>(null);
  const { isExportMode, rowSelection, setRowSelection } = useTableStore();

  const handleCardClick = useCallback(
    (pet: PetDto) => {
      if (isExportMode) {
        setRowSelection((prev) => {
          const next = { ...prev };
          if (next[pet.petId]) {
            delete next[pet.petId];
          } else {
            next[pet.petId] = true;
          }
          return next;
        });
        return;
      }
      if (isMobile) {
        router.push(`/pet/${pet.petId}`);
      } else {
        setSelectedPet(pet);
      }
    },
    [isMobile, router, isExportMode, setRowSelection],
  );

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <h1 className="bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-2xl font-semibold text-transparent dark:from-[#8AB4F8] dark:via-[#C58AF9] dark:to-[#F28B82]">
          개체 관리를 시작해보세요
        </h1>
        <p className="mt-1 text-[15px] text-gray-500 dark:text-gray-400">
          첫 개체를 등록하고 체계적으로 관리할 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/register/1")}
          className="focus-visible:ring-ring mt-3 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          개체 등록하기
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="space-y-2 px-2 pb-20">
        {/* 카드 그리드 */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-2">
          {data.map((pet) => (
            <PetCard
              key={pet.petId}
              pet={pet}
              onCardClick={handleCardClick}
              isExportMode={isExportMode}
              isSelected={!!rowSelection[pet.petId]}
            />
          ))}
        </div>

        {/* 무한 스크롤 로더 */}
        {hasMore ? (
          <div ref={loaderRefAction} className="flex justify-center py-4">
            {isFetchingMore && <Loading />}
          </div>
        ) : (
          <span className="m-10 block text-center text-sm text-gray-400">
            데이터를 모두 불러왔습니다.
          </span>
        )}
      </div>

      {selectedPet && (
        <PetDetailModal
          isOpen={!!selectedPet}
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </>
  );
}
