"use client";

import Link from "next/link";
import { PetDto, PetDtoGrowth, PetDtoSex } from "@repo/api-client";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "@/app/(브리더스룸)/components/BadgeList";
import { cn } from "@/lib/utils";

interface PetShowcaseCardProps {
  pet: PetDto;
}

function AdoptionBadge({ status, price }: { status?: string; price?: number }) {
  if (status === "ON_SALE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#D3E5EF] px-2 py-0.5 text-[10px] font-medium text-[#28638D] dark:bg-[#1E3A5F] dark:text-[#A3C9E8]">
        분양중
        {price != null && price > 0 && (
          <span className="font-semibold">{price.toLocaleString()}원</span>
        )}
      </span>
    );
  }

  if (status === "ON_RESERVATION") {
    return (
      <span className="rounded-full bg-[#FDECC8] px-2 py-0.5 text-[10px] font-medium text-[#9F6B15] dark:bg-[#4A3520] dark:text-[#F0C97E]">
        예약중
      </span>
    );
  }

  if (status === "NFS") {
    return (
      <span className="rounded-full bg-[#FFE2DD] px-2 py-0.5 text-[10px] font-medium text-[#93312E] dark:bg-[#5A2523] dark:text-[#FFB4AB]">
        NFS
      </span>
    );
  }

  return null;
}

const GROWTH_LABEL: Record<string, string> = {
  [PetDtoGrowth.BABY]: "베이비",
  [PetDtoGrowth.JUVENILE]: "아성체",
  [PetDtoGrowth.PRE_ADULT]: "준성체",
  [PetDtoGrowth.ADULT]: "성체",
};

export default function PetShowcaseCard({ pet }: PetShowcaseCardProps) {
  const dotClass =
    pet.sex === PetDtoSex.MALE
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === PetDtoSex.FEMALE
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300 dark:bg-gray-500";

  return (
    <Link
      href={`/pet/${pet.petId}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      {/* 썸네일 */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <PetThumbnail
          petId={pet.petId}
          maxSize={240}
          objectFit="cover"
          className="h-full w-full !rounded-none transition-transform duration-200 group-hover:scale-105"
        />
        {/* 분양 상태 배지 */}
        {pet.adoption?.status && (
          <div className="absolute top-0 left-1">
            <AdoptionBadge status={pet.adoption.status} price={pet.adoption.price} />
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-col gap-1 p-2.5">
        {/* 이름 + 성별 */}
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} />
          <span className="text-md truncate font-semibold text-gray-900 dark:text-gray-100">
            {pet.name ?? "이름 없음"}
          </span>
        </div>

        {/* 해칭일 · 성장단계 */}
        {(pet.hatchingDate || pet.growth) && (
          <p className="truncate text-sm text-gray-900 dark:text-gray-100">
            {pet.hatchingDate &&
              new Date(pet.hatchingDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            {pet.hatchingDate && pet.growth && " · "}
            {pet.growth && GROWTH_LABEL[pet.growth]}
          </p>
        )}

        {/* 모프 */}
        {pet.morphs && pet.morphs.length > 0 && (
          <>
            <div className="md:hidden">
              <BadgeList items={pet.morphs} maxDisplay={2} variant="outline" badgeSize="sm" />
            </div>
            <div className="hidden md:block">
              <BadgeList items={pet.morphs} maxDisplay={2} variant="outline" badgeSize="md" />
            </div>
          </>
        )}

        {/* 형질 */}
        {pet.traits && pet.traits.length > 0 && (
          <>
            <div className="md:hidden">
              <BadgeList items={pet.traits} maxDisplay={2} variant="outline" badgeSize="sm" />
            </div>
            <div className="hidden md:block">
              <BadgeList items={pet.traits} maxDisplay={2} variant="outline" badgeSize="md" />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
