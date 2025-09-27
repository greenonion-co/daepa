import Loading from "@/components/common/Loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  brMatingControllerFindAll,
  MatingByDateDto,
  matingControllerCreateMating,
  PetDtoSpecies,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronUp, ChevronDown, ChevronsDown, Cake } from "lucide-react";
import MatingItem from "./MatingItem";
import { toast } from "sonner";
import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CalendarSelect from "./CalendarSelect";
import { Button } from "@/components/ui/button";
import CreateMatingForm from "./CreateMatingForm";
import { AxiosError } from "axios";
import { useInView } from "react-intersection-observer";
import Filters from "./Filters";
import { useMatingFilterStore } from "../../store/matingFilter";
import { format } from "date-fns";
import { compact, isNil, omitBy } from "es-toolkit";
import { Card } from "@/components/ui/card";

const MatingList = memo(() => {
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const { species, father, mother, startDate, endDate, eggStatus } = useMatingFilterStore();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const itemPerPage = 10;

  const hasFilter =
    !!species || !!father?.petId || !!mother?.petId || !!startDate || !!endDate || !!eggStatus;

  // 메이팅 조회 (무한 스크롤)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [
      brMatingControllerFindAll.name,
      species,
      father?.petId,
      mother?.petId,
      startDate,
      endDate,
      eggStatus,
    ],
    queryFn: ({ pageParam = 1 }) => {
      const startYmd = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
      const endYmd = endDate ? format(endDate, "yyyy-MM-dd") : undefined;
      const filter = omitBy(
        {
          species: species ?? undefined,
          fatherId: father?.petId,
          motherId: mother?.petId,
          startYmd,
          endYmd,
          eggStatus: eggStatus ?? undefined,
        },
        isNil,
      );

      return brMatingControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
        ...filter,
      });
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

  // 메이팅 추가
  const { mutateAsync: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
  });

  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const getMatingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return compact(matingDates.map((mating) => mating.matingDate));
  }, []);

  const { items, totalCount: totalPairsCount } = data ?? { items: [], totalCount: 0 };

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  if (items && items.length === 0 && !hasFilter) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <span className="inline-flex animate-bounce items-center gap-2 rounded-full bg-blue-900/90 px-4 py-2 text-sm text-white">
          <ChevronsDown className="h-4 w-4" />
          클릭해서 메이팅을 추가해보세요!
        </span>
        <Card
          className="flex w-full cursor-pointer flex-col items-center justify-center bg-blue-50 p-10 hover:bg-blue-100 dark:bg-gray-900 dark:text-gray-200"
          onClick={() => setIsCreateFormOpen((prev) => !prev)}
        >
          <Cake className="h-10 w-10 text-blue-500" />
          <div className="text-center text-gray-600 dark:text-gray-400">
            메이팅을
            <span className="text-blue-500">추가</span>하여
            <div className="font-semibold text-blue-500">편리하게 관리해보세요!</div>
          </div>
        </Card>

        {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}
      </div>
    );
  }

  const handleAddMatingClick = async ({
    species,
    fatherId,
    motherId,
    matingDate,
  }: {
    species?: PetDtoSpecies;
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  }) => {
    if (!species) {
      toast.error("종을 선택해주세요.");
      return;
    }

    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    try {
      await createMating({
        species,
        matingDate,
        fatherId,
        motherId,
      });

      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
      } else {
        toast.error("메이팅 추가에 실패했습니다.");
      }
    } finally {
      setIsCreateFormOpen(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold">메이팅 리스트</h2>

        <Button
          onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
          className="cursor-pointer gap-2 dark:bg-gray-800 dark:text-gray-200"
        >
          새 메이팅 추가
          {isCreateFormOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {/* 폴더블 폼 */}
      {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}
      {/* 필터 */}
      <Filters />
      <div className="m-2 text-sm text-gray-600 dark:text-gray-400">
        총 {totalPairsCount}쌍의 페어가 존재합니다.
      </div>
      <ScrollArea>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
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
                    disabledDates={getMatingDates(matingGroup?.matingsByDate ?? [])}
                    onConfirm={(matingDate) =>
                      handleAddMatingClick({
                        species: matingGroup.father?.species,
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
                    matingDates={getMatingDates(matingGroup?.matingsByDate ?? [])}
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
