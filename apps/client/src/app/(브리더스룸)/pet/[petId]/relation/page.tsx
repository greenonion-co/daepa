"use client";

import {
  petControllerGetChildrenByPetId,
  petControllerGetParentsByPetId,
  petControllerGetSiblingsByPetId,
  SiblingPetDetailDto,
} from "@repo/api-client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { use, useMemo } from "react";
import SiblingPetCard from "./components/SiblingPetCard";
import HorizontalScrollSection from "./components/HorizontalScrollSection";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import Image from "next/image";
import Loading from "@/components/common/Loading";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function isVisiblePet(pet: unknown): pet is SiblingPetDetailDto {
  return typeof pet === "object" && pet !== null && !("hiddenStatus" in pet);
}

const ITEM_PER_PAGE = 10;

function SiblingsPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);
  const isMobile = useIsMobile();

  const {
    data: parentsData,
    isLoading: isParentsLoading,
    isError: isParentsError,
  } = useQuery({
    queryKey: [petControllerGetParentsByPetId.name, petId],
    queryFn: () => petControllerGetParentsByPetId(petId, { statuses: ["approved"] }),
    select: (response) => response.data.data,
  });

  // 형제 무한 스크롤
  const {
    data: siblingsData,
    isLoading: isSiblingsLoading,
    isError: isSiblingsError,
    fetchNextPage: fetchNextSiblings,
    hasNextPage: hasNextSiblings,
    isFetchingNextPage: isFetchingNextSiblings,
  } = useInfiniteQuery({
    queryKey: [petControllerGetSiblingsByPetId.name, petId],
    queryFn: ({ pageParam = 1 }) =>
      petControllerGetSiblingsByPetId(petId, {
        page: pageParam,
        itemPerPage: ITEM_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (resp) => ({
      siblings: resp.pages.flatMap((p) => p.data.data ?? []),
    }),
  });

  // 자식 무한 스크롤
  const {
    data: childrenData,
    isLoading: isChildrenLoading,
    isError: isChildrenError,
    fetchNextPage: fetchNextChildren,
    hasNextPage: hasNextChildren,
    isFetchingNextPage: isFetchingNextChildren,
  } = useInfiniteQuery({
    queryKey: [petControllerGetChildrenByPetId.name, petId],
    queryFn: ({ pageParam = 1 }) =>
      petControllerGetChildrenByPetId(petId, {
        page: pageParam,
        itemPerPage: ITEM_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (resp) => ({
      children: resp.pages.flatMap((p) => p.data.data ?? []),
    }),
  });

  const isLoading = isSiblingsLoading || isParentsLoading || isChildrenLoading;
  const isError = isSiblingsError || isParentsError || isChildrenError;

  const { myProfile, sameClutchSiblings, otherClutchSiblings } = useMemo(() => {
    if (!siblingsData?.siblings) {
      return { myProfile: null, sameClutchSiblings: [], otherClutchSiblings: [] };
    }

    // 자기 자신 찾기
    const me = siblingsData.siblings.find(
      (sibling) => isVisiblePet(sibling) && sibling.petId === petId,
    ) as SiblingPetDetailDto | undefined;

    // 자기 자신의 layingDate
    const myLayingDate = me?.laying?.layingDate;

    // siblings 분류 (자기 자신 제외)
    const others = siblingsData.siblings.filter((sibling) => sibling.petId !== petId);

    const sameClutch = others.filter((sibling) => {
      if (!isVisiblePet(sibling)) return false;
      if (!myLayingDate || !sibling.laying?.layingDate) return false;
      return sibling.laying.layingDate === myLayingDate;
    });

    const otherClutch = others.filter((sibling) => {
      if (!isVisiblePet(sibling)) return false;
      if (!myLayingDate || !sibling.laying?.layingDate) return true;
      return sibling.laying.layingDate !== myLayingDate;
    });

    return {
      myProfile: me ?? null,
      sameClutchSiblings: sameClutch,
      otherClutchSiblings: [...otherClutch],
    };
  }, [siblingsData, petId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-52px)]">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-52px)] flex-1 flex-col items-center justify-center gap-1">
        <Image src="/assets/lizard.png" alt="관계도 에러 펫" width={150} height={150} />
        <p className="text-lg font-semibold text-gray-700">
          펫 정보를 불러오는 중 오류가 발생했습니다
        </p>
        <p className="text-sm text-gray-500">잠시 후 다시 시도해주세요 </p>
      </div>
    );
  }

  if (!siblingsData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">형제 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 p-4", isMobile && "p-2")}>
      {/* 1. 부모 프로필 */}
      {(parentsData?.father || parentsData?.mother) && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">부모</h2>
          <HorizontalScrollSection>
            {parentsData.father && (
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-blue-600">부</span>
                <SiblingPetCard pet={parentsData.father} />
              </div>
            )}
            {parentsData.mother && (
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-red-600">모</span>
                <SiblingPetCard pet={parentsData.mother} />
              </div>
            )}
          </HorizontalScrollSection>
        </section>
      )}
      <div className="flex gap-4">
        {/* 2. 내 프로필 */}
        {myProfile && (
          <section>
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">내 프로필</h2>
            <SiblingPetCard pet={myProfile} />
          </section>
        )}

        {/* 3. 클러치 메이트 */}
        <section className="min-w-0 overflow-hidden">
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">클러치 메이트</h2>
          {sameClutchSiblings.length > 0 ? (
            <HorizontalScrollSection
              hasMore={hasNextSiblings}
              isLoading={isFetchingNextSiblings}
              onReachEnd={fetchNextSiblings}
            >
              {sameClutchSiblings.map((sibling) => (
                <SiblingPetCard key={sibling.petId} pet={sibling} />
              ))}
            </HorizontalScrollSection>
          ) : (
            <div className="text-xs text-gray-500">클러치 메이트가 없습니다.</div>
          )}
        </section>
      </div>

      {/* 4. 부모가 같은 펫 */}
      <section className="min-w-0 overflow-hidden">
        <h2 className="mb-3 text-[16px] font-bold text-gray-900">부모가 같은 펫</h2>
        {otherClutchSiblings.length > 0 ? (
          <HorizontalScrollSection
            hasMore={hasNextSiblings}
            isLoading={isFetchingNextSiblings}
            onReachEnd={fetchNextSiblings}
          >
            {otherClutchSiblings.map((sibling) => (
              <SiblingPetCard key={sibling.petId} pet={sibling} />
            ))}
          </HorizontalScrollSection>
        ) : (
          <div className="text-xs text-gray-500">부모가 같은 펫이 없습니다.</div>
        )}
      </section>

      {/* 5. 자식 펫 */}
      <section className="min-w-0 overflow-hidden">
        <h2 className="mb-3 text-[16px] font-bold text-gray-900">자식</h2>
        {childrenData?.children && childrenData.children.length > 0 ? (
          <HorizontalScrollSection
            hasMore={hasNextChildren}
            isLoading={isFetchingNextChildren}
            onReachEnd={fetchNextChildren}
          >
            {childrenData.children.map((child) => (
              <SiblingPetCard key={child.petId} pet={child} />
            ))}
          </HorizontalScrollSection>
        ) : (
          <div className="text-xs text-gray-500">자식 펫이 없습니다.</div>
        )}
      </section>

      {/* 형제가 없는 경우 */}
      {sameClutchSiblings.length === 0 && otherClutchSiblings.length === 0 && (
        <div className="flex h-32 items-center justify-center text-gray-500">형제가 없습니다.</div>
      )}
    </div>
  );
}

export default SiblingsPage;
