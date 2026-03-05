"use client";

import { useRef } from "react";
import { AdoptionHistoryDto } from "@repo/api-client";
import PetThumbnail from "@/components/common/PetThumbnail";
import { ADOPTION_METHOD_KOREAN_INFO } from "../../constants";
import BadgeList from "../../components/BadgeList";
import DeletedPetName from "../../components/DeletedPetName";
import { isNotNil } from "es-toolkit";
import { DateTime } from "luxon";
import Link from "next/link";

interface AdoptionCardProps {
  adoption: AdoptionHistoryDto;
  onClick: (adoption: AdoptionHistoryDto) => void;
}

const TAP_THRESHOLD = 10;

export default function AdoptionCard({ adoption, onClick }: AdoptionCardProps) {
  const { pet } = adoption;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const dotColor =
    pet.sex === "M"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === "F"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";

  return (
    <button
      type="button"
      className="relative flex w-full cursor-pointer flex-col gap-1 rounded-xl border border-gray-200/70 bg-neutral-50 p-2 text-left transition-transform duration-100 ease-out hover:shadow-md active:scale-[0.97] active:opacity-80 dark:border-gray-700/60 dark:bg-[#18171C]"
      style={{ WebkitTapHighlightColor: "transparent" }}
      onClick={() => onClick(adoption)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStartRef.current) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        touchStartRef.current = null;
        if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
          e.preventDefault();
          onClick(adoption);
        }
      }}
    >
      <div className="flex gap-2">
        {/* 이미지 */}
        <div className="relative flex h-20 w-20 shrink-0 flex-col items-center gap-0.5 self-center">
          <PetThumbnail
            petId={adoption.petId}
            maxSize={160}
            className="h-full w-full rounded-xl"
            objectFit="cover"
          />
        </div>

        {/* 컨텐츠 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 이름 + 분양 가격 */}
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
            {pet.isDeleted ? (
              <DeletedPetName name={pet.name} maxLength={10} />
            ) : (
              <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {pet.name ?? "이름 없음"}
              </h3>
            )}
            {isNotNil(adoption.price) && (
              <span className="ml-auto shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {adoption.price.toLocaleString()}원
              </span>
            )}
          </div>

          {/* 분양일 / 방식 / 성장 / 입양자 */}
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-1">
              {adoption.adoptionDate && (
                <span className="dark:text-gray-300">
                  {(() => {
                    const dt = DateTime.fromISO(adoption.adoptionDate);
                    return dt.isValid ? dt.toFormat("yy.MM.dd") : "-";
                  })()}
                </span>
              )}
              {adoption.method && (
                <span className="dark:text-gray-300">
                  {ADOPTION_METHOD_KOREAN_INFO[adoption.method]}
                </span>
              )}
            </div>

            {/* {pet.growth && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">성장</span>
                <span className="dark:text-gray-300">{GROWTH_KOREAN_INFO[pet.growth]}</span>
              </div>
            )} */}
            {adoption.buyer?.name && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="text-gray-400">입양자</span>
                <Link
                  href={`/showroom/${encodeURIComponent(adoption.buyer.name)}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  @{adoption.buyer.name}
                </Link>
              </div>
            )}
          </div>

          {/* 모프 & 형질 */}
          <div className="flex flex-wrap gap-1">
            <BadgeList variant="outline" items={pet.morphs} maxDisplay={4} badgeSize="sm" inline />
            <BadgeList
              items={pet.traits}
              maxDisplay={4}
              variant="secondary"
              badgeSize="sm"
              inline
            />
          </div>
        </div>
      </div>
    </button>
  );
}
