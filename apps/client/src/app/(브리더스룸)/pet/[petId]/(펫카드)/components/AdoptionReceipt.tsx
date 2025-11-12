import { SALE_STATUS_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import {
  AdoptionDto,
  PetAdoptionDto,
  PetAdoptionDtoLocation,
  PetAdoptionDtoStatus,
  petControllerFindPetByPetId,
} from "@repo/api-client";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, memo, useCallback, useMemo } from "react";
import { PencilIcon } from "lucide-react";
import AdoptionDetailModal from "@/app/(브리더스룸)/adoption/components/AdoptionDetailModal";
import { overlay } from "overlay-kit";
import { useQueryClient } from "@tanstack/react-query";

interface AdoptionReceiptProps {
  adoption: AdoptionDto | PetAdoptionDto;
  isEditable?: boolean;
}

const AdoptionReceipt = memo(({ adoption, isEditable = true }: AdoptionReceiptProps) => {
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const queryClient = useQueryClient();

  const handleReceiptHover = useCallback(() => {
    if (!isReceiptVisible) {
      setIsReceiptVisible(true);
    }
  }, [isReceiptVisible]);

  const statusText = useMemo(() => {
    return adoption?.status &&
      typeof adoption.status === "string" &&
      adoption.status in SALE_STATUS_KOREAN_INFO
      ? SALE_STATUS_KOREAN_INFO[adoption.status as keyof typeof SALE_STATUS_KOREAN_INFO]
      : "미정";
  }, [adoption?.status]);

  const priceText = useMemo(() => {
    return adoption?.price ? `${adoption.price.toLocaleString()}원` : "미정";
  }, [adoption?.price]);

  const adoptionDateText = useMemo(() => {
    return adoption?.adoptionDate
      ? format(parseISO(adoption.adoptionDate?.toString() ?? ""), "yyyy년 MM월 dd일", {
          locale: ko,
        })
      : "미정";
  }, [adoption?.adoptionDate]);

  const animationDelay = useMemo(() => {
    return adoption?.memo ? "1.6s" : "1.4s";
  }, [adoption?.memo]);

  const handleEditAdoption = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <AdoptionDetailModal
        isOpen={isOpen}
        onClose={close}
        petId={adoption.petId}
        onUpdate={() => {
          queryClient.invalidateQueries({
            queryKey: [petControllerFindPetByPetId.name, adoption.petId],
          });
        }}
      />
    ));
  }, [adoption, queryClient]);

  return (
    <div className="pb-4 pt-4">
      <div
        className={`group relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-gray-400/50 dark:border-gray-600 dark:bg-gray-800 dark:hover:shadow-gray-600/50 ${
          isReceiptVisible ? "animate-print-receipt" : ""
        }`}
        onMouseEnter={handleReceiptHover}
      >
        <div
          className={`absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-0 ${
            isReceiptVisible ? "animate-print-line" : ""
          }`}
        ></div>

        <div
          className={`mb-2 flex flex-col items-center justify-center text-center ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
            {adoption?.status === PetAdoptionDtoStatus.SOLD && (
              <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="animate-bounce text-2xl">✨</span>
              </div>
            )}
            분양 영수증{" "}
            {adoption?.adoptionId && adoption?.status !== PetAdoptionDtoStatus.SOLD && (
              <>
                {isEditable && (
                  <button className="cursor-pointer" onClick={handleEditAdoption}>
                    <PencilIcon className="h-5 w-5 hover:text-blue-500" />
                  </button>
                )}
                <span className="text-sm font-light text-gray-600 dark:text-gray-400">(예정)</span>
              </>
            )}
            {adoption?.status === PetAdoptionDtoStatus.SOLD && (
              <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="animate-bounce text-2xl">✨</span>
              </div>
            )}
          </div>

          {adoption?.status === PetAdoptionDtoStatus.SOLD && (
            <div className="text-sm text-red-500 dark:text-red-400">
              판매 완료된 개체는 수정할 수 없습니다.
            </div>
          )}
        </div>

        <div
          className={`mb-4 border-b border-dashed border-gray-400 pb-2 ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "0.4s" }}
        ></div>

        <div className="space-y-3">
          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.6s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">분양 상태</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {statusText}
            </span>
          </div>

          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.8s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">분양 가격</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{priceText}</span>
          </div>

          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.0s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">분양 날짜</span>
            <span className="text-sm text-gray-800 dark:text-gray-200">{adoptionDateText}</span>
          </div>

          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.2s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">거래 방식</span>
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {adoption?.location
                ? adoption.location === PetAdoptionDtoLocation.ONLINE
                  ? "온라인"
                  : "오프라인"
                : "미정"}
            </span>
          </div>

          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.4s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">구매자 </span>
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {adoption?.buyer?.name ?? "미정"}
            </span>
          </div>
        </div>

        <div
          className={`mt-4 border-b border-dashed border-gray-400 pb-2 ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "1.6s" }}
        ></div>

        {adoption?.memo ? (
          <div
            className={`mt-4 ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.8s" }}
          >
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">메모</div>
            <div className="rounded bg-gray-100 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {adoption.memo as string}
            </div>
          </div>
        ) : null}

        <div
          className={`mt-4 text-center ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
          style={{ animationDelay }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ※ 문의 사항은 고객센터로 문의해주세요.
          </div>
        </div>
      </div>
    </div>
  );
});

AdoptionReceipt.displayName = "AdoptionReceipt";

export default AdoptionReceipt;
