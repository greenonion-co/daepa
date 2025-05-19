"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useFormStore } from "../../register/store/form";
import CardFront from "./(펫카드)/CardFront";
import CardBack from "./(펫카드)/CardBack";
import { PetDto } from "@repo/api-client";

interface PetDetailProps {
  pet: PetDto;
}

const PetDetail = ({ pet }: PetDetailProps) => {
  const { setFormData } = useFormStore();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setFormData(pet);
  }, [pet, setFormData]);

  if (!pet) {
    return <div>펫을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-2">
      {/* 힌트 텍스트 추가 */}
      <div className="flex items-center justify-center gap-2 text-gray-500">
        {!isFlipped && (
          <span className="animate-bounce text-sm"> 👇 카드를 탭하여 상세 정보 보기</span>
        )}
      </div>
      <div className="perspective-[2000px]">
        <div
          className={`relative mx-auto h-[700px] w-full max-w-[500px] cursor-pointer transition-transform duration-300 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* 카드 앞면 */}
          <CardFront pet={pet} />

          {/* 카드 뒷면 */}
          <CardBack pet={pet} setIsFlipped={setIsFlipped} />
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
