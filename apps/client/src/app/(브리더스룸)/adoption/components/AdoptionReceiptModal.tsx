"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AdoptionHistoryDto,
  adoptionHistoryControllerGetAllAdoptions,
  adoptionHistoryControllerUpdate,
} from "@repo/api-client";
import {
  ADOPTION_METHOD_KOREAN_INFO,
  GENDER_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
} from "../../constants";
import { cn } from "@/lib/utils";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../../components/BadgeList";
import { DateTime } from "luxon";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMobile";
import DeletedPetName from "../../components/DeletedPetName";
import { useCallback, useMemo, useState } from "react";
import { FileTextIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import TransferReportModal from "@/app/(브리더스룸)/adoption/components/TransferReportModal";
import { overlay } from "overlay-kit";
import { isNotNil } from "es-toolkit";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError, AxiosResponse } from "axios";
import { getSexIcon } from "@/lib/sex-icon";

interface AdoptionReceiptModalProps {
  isOpen: boolean;
  adoption: AdoptionHistoryDto;
  onClose: () => void;
}

interface PetInfoCardProps {
  name?: string;
  species: string;
  sex?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
  petId: string;
  isMobile?: boolean;
}

const PetInfoCard = ({
  name,
  species,
  sex,
  morphs,
  traits,
  hatchingDate,
  isDeleted,
  petId,
  isMobile,
}: PetInfoCardProps) => {
  const cardContent = (
    <div
      className={cn(
        "mb-4 flex gap-0 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 dark:from-blue-900/30 dark:to-purple-900/30",
        isDeleted ? "cursor-not-allowed" : "hover:shadow-md",
      )}
    >
      <div className={"flex items-center gap-2.5"}>
        <div className={isMobile ? "w-12" : "w-16"}>
          <PetThumbnail petId={petId} maxSize={isMobile ? 50 : 70} />
        </div>
        <div>
          <div
            className={cn(
              "mb-2 flex items-center gap-2 font-semibold dark:text-gray-100",
              isMobile && "text-sm",
            )}
          >
            {isDeleted ? (
              <DeletedPetName
                name={name}
                deletedClassName="cursor-not-allowed decoration-red-500"
              />
            ) : (
              name
            )}

            {hatchingDate && <p className="text-sm font-normal text-gray-500">{hatchingDate}</p>}
            {/*<div className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>*/}
            {/*  | {(SPECIES_KOREAN_INFO as Record<string, string>)[species] || "미분류"}*/}
            {/*</div>*/}
            {sex && (
              <p className={cn("text-blue-500", isMobile ? "text-xs" : "text-sm")}>
                {getSexIcon(sex, { size: "xs" })}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex flex-col gap-2 text-gray-600 dark:text-gray-300",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            <BadgeList variant={"outline"} items={morphs} badgeSize={isMobile ? "sm" : "md"} />
            <BadgeList items={traits} variant="secondary" badgeSize={isMobile ? "sm" : "md"} />
          </div>
        </div>
      </div>
    </div>
  );

  if (isDeleted) {
    return cardContent;
  }

  return (
    <Link href={`/pet/${petId}`} className="cursor-pointer">
      {cardContent}
    </Link>
  );
};

const AdoptionReceiptModal = ({ isOpen, adoption, onClose }: AdoptionReceiptModalProps) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { pet } = adoption;
  const { name, species, hatchingDate, sex, morphs, traits, isDeleted } = pet ?? {};

  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoValue, setMemoValue] = useState(adoption.memo ?? "");

  const { mutateAsync: updateHistory, isPending } = useMutation({
    mutationFn: (memo: string) =>
      adoptionHistoryControllerUpdate(adoption.id, { memo: memo || null }),
  });

  const handleSaveMemo = useCallback(async () => {
    try {
      await updateHistory(memoValue);
      queryClient.setQueriesData<InfiniteData<AxiosResponse<{ data: AdoptionHistoryDto[] }>>>(
        { queryKey: [adoptionHistoryControllerGetAllAdoptions.name] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                data: page.data.data.map((item) =>
                  item.id === adoption.id ? { ...item, memo: memoValue || undefined } : item,
                ),
              },
            })),
          };
        },
      );
      setIsEditingMemo(false);
      toast.success("메모가 수정되었습니다.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        toast.error(Array.isArray(message) ? message[0] : message || "메모 수정에 실패했습니다.");
      }
    }
  }, [updateHistory, memoValue, queryClient, adoption.id]);

  const handleCancelMemo = useCallback(() => {
    setMemoValue(adoption.memo ?? "");
    setIsEditingMemo(false);
  }, [adoption.memo]);

  const adoptionDateText = useMemo(() => {
    if (!adoption?.adoptionDate) return "미정";
    const dt = DateTime.fromISO(adoption.adoptionDate.toString());
    return dt.isValid ? dt.toFormat("yyyy년 MM월 dd일") : "미정";
  }, [adoption?.adoptionDate]);

  const handleOpenTransferReport = useCallback(() => {
    overlay.open(({ isOpen, close }) => <TransferReportModal isOpen={isOpen} onClose={close} />);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>분양 상세 정보</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PetInfoCard
            name={name}
            species={species ?? ""}
            sex={sex}
            morphs={morphs}
            traits={traits}
            hatchingDate={hatchingDate}
            isDeleted={isDeleted}
            petId={adoption.petId}
            isMobile={isMobile}
          />

          <div className="space-y-3">
            <div className="pt-4 pb-4">
              <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-neutral-900">
                <div className="mb-2 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
                    분양 내역
                  </div>
                </div>

                <div className="mb-4 border-b border-dashed border-gray-400 pb-2"></div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">분양 가격</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-gray-200">
                      {isNotNil(adoption?.price) ? `${adoption.price.toLocaleString()}원` : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">분양 날짜</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {adoptionDateText}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">거래 방식</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {adoption?.method ? ADOPTION_METHOD_KOREAN_INFO[adoption.method] : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">구매자 </span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {/* TODO!: 법안을 고려하여 판매완료 정보는 사용자 정보가 삭제되더라도 기록으로 남겨놔야 할듯. */}
                      {adoption?.buyer?.name ?? "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-b border-dashed border-gray-400 pb-2"></div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">메모</span>
                    {!isEditingMemo && (
                      <button
                        onClick={() => {
                          setIsEditingMemo(true);
                        }}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {isEditingMemo ? (
                    <div className="space-y-2">
                      <Textarea
                        value={memoValue}
                        onChange={(e) => setMemoValue(e.target.value)}
                        placeholder="메모를 입력하세요"
                        className="min-h-[80px] w-full text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelMemo}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <XIcon className="h-3 w-3" />
                          취소
                        </button>
                        <button
                          onClick={handleSaveMemo}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-md bg-blue-500 px-2.5 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                          <CheckIcon className="h-3 w-3" />
                          {isPending ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded bg-gray-100 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {memoValue || "-"}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleOpenTransferReport}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-400 bg-blue-100 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-600 hover:font-bold hover:text-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    양도·양수 신고서 출력
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ※ 문의 사항은 고객센터로 문의해주세요.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionReceiptModal;
