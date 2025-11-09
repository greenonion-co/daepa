import Loading from "@/components/common/Loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  brMatingControllerFindAll,
  MatingByParentsDto,
  matingControllerCreateMating,
  PetDtoSpecies,
  PetSummaryLayingDto,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsDown, Cake, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { memo, useEffect, useState } from "react";
import CreateMatingForm from "./CreateMatingForm";
import { AxiosError } from "axios";
import { useInView } from "react-intersection-observer";
import Filters from "./Filters";
import { useMatingFilterStore } from "../../store/matingFilter";
import { format } from "date-fns";
import { isNil, omitBy } from "es-toolkit";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import MatingDetailDialog from "./MatingDetailDialog";

const ParentInfo = ({ parent }: { parent: PetSummaryLayingDto | undefined }) => {
  if (!parent)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-[12px] text-gray-500">
        <TriangleAlert className="h-4 w-4" />
        정보없음
      </div>
    );

  return (
    <div className="flex flex-1 gap-1">
      <div className="flex flex-1 flex-col">
        <div className="mb-1 font-[500]">
          <span>{parent.name}</span>
          {parent.weight && (
            <span className="ml-1 text-[12px] text-blue-600">
              | {Number(parent.weight).toLocaleString()}g
            </span>
          )}
        </div>

        {(parent.morphs || parent.traits) && (
          <div className="flex flex-col justify-center">
            {parent.morphs && (
              <span className="text-xs text-gray-500">{parent.morphs.join(" | ")}</span>
            )}
            {parent.traits && (
              <span className="text-xs text-gray-500">{parent.traits.join(" | ")}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MatingList = memo(() => {
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const { species, father, mother, startDate, endDate, eggStatus } = useMatingFilterStore();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [matingGroup, setMatingGroup] = useState<MatingByParentsDto | null>(null);
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
      <div className={cn("flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100")}>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[14px] font-[500] text-blue-600">
          +
        </div>
        <div
          onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
          className="flex cursor-pointer items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600"
        >
          메이팅 추가하기
        </div>
      </div>
      {/* 폴더블 폼 */}
      {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}
      {/* 필터 */}
      <Filters />
      <div className="m-2 text-sm text-gray-600 dark:text-gray-400">
        검색된 메이팅・ {totalPairsCount}쌍
      </div>

      <ScrollArea>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((matingGroup, index) => (
            <div
              key={index}
              onClick={() => {
                setIsOpen(true);
                setMatingGroup(matingGroup);
              }}
              className="flex cursor-pointer flex-col gap-4 rounded-2xl bg-gray-100 px-4 py-4 shadow-md hover:shadow-xl dark:border-gray-700"
            >
              <div>
                <div className="flex flex-1 gap-2">
                  <ParentInfo parent={matingGroup.father} />
                  x
                  <ParentInfo parent={matingGroup.mother} />
                </div>
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

      <MatingDetailDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        matingGroup={matingGroup}
        onConfirmAdd={(matingDate) => {
          if (!matingGroup?.father || !matingGroup?.mother) {
            toast.error("부모 개체가 없습니다.");
            return;
          }
          handleAddMatingClick({
            species: matingGroup.father?.species,
            fatherId: matingGroup.father?.petId,
            motherId: matingGroup.mother?.petId,
            matingDate,
          }).then(() => setIsOpen(false));
        }}
      />
    </div>
  );
});

MatingList.displayName = "MatingList";

export default MatingList;
