import { SALE_STATUS_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { PetDto } from "@repo/api-client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

interface AdoptionReceiptProps {
  pet: PetDto;
}

const AdoptionReceipt = ({ pet }: AdoptionReceiptProps) => {
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);

  const handleReceiptHover = () => {
    if (!isReceiptVisible) {
      setIsReceiptVisible(true);
    }
  };

  if (!["ON_SALE", "ON_RESERVATION", "SOLD"].includes(pet.saleStatus || "")) return null;

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
            {pet.saleStatus === "SOLD" && (
              <div className="opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="animate-bounce text-2xl">✨</span>
              </div>
            )}
            분양 영수증{" "}
            {pet.saleStatus !== "SOLD" && (
              <span className="text-sm font-light text-gray-600 dark:text-gray-400">(예정)</span>
            )}
            {pet.saleStatus === "SOLD" && (
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
              {SALE_STATUS_KOREAN_INFO[
                pet.adoption?.status as keyof typeof SALE_STATUS_KOREAN_INFO
              ] || "미정"}
            </span>
          </div>

          <div
            className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.8s" }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">분양 가격</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {pet.adoption?.price ? `${pet.adoption.price.toLocaleString()}원` : "미정"}
            </span>
          </div>

          {["SOLD", "ON_RESERVATION"].includes(pet.saleStatus || "") && (
            <div
              className={`flex justify-between ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
              style={{ animationDelay: "1.0s" }}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">분양 날짜</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {pet.adoption?.adoptionDate
                  ? format(pet.adoption.adoptionDate as Date, "yyyy년 MM월 dd일", {
                      locale: ko,
                    })
                  : "미정"}
              </span>
            </div>
          )}
        </div>

        <div
          className={`mt-4 border-b border-dashed border-gray-400 pb-2 ${
            isReceiptVisible ? "animate-fade-in-up" : ""
          }`}
          style={{ animationDelay: "1.2s" }}
        ></div>

        {pet.adoption?.memo ? (
          <div
            className={`mt-4 ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "1.4s" }}
          >
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">메모</div>
            <div className="rounded bg-gray-100 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {pet.adoption.memo as string}
            </div>
          </div>
        ) : null}

        <div
          className={`mt-4 text-center ${isReceiptVisible ? "animate-fade-in-up" : ""}`}
          style={{ animationDelay: pet.adoption?.memo ? "1.6s" : "1.4s" }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ※ 문의 사항은 고객센터로 문의해주세요.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionReceipt;
