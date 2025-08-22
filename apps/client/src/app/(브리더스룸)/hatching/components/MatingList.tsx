import Loading from "@/components/common/Loading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  brMatingControllerFindAll,
  CommonResponseDto,
  MatingByDateDto,
  matingControllerCreateMating,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Plus, ChevronUp, ChevronDown } from "lucide-react";
import MatingItem from "./MatingItem";
import { toast } from "sonner";
import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CalendarSelect from "./CalendarSelect";
import { Button } from "@/components/ui/button";
import CreateMatingForm from "./CreateMatingForm";
import { AxiosError } from "axios";
import { useInView } from "react-intersection-observer";

const MatingList = memo(() => {
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const itemPerPage = 10;

  // 메이팅 조회 (무한 스크롤)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brMatingControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      brMatingControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
      }),
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

  // 메이팅 추가
  const { mutate: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
    onSuccess: () => {
      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
    },
  });

  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const matingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return matingDates.map((mating) => mating.matingDate);
  }, []);

  const { items, totalCount } = data ?? { items: [], totalCount: 0 };

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                메이팅 현황
              </div>
              <Button
                onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                className="flex items-center gap-2"
              >
                {isCreateFormOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isCreateFormOpen ? "폼 닫기" : "새 메이팅 추가"}
              </Button>
            </CardTitle>
            <CardDescription>등록된 메이팅이 없습니다.</CardDescription>
          </CardHeader>
        </Card>

        {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}
      </div>
    );
  }

  const handleAddMatingClick = ({
    fatherId,
    motherId,
    matingDate,
  }: {
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  }) => {
    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    createMating({
      matingDate,
      fatherId,
      motherId,
    });
  };

  return (
    <div>
      {/* 헤더 영역 */}
      <Button
        onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
        className="flex items-center gap-2 dark:bg-gray-800 dark:text-gray-200"
      >
        새 메이팅 추가
        {isCreateFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* 폴더블 폼 */}
      {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}

      <div className="m-2 text-sm text-gray-600 dark:text-gray-400">검색 결과: {totalCount}개</div>

      <ScrollArea className="h-[700px]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((matingGroup, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border-2 border-pink-100 px-2 py-4 shadow-md dark:border-gray-700"
            >
              <div>
                <div className="flex flex-1 gap-2">
                  {matingGroup.father && (
                    <Link
                      href={`/pet/${matingGroup.father.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-blue-100 p-1 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      {matingGroup.father.name}
                    </Link>
                  )}
                  {matingGroup.mother && (
                    <Link
                      href={`/pet/${matingGroup.mother.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-pink-100 p-1 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:hover:bg-pink-800"
                    >
                      {matingGroup.mother.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-100 p-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-500 dark:hover:bg-yellow-800">
                  <CalendarSelect
                    triggerText="메이팅을 추가하려면 날짜를 선택하세요"
                    confirmButtonText="메이팅 추가"
                    disabledDates={matingDates(matingGroup?.matingsByDate ?? [])}
                    onConfirm={(matingDate) =>
                      handleAddMatingClick({
                        fatherId: matingGroup.father?.petId,
                        motherId: matingGroup.mother?.petId,
                        matingDate,
                      })
                    }
                  />
                </div>
                {matingGroup.matingsByDate.map((mating) => (
                  <MatingItem
                    key={mating.id}
                    mating={mating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                    matingDates={matingDates(matingGroup?.matingsByDate ?? [])}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref}>
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
              </div>
            ) : (
              <Loading />
            )}
          </div>
        )}
        <div className="h-10" />
      </ScrollArea>
    </div>
  );
});

MatingList.displayName = "MatingList";

export default MatingList;
