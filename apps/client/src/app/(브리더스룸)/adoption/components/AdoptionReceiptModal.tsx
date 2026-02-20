"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdoptionHistoryDto } from "@repo/api-client";
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
import { useCallback, useMemo } from "react";
import { FileTextIcon } from "lucide-react";
import TransferReportModal from "@/app/(브리더스룸)/adoption/components/TransferReportModal";
import { overlay } from "overlay-kit";
import { isNotNil } from "es-toolkit";

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

            <div className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
              | {(SPECIES_KOREAN_INFO as Record<string, string>)[species] || "미분류"}
            </div>
            {sex && (
              <p className={cn("text-blue-500", isMobile ? "text-xs" : "text-sm")}>
                | {(GENDER_KOREAN_INFO as Record<string, string>)[sex]}
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
            {hatchingDate && (
              <p className="font-[600] text-blue-600">
                {DateTime.fromFormat(hatchingDate, "yyyy-MM-dd").toFormat("yy.M.d")}
              </p>
            )}
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
  const { pet } = adoption;
  const { name, species, hatchingDate, sex, morphs, traits, isDeleted } = pet ?? {};

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

                {adoption?.memo ? (
                  <div className="mt-4">
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">메모</div>
                    <div className="rounded bg-gray-100 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {adoption.memo as string}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    onClick={handleOpenTransferReport}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-400 bg-blue-100 py-2 text-sm text-blue-500 transition-colors hover:border-blue-600 hover:font-bold hover:text-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
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
