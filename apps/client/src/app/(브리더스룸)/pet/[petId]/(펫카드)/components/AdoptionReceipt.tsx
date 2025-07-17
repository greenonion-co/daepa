import { SALE_STATUS_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { PetAdoptionDto } from "@repo/api-client";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, memo, useCallback, useMemo } from "react";

interface AdoptionReceiptProps {
  adoption: PetAdoptionDto; // 실제 타입에 맞게 수정 필요
}

const AdoptionReceipt = memo(({ adoption }: AdoptionReceiptProps) => {
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);

  const handleReceiptHover = useCallback(() => {
    if (!isReceiptVisible) {
      setIsReceiptVisible(true);
    }
  }, [isReceiptVisible]);

  const shouldShowReceipt = useMemo(() => {
    return ["ON_SALE", "ON_RESERVATION", "SOLD"].includes(adoption?.status || "");
  }, [adoption?.status]);

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
      ? format(parseISO(adoption.adoptionDate as string), "yyyy년 MM월 dd일", {
          locale: ko,
        })
      : "미정";
  }, [adoption?.adoptionDate]);

  const shouldShowDate = useMemo(() => {
    return ["SOLD", "ON_RESERVATION"].includes(adoption?.status || "");
  }, [adoption?.status]);

  const animationDelay = useMemo(() => {
    return adoption?.memo ? "1.6s" : "1.4s";
  }, [adoption?.memo]);

  if (!shouldShowReceipt) return null;

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
          className={`mb-2 flex items-center justify-center text-center ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
            {adoption?.status === "SOLD" && (
              <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="animate-bounce text-2xl">✨</span>
              </div>
            )}
            분양 영수증{" "}
            {adoption?.status !== "SOLD" && (
              <span className="text-sm font-light text-gray-600 dark:text-gray-400">(예정)</span>
            )}
            {adoption?.status === "SOLD" && (
              <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="animate-bounce text-2xl">✨</span>
              </div>
            )}
          </div>
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

          {shouldShowDate && (
            <div
              className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
              style={{ animationDelay: "1.0s" }}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">분양 날짜</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">{adoptionDateText}</span>
            </div>
          )}
        </div>

        <div
          className={`mt-4 border-b border-dashed border-gray-400 pb-2 ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "1.2s" }}
        ></div>

        {adoption?.memo ? (
          <div
            className={`mt-4 ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.4s" }}
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
