"use client";

import { PetDto } from "@repo/api-client";
import PetCard from "./PetCard";
import Loading from "@/components/common/Loading";

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
  if (isEmpty) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-lg">등록된 펫이 없습니다</p>
        <p className="mt-1 text-sm">새로운 펫을 등록해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2 pb-20">
      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((pet) => (
          <PetCard key={pet.petId} pet={pet} />
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
  );
}
