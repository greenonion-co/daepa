"use client";

import BottomSheet from "@/components/common/BottomSheet";
import { GENDER_KOREAN_INFO, GROWTH_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { BaseFormData } from "../../pet/store/base";
import Image from "next/image";

interface PreviousDataSheetProps {
  isOpen: boolean;
  formData: BaseFormData;
  onContinue: () => void;
  onReset: () => void;
}

export default function PreviousDataSheet({
  isOpen,
  formData,
  onContinue,
  onReset,
}: PreviousDataSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {}}
      buttonText="이어서 작성"
      secondButtonText="새로 작성"
      onSecondButtonClick={onReset}
      onClick={onContinue}
    >
      <div className="px-3 pt-2 pb-4">
        <h3 className="text-xl font-bold">원래 작성하던 개체 정보가 있어요!</h3>
        <h3 className="mb-3 text-xl font-bold">이어서 진행할까요?</h3>

        <div className="mb-3 flex flex-col items-center rounded-xl border border-gray-100 bg-gray-100/50 p-5 text-center dark:bg-gray-800">
          <Image src="/assets/lizard.png" alt="작성중인 데이터 있음" width={150} height={150} />
          <ul className="space-y-1 text-sm font-[600]">
            {formData.species && (
              <li>{SPECIES_KOREAN_INFO[formData.species as keyof typeof SPECIES_KOREAN_INFO]}</li>
            )}
            <div className="flex items-center justify-center gap-1">
              {formData.growth && (
                <li>{GROWTH_KOREAN_INFO[formData.growth as keyof typeof GROWTH_KOREAN_INFO]}</li>
              )}
              {formData.growth && formData.sex && "|"}
              {formData.sex && (
                <li>{GENDER_KOREAN_INFO[formData.sex as keyof typeof GENDER_KOREAN_INFO]}</li>
              )}
            </div>
            {formData.morphs && (
              <li>
                {Array.isArray(formData.morphs)
                  ? (formData.morphs as string[]).join(", ")
                  : formData.morphs}
              </li>
            )}
            {formData.name && (
              <li>
                <span className="text-gray-500">이름:</span> {formData.name}
              </li>
            )}
          </ul>
        </div>
        <p className="text-center text-sm text-gray-500">
          이전에 작성하던 내용을 이어서 작성하시겠습니까?
        </p>
      </div>
    </BottomSheet>
  );
}
