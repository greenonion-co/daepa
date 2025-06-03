"use client";

import * as React from "react";
import { useState } from "react";

import { PetDto } from "@repo/api-client";

import CardFront from "./Front";
import CardBack from "./Back";

const ShortsCard = ({ pet }: { pet: PetDto }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!pet) {
    return <div>펫을 찾을 수 없습니다.</div>;
  }

  return (
    <div
      className={`perspective-[2000px] container absolute inset-0 mx-auto flex h-[95vh] w-[95%] cursor-pointer items-center justify-center transition-transform duration-300 [transform-style:preserve-3d] ${
        isFlipped ? "[transform:rotateY(180deg)]" : ""
      }`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      {/* 카드 앞면 */}
      <CardFront pet={pet} />

      {/* 카드 뒷면 */}
      <CardBack pet={pet} setIsFlipped={setIsFlipped} />
    </div>
  );
};

export default ShortsCard;
