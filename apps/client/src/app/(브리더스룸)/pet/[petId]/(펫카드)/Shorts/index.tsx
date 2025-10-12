"use client";

import * as React from "react";
import { useState } from "react";

import { PetDto } from "@repo/api-client";

import ShortsFront from "./ShortsFront";
import ShortsBack from "./ShortsBack";

const ShortsCard = ({ pet }: { pet: PetDto }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!pet) {
    return <div>펫을 찾을 수 없습니다.</div>;
  }

  return (
    <div
      className={`container absolute inset-0 mx-auto flex max-h-[95vh] max-w-[500px] cursor-pointer items-center justify-center transition-transform duration-300 [transform-style:preserve-3d] ${
        isFlipped ? "[transform:rotateY(180deg)]" : ""
      }`}
    >
      {/* 쇼츠 카드 앞면 */}
      <ShortsFront pet={pet} onFlip={() => setIsFlipped(true)} />

      {/* 쇼츠 카드 뒷면 */}
      <ShortsBack pet={pet} onFlip={() => setIsFlipped(false)} />
    </div>
  );
};

export default ShortsCard;
