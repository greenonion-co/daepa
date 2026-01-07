import Loading from "@/components/common/Loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  matingControllerCreateMating,
  pairControllerGetPairList,
  PetDtoSpecies,
  UpdatePairDto,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { memo, useEffect, useState } from "react";
import CreateMatingForm from "./CreateMatingForm";
import CreateLayingModal from "./CreateLayingModal";
import { AxiosError } from "axios";
import { useInView } from "react-intersection-observer";
import Filters from "./Filters";
import { useMatingFilterStore } from "../../store/matingFilter";
import { DateTime } from "luxon";
import { isNil, omitBy } from "es-toolkit";
import { cn } from "@/lib/utils";
import MatingDetailDialog from "./MatingDetailDialog";
import PairCard from "./PairCard";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpdatePairModal from "./UpdatePairModal";
import Image from "next/image";
import { CalendarEventDetail, EGG_STATUS } from "./PairMiniCalendar";
import { usePairCardTutorial } from "./PairCardTutorial";

export interface updatePairProps extends UpdatePairDto {
  pairId: number;
}

const PairList = memo(() => {
  const { ref, inView } = useInView();
  const { species, father, mother, startDate, endDate, eggStatus } = useMatingFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);
  const [initialMatingId, setInitialMatingId] = useState<number | null>(null);
  const [initialLayingId, setInitialLayingId] = useState<number | null>(null);
  const { showTutorial, openTutorial, closeTutorial } = usePairCardTutorial();
  const itemPerPage = 10;

  const hasFilter = !!father?.petId || !!mother?.petId || !!startDate || !!endDate || !!eggStatus;

  // 메이팅 조회 (무한 스크롤)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: [
        pairControllerGetPairList.name,
        species,
        father?.petId,
        mother?.petId,
        startDate,
        endDate,
        eggStatus,
      ],
      queryFn: ({ pageParam = 1 }) => {
        const startYmd =
          startDate && DateTime.fromISO(startDate).isValid
            ? DateTime.fromISO(startDate).toFormat("yyyy-MM-dd")
            : undefined;
        const endYmd =
          endDate && DateTime.fromISO(endDate).isValid
            ? DateTime.fromISO(endDate).toFormat("yyyy-MM-dd")
            : undefined;

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

        return pairControllerGetPairList({
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

  const pair = selectedPairIndex !== null ? (data?.items[selectedPairIndex] ?? null) : null;

  // 메이팅 추가
  const { mutateAsync: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
  });

  const handleClickUpdateDesc = (pair: updatePairProps) => {
    if (!pair?.pairId) return toast.error("오류가 발생했습니다. 잠시후에 다시 시도해주세요.");

    overlay.open(({ isOpen, close }) => (
      <UpdatePairModal
        pair={pair}
        isOpen={isOpen}
        close={close}
        onSuccess={async () => {
          await refetch();
        }}
      />
    ));
  };

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  const handleOpenCreateForm = () => {
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>새 페어 추가</DialogTitle>
          </DialogHeader>
          <CreateMatingForm onClose={close} />
        </DialogContent>
      </Dialog>
    ));
  };

  if (data?.items && data.items.length === 0 && !hasFilter) {
    return (
      <div className="flex items-center justify-center py-5 text-center">
        <div
          className="group flex cursor-pointer flex-col items-center rounded-3xl bg-gradient-to-b from-[#e5cf94] to-[#fffcf2] p-10 pt-5 transition-all hover:scale-105 hover:shadow-xl dark:from-[#5a4a2a] dark:to-[#2a2a20]"
          onClick={handleOpenCreateForm}
        >
          <Image src="/assets/lizard.png" alt="브리더스룸 로그인 로고" width={200} height={200} />
          <div className="text-gray-600 dark:text-gray-300">개체를 추가해 관리를 시작해보세요!</div>
          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#c4a86a] px-4 py-2 text-sm font-semibold text-white transition-all group-hover:bg-[#a8904f] dark:bg-[#8a7a4a] dark:group-hover:bg-[#6a5a3a]">
            <Plus className="h-4 w-4" />
            페어 추가하기
          </div>
        </div>
      </div>
    );
  }

  const handleAddPairClick = async ({
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

      toast.success("페어 정보가 추가되었습니다.");
      const result = await refetch();

      // 새로운 데이터에서 현재 pair와 동일한 페어를 찾아서 index 업데이트
      if (result.data?.items && pair) {
        const updatedIndex = result.data.items.findIndex(
          (item) =>
            item.father?.petId === pair.father?.petId && item.mother?.petId === pair.mother?.petId,
        );
        if (updatedIndex !== -1) {
          setSelectedPairIndex(updatedIndex);
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "페어 정보 추가에 실패했습니다.");
      } else {
        toast.error("페어 정보 추가에 실패했습니다.");
      }
    }
  };

  if (!data) return null;

  return (
    <div className="flex flex-col px-2">
      {/* 헤더 영역 */}
      <div
        className={cn(
          "flex w-fit cursor-pointer items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800",
        )}
        onClick={handleOpenCreateForm}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[14px] font-[500] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <Plus className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
          페어 추가하기
        </div>
      </div>
      {/* 필터 */}
      <Filters />
      <div className="flex items-center">
        <div className="m-2 text-sm text-gray-600 dark:text-gray-400">
          검색된 페어 {data.totalCount}쌍
        </div>
        {data.totalCount > 0 && (
          <button
            type="button"
            onClick={openTutorial}
            className="flex h-6 items-center gap-0.5 rounded-lg px-1 text-[13px] text-green-600 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-700/50"
          >
            <HelpCircle className="h-4 w-4" />
            <span>사용법</span>
          </button>
        )}
      </div>

      <ScrollArea>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
          {data?.items.map((pair, index) => (
            <PairCard
              key={index}
              pair={pair}
              onClickUpdateDesc={handleClickUpdateDesc}
              onClick={() => {
                setIsOpen(true);
                setSelectedPairIndex(index);
                setInitialMatingId(null);
              }}
              onDateClick={(eventData: CalendarEventDetail) => {
                setIsOpen(true);
                setSelectedPairIndex(index);
                setInitialMatingId(eventData.matingId);

                // 이벤트 타입에 따라 포커스 대상 설정
                if (eventData.eventType === EGG_STATUS.MATING) {
                  // 메이팅 탭으로 포커스 (matingId만 설정)
                  setInitialLayingId(null);
                } else {
                  // 산란으로 포커스
                  setInitialLayingId(eventData.layingId ?? null);
                }
              }}
              onAddMating={(date) => {
                handleAddPairClick({
                  species: pair.father?.species,
                  fatherId: pair.father?.petId,
                  motherId: pair.mother?.petId,
                  matingDate: date,
                });
              }}
              onAddLaying={(date) => {
                overlay.open(({ isOpen, close }) => (
                  <CreateLayingModal
                    isOpen={isOpen}
                    onClose={close}
                    fatherId={pair.father?.petId}
                    motherId={pair.mother?.petId}
                    initialLayingDate={date}
                    isLayingDateEditable={false}
                    matingsByDate={pair.matingsByDate}
                  />
                ));
              }}
              showTutorial={index === 0 && showTutorial}
              onCloseTutorial={closeTutorial}
            />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} className="h-20 text-center">
            {isFetchingNextPage && <Loading />}
          </div>
        )}
        <div className="h-10" />
      </ScrollArea>

      <MatingDetailDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setInitialMatingId(null);
          setInitialLayingId(null);
        }}
        matingGroup={pair}
        initialMatingId={initialMatingId}
        initialLayingId={initialLayingId}
        onConfirmAdd={async (matingDate) => {
          if (!pair?.father || !pair?.mother) {
            toast.error("부모 개체가 없습니다.");
            return;
          }
          await handleAddPairClick({
            species: pair.father?.species,
            fatherId: pair.father?.petId,
            motherId: pair.mother?.petId,
            matingDate,
          });
        }}
      />
    </div>
  );
});

PairList.displayName = "PairList";

export default PairList;
