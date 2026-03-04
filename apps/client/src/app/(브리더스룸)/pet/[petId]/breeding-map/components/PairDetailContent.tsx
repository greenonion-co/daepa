"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePairInvalidate } from "../../../../hatching/hooks/usePairInvalidate";
import { compact } from "es-toolkit";
import { DateTime } from "luxon";
import { Pencil, Trash2, ChevronLeft } from "lucide-react";
import { overlay } from "overlay-kit";
import { AxiosError } from "axios";
import {
  pairControllerGetPairList,
  matingControllerCreateMating,
  type MatingByParentsDto,
  type CreateMatingDtoSpecies,
} from "@repo/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import CreateLayingModal from "../../../../hatching/components/CreateLayingModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PairCard from "../../../../hatching/components/PairCard";
import { type CalendarEventDetail } from "../../../../hatching/components/PairMiniCalendar";
import MatingItem from "../../../../hatching/components/MatingItem";
import EditMatingModal from "../../../../hatching/components/EditMatingModal";
import DeleteMatingModal from "../../../../hatching/components/DeleteMatingModal";

function AddMatingSeasonDialog({
  isOpen,
  onClose,
  date,
  fatherId,
  motherId,
  latestSeason,
  species,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  fatherId: string;
  motherId: string;
  latestSeason: number;
  species: CreateMatingDtoSpecies;
  onSuccess: () => void;
}) {
  const [season, setSeason] = useState<number | undefined>(latestSeason > 0 ? latestSeason + 1 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!season || season < 1) {
      toast.error("시즌은 1 이상이어야 합니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await matingControllerCreateMating({
        fatherId,
        motherId,
        matingDate: date,
        season,
        species,
      });
      toast.success("메이팅이 추가되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
      } else {
        toast.error("메이팅 추가에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">메이팅 추가</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            {DateTime.fromISO(date).toFormat("yyyy년 MM월 dd일")}
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-xs font-semibold text-gray-600">시즌</label>
            <input
              type="number"
              min={1}
              className="h-7 w-16 rounded-md border border-gray-200 px-2 text-sm"
              value={season ?? ""}
              onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : undefined)}
            />
            {latestSeason > 0 && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                직전 시즌: {latestSeason}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-8 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// MatingDetailDialog lines 249~369 재현
function MatingDetailSection({
  matingGroup,
  selectedMatingId,
  onSelectMating,
  onInvalidate,
}: {
  matingGroup: MatingByParentsDto;
  selectedMatingId: number;
  onSelectMating: (id: number) => void;
  onInvalidate: () => void;
}) {
  const isEditable = !matingGroup.father?.isDeleted && !matingGroup.mother?.isDeleted;

  const matingDates = useMemo(
    () => compact(matingGroup.matingsByDate.map((m) => m.matingDate)),
    [matingGroup.matingsByDate],
  );

  const selectedMating = matingGroup.matingsByDate.find((m) => m.id === selectedMatingId);

  const handleEditClick = useCallback(() => {
    if (!selectedMating) return;
    overlay.open(({ isOpen, close }) => (
      <EditMatingModal
        isOpen={isOpen}
        onClose={() => {
          close();
          onInvalidate();
        }}
        matingId={selectedMating.id}
        currentData={{
          fatherId: matingGroup.father?.petId,
          motherId: matingGroup.mother?.petId,
          matingDate: selectedMating.matingDate ?? "",
          season: selectedMating.season,
        }}
        matingDates={matingDates}
      />
    ));
  }, [selectedMating, matingGroup, matingDates, onInvalidate]);

  const handleDeleteClick = useCallback(() => {
    if (!selectedMating) return;
    overlay.open(({ isOpen, close }) => (
      <DeleteMatingModal
        isOpen={isOpen}
        onClose={() => {
          close();
          onInvalidate();
        }}
        matingId={selectedMating.id}
        matingDate={selectedMating.matingDate}
      />
    ));
  }, [selectedMating, onInvalidate]);

  if (!matingGroup.matingsByDate.length) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">메이팅이 없습니다.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* 메이팅 날짜 선택 Select */}
        <Select value={String(selectedMatingId)} onValueChange={(v) => onSelectMating(Number(v))}>
          <SelectTrigger className="rounded-none border-0 border-b-[1.5px] border-b-gray-300 p-0 text-[18px] font-[600] dark:border-b-gray-600">
            {selectedMating ? (
              <div className="flex items-center gap-1 pl-1">
                <span className="rounded-lg bg-gray-100 p-1 px-2 text-[12px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {selectedMating.season}시즌
                </span>
                {selectedMating.matingDate
                  ? DateTime.fromFormat(selectedMating.matingDate, "yyyy-MM-dd").toFormat("M월 d일")
                  : ""}
              </div>
            ) : (
              <SelectValue placeholder="메이팅 날짜 선택" />
            )}
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {matingGroup.matingsByDate.map((mating) => (
              <SelectItem
                key={mating.id}
                value={String(mating.id)}
                className="rounded-xl text-[16px]"
              >
                <span className="mr-1 text-[12px] text-gray-500">{mating.season}시즌</span>
                {mating.matingDate
                  ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat("M월 d일")
                  : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 수정/삭제 버튼 */}
        {isEditable && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50"
              aria-label="교배 정보 수정"
              onClick={handleEditClick}
            >
              <Pencil className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50"
              aria-label="교배 정보 삭제"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* 선택된 메이팅 아이템 (MatingDetailDialog 350~364) */}
      {selectedMating && (
        <MatingItem
          mating={selectedMating}
          father={matingGroup.father}
          mother={matingGroup.mother}
        />
      )}
    </div>
  );
}

export function PairDetailContent({
  fatherId,
  motherId,
  onDataChange,
}: {
  fatherId: string;
  motherId: string;
  onDataChange?: () => void;
}) {
  const invalidatePair = usePairInvalidate();
  const [selectedMatingId, setSelectedMatingId] = useState<number | null>(null);

  const { data: pair, isLoading } = useQuery({
    queryKey: ["pair-detail-modal", fatherId, motherId],
    queryFn: async () => {
      const res = await pairControllerGetPairList({ fatherId, motherId, itemPerPage: 1 });
      const data = res.data.data ?? [];
      if (data.length > 0) return data[0] as MatingByParentsDto;
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleInvalidate = useCallback(() => {
    invalidatePair();
    onDataChange?.();
  }, [invalidatePair, onDataChange]);

  const handleAddMating = useCallback(
    (date: string) => {
      if (!pair) return;
      const fId = pair.father?.petId ?? fatherId;
      const mId = pair.mother?.petId ?? motherId;
      const latestSeason =
        pair.matingsByDate?.reduce((max, m) => Math.max(max, m.season ?? 0), 0) ?? 0;
      const species = pair.father?.species ?? "CR";

      overlay.open(({ isOpen, close }) => (
        <AddMatingSeasonDialog
          isOpen={isOpen}
          onClose={close}
          date={date}
          fatherId={fId}
          motherId={mId}
          latestSeason={latestSeason}
          species={species}
          onSuccess={handleInvalidate}
        />
      ));
    },
    [pair, fatherId, motherId, handleInvalidate],
  );

  const handleAddLaying = useCallback(
    (date: string) => {
      if (!pair) return;
      overlay.open(({ isOpen, close }) => (
        <CreateLayingModal
          isOpen={isOpen}
          onClose={() => {
            close();
            onDataChange?.();
          }}
          fatherId={pair.father?.petId ?? fatherId}
          motherId={pair.mother?.petId ?? motherId}
          initialLayingDate={date}
          isLayingDateEditable={false}
          matingsByDate={pair.matingsByDate}
        />
      ));
    },
    [pair, fatherId, motherId, onDataChange],
  );

  const handleDateClick = useCallback((event: CalendarEventDetail) => {
    setSelectedMatingId(event.matingId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (!pair) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">페어 정보를 불러올 수 없습니다.</p>
    );
  }

  const isDetailView = selectedMatingId !== null;

  if (!isDetailView) {
    return (
      <div className="flex flex-col gap-4">
        <span className="font-semibold">브리딩 상세</span>
        <PairCard
          pair={pair}
          onDescUpdated={handleInvalidate}
          onClick={() => {
            const firstMating = pair.matingsByDate?.[0];
            if (firstMating?.id) setSelectedMatingId(firstMating.id);
          }}
          onDateClick={handleDateClick}
          petThumbnailClickable={false}
          onAddMating={handleAddMating}
          onAddLaying={handleAddLaying}
          borderDisabled
        />
      </div>
    );
  }

  // 상세 뷰: 부모 카드 사라지고, 달력 상단 + 메이팅 상세
  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로 가기 */}
      <button
        type="button"
        onClick={() => setSelectedMatingId(null)}
        className="flex items-center gap-1 self-start text-sm font-semibold text-gray-700 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ChevronLeft className="h-4 w-4" />
        뒤로
      </button>

      {/* 메이팅 상세 (MatingDetailDialog 249~369) */}
      <div className="dark:border-gray-800">
        <MatingDetailSection
          matingGroup={pair}
          selectedMatingId={selectedMatingId}
          onSelectMating={setSelectedMatingId}
          onInvalidate={handleInvalidate}
        />
      </div>
    </div>
  );
}
