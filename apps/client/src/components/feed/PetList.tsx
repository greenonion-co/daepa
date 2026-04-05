"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { petControllerFindAll, PetControllerFindAllFilterType } from "@repo/api-client";
import FeedPetCard from "@/components/feed/FeedPetCard";
import Loading from "@/components/common/Loading";
import { tokenStorage } from "@/lib/tokenStorage";
import { isNativeApp, navigate } from "@/lib/native-bridge";
import LoadingScreen from "@/app/loading";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useSearchKeywordStore } from "@/app/(브리더스룸)/store/searchKeyword";

const ITEMS_PER_PAGE = 10;

interface PetListProps {
  filterType: PetControllerFindAllFilterType;
  isVisible: boolean;
}

export default function PetList({ filterType, isVisible }: PetListProps) {
  const router = useAppRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { searchKeyword } = useSearchKeywordStore();

  const handleRegisterClick = () => {
    if (tokenStorage.hasToken()) {
      router.push("/register/1");
    } else {
      if (isNativeApp()) {
        navigate({ screen: "Login" });
      } else {
        router.push("/sign-in");
      }
    }
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: [petControllerFindAll.name, filterType, searchKeyword],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await petControllerFindAll({
          page: pageParam,
          itemPerPage: ITEMS_PER_PAGE,
          order: "DESC",
          filterType,
          keyword: searchKeyword,
          isPublic: 1,
        });
        return result;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.data.meta.hasNextPage) {
          return lastPage.data.meta.page + 1;
        }
        return undefined;
      },
      select: (resp) => ({
        items: resp.pages.flatMap((p) => p.data.data),
        totalCount: resp.pages[0]?.data.meta.totalCount ?? 0,
      }),
    });

  const { items: allPets } = data ?? { items: [], totalCount: 0 };

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage && isVisible) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isVisible],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !isVisible) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, isVisible]);

  if (isLoading) return <LoadingScreen />;

  if (isError) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-lg font-[600] text-gray-900 dark:text-gray-300">
          피드를 불러오는데 실패했습니다
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (allPets.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-52px)] w-full flex-col items-center justify-center px-4 py-20">
        <h1 className="bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-2xl font-semibold text-transparent dark:from-[#8AB4F8] dark:via-[#C58AF9] dark:to-[#F28B82]">
          {filterType === PetControllerFindAllFilterType.ALL
            ? "아직 공개된 개체가 없어요"
            : "개체 관리를 시작해보세요"}
        </h1>

        <button
          type="button"
          onClick={handleRegisterClick}
          className="focus-visible:ring-ring mt-3 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          개체 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {allPets.map((pet) => (
        <FeedPetCard key={pet.petId} pet={pet} />
      ))}
      <div ref={loadMoreRef} className="flex justify-center py-4 pb-20">
        {isFetchingNextPage && <Loading />}
        {!hasNextPage && allPets.length > 0 && (
          <p className="text-sm text-gray-400">모든 개체를 불러왔습니다</p>
        )}
      </div>
    </div>
  );
}
