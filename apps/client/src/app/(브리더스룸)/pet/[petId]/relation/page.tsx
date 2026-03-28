"use client";

import {
  petControllerFindPetByPetId,
  petControllerGetChildrenByPetId,
  petControllerGetClutchMatesByPetId,
  petControllerGetParentsByPetId,
  petControllerGetSiblingsByPetId,
} from "@repo/api-client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { use, useMemo } from "react";
import SiblingPetCard from "./components/SiblingPetCard";
import HorizontalScrollSection from "./components/HorizontalScrollSection";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";

import Loading from "@/components/common/Loading";
import { BizGuard } from "@/app/(브리더스룸)/components/BizGuard";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function isVisiblePet(pet: unknown): pet is { petId: string } {
  return typeof pet === "object" && pet !== null && !("hiddenStatus" in pet);
}

const ITEM_PER_PAGE = 10;

function SiblingsPageContent({ params }: PetDetailPageProps) {
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

  const { data: myProfile } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  // 클러치 메이트 조회 (페이지네이션 없음, type: PET만)
  const {
    data: clutchMatesData,
    isLoading: isClutchMatesLoading,
    isError: isClutchMatesError,
  } = useQuery({
    queryKey: [petControllerGetClutchMatesByPetId.name, petId],
    queryFn: () => petControllerGetClutchMatesByPetId(petId, { type: "PET" }),
    select: (response) => response.data.data,
  });

  // 형제 무한 스크롤 (type: PET만)
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
        type: "PET",
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

  const isLoading =
    isSiblingsLoading || isParentsLoading || isChildrenLoading || isClutchMatesLoading;
  const isError = isSiblingsError || isParentsError || isChildrenError || isClutchMatesError;

  // 클러치 메이트 필터링 (visible한 펫만, type 필터는 백엔드에서 처리)
  const clutchMates = useMemo(() => {
    if (!clutchMatesData) return [];
    return clutchMatesData.filter(isVisiblePet);
  }, [clutchMatesData]);

  // 클러치 메이트 petId Set (중복 제거용)
  const clutchMateIds = useMemo(() => {
    return new Set(clutchMates.map((mate) => mate.petId));
  }, [clutchMates]);

  // 내 프로필 및 부모가 같은 펫 (클러치 메이트 제외)
  const { otherClutchSiblings } = useMemo(() => {
    if (!siblingsData?.siblings) {
      return { otherClutchSiblings: [] };
    }

    // siblings 분류 (자기 자신 및 클러치 메이트 제외, type 필터는 백엔드에서 처리)
    const otherClutch = siblingsData.siblings.filter((sibling) => {
      if (!isVisiblePet(sibling)) return false;
      if (sibling.petId === petId) return false; // 자기 자신 제외
      if (clutchMateIds.has(sibling.petId)) return false; // 클러치 메이트 제외
      return true;
    });

    return {
      otherClutchSiblings: otherClutch,
    };
  }, [siblingsData, petId, clutchMateIds]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-52px)]">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100dvh-52px)] flex-1 flex-col items-center justify-center gap-1">
        <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400">
          개체 정보를 불러오는 중 오류가 발생했습니다
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">잠시 후 다시 시도해주세요</p>
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
      <div className="flex gap-4">
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-gray-900 dark:text-gray-300">부</h2>
          {parentsData?.father ? (
            <HorizontalScrollSection>
              <SiblingPetCard pet={parentsData.father} />
            </HorizontalScrollSection>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">등록된 부개체 정보가 없습니다.</p>
          )}
        </section>
        <section className="min-w-0 overflow-hidden">
          <h2 className="mb-3 text-[16px] font-bold text-gray-900 dark:text-gray-300">모</h2>
          {parentsData?.mother ? (
            <HorizontalScrollSection>
              <SiblingPetCard pet={parentsData.mother} />
            </HorizontalScrollSection>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">등록된 모개체 정보가 없습니다.</p>
          )}
        </section>
      </div>
      <div className="flex gap-4">
        {/* 2. 내 프로필 */}
        {myProfile && (
          <section>
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">내 프로필</h2>
            <HorizontalScrollSection>
              <SiblingPetCard pet={myProfile} />
            </HorizontalScrollSection>
          </section>
        )}

        {/* 3. 클러치 메이트 */}
        <section className="min-w-0 overflow-hidden">
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">클러치메이트</h2>
          <HorizontalScrollSection>
            {clutchMates.length > 0 ? (
              clutchMates.map((mate) => <SiblingPetCard key={mate.petId} pet={mate} />)
            ) : (
              <div className="text-xs text-gray-500">클러치메이트가 없습니다.</div>
            )}
          </HorizontalScrollSection>
        </section>
      </div>

      {/* 4. 부모가 같은 펫 */}
      <section className="min-w-0 overflow-hidden">
        <h2 className="mb-3 text-[16px] font-bold text-gray-900">동배</h2>
        <HorizontalScrollSection
          hasMore={hasNextSiblings}
          isLoading={isFetchingNextSiblings}
          onReachEnd={fetchNextSiblings}
        >
          {otherClutchSiblings.length > 0 ? (
            otherClutchSiblings.map((sibling) => {
              return <SiblingPetCard key={sibling.petId} pet={sibling} />;
            })
          ) : (
            <div className="text-xs text-gray-500">동배 개체가 없습니다.</div>
          )}
        </HorizontalScrollSection>
      </section>

      {/* 5. 자식 펫 */}
      <section className="min-w-0 overflow-hidden">
        <h2 className="mb-3 text-[16px] font-bold text-gray-900">자식</h2>
        <HorizontalScrollSection
          hasMore={hasNextChildren}
          isLoading={isFetchingNextChildren}
          onReachEnd={fetchNextChildren}
        >
          {childrenData?.children && childrenData.children.length > 0 ? (
            childrenData.children.map((child) => <SiblingPetCard key={child.petId} pet={child} />)
          ) : (
            <div className="text-xs text-gray-500">자식 펫이 없습니다.</div>
          )}
        </HorizontalScrollSection>
      </section>
    </div>
  );
}

export default function SiblingsPage({ params }: PetDetailPageProps) {
  return (
    <BizGuard>
      <SiblingsPageContent params={params} />
    </BizGuard>
  );
}
