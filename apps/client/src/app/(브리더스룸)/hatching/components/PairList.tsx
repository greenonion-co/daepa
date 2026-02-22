import Loading from "@/components/common/Loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  matingControllerCreateMating,
  pairControllerDeletePair,
  pairControllerGetPairList,
  PetDtoSpecies,
  UpdatePairDto,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
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
import ConfirmDialog from "../../components/Form/Dialog";
import { CalendarEventDetail, EGG_STATUS } from "./PairMiniCalendar";
import { usePairCardTutorial } from "./PairCardTutorial";

export interface updatePairProps extends UpdatePairDto {
  pairId: number;
}

const PairList = memo(() => {
  const queryClient = useQueryClient();
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

  // 페어 삭제
  const { mutateAsync: deletePair } = useMutation({
    mutationFn: (pairId: number) => pairControllerDeletePair(pairId),
  });

  const handleDeletePair = (pairId: number) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <ConfirmDialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={async () => {
          try {
            await deletePair(pairId);
            toast.success("페어가 삭제되었습니다.");
            close();
            setIsOpen(false);
            setSelectedPairIndex(null);
            setInitialMatingId(null);
            setInitialLayingId(null);
            queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
          } catch (error) {
            if (error instanceof AxiosError) {
              toast.error(error.response?.data?.message ?? "페어 삭제에 실패했습니다.");
            } else {
              toast.error("페어 삭제에 실패했습니다.");
            }
          }
        }}
        onExit={unmount}
        title="페어 삭제"
        description={"정말로 이 페어를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다."}
      />
    ));
  };

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
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <h1 className="bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-3xl font-semibold text-transparent dark:from-[#8AB4F8] dark:via-[#C58AF9] dark:to-[#F28B82]">
          번식 관리를 시작해보세요
        </h1>
        <p className="mt-3 text-[15px] text-gray-500 dark:text-gray-400">
          페어를 등록하고 메이팅・산란・해칭까지 한눈에 관리할 수 있어요.
        </p>
        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="mt-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900"
        >
          <Plus className="h-4 w-4" />
          첫 페어 추가하기
        </button>
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
              onAddMating={async (date) => {
                await handleAddPairClick({
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
              onDelete={() => handleDeletePair(pair.pairId)}
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
