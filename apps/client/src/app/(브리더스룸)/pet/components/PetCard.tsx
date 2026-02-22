"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  PetDto,
  PetDtoGrowth,
  PetParentDto,
  PetHiddenStatusDtoHiddenStatus,
} from "@repo/api-client";
import PetThumbnail from "@/components/common/PetThumbnail";
import { GROWTH_KOREAN_INFO } from "../../constants";
import ParentStatusIcon from "../../components/ParentStatusIcon";
import BadgeList from "../../components/BadgeList";
import AdoptionStatusBadge from "../../components/AdoptionStatusBadge";
import LinkButton from "../../components/LinkButton";
import DeletedPetName from "../../components/DeletedPetName";
import HiddenPetBadge from "@/components/common/HiddenPetBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DateTime } from "luxon";

interface PetCardProps {
  pet: PetDto;
  onCardClick: (pet: PetDto) => void;
}

const renderParent = (parent: PetDto["father"] | PetDto["mother"]) => {
  if (!parent) return null;

  if ("hiddenStatus" in parent && parent.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <HiddenPetBadge />
        </TooltipTrigger>
        <TooltipContent>비공개 처리된 개체입니다</TooltipContent>
      </Tooltip>
    );
  }

  const p = parent as PetParentDto;

  if (p.isDeleted) {
    return <DeletedPetName name={p.name} maxLength={6} />;
  }

  const truncatedName = p.name && p.name.length > 6 ? `${p.name.slice(0, 6)}...` : (p.name ?? "");

  return (
    <LinkButton
      href={`/pet/${p.petId}`}
      label={truncatedName}
      icon={<ParentStatusIcon status={p.status} />}
    />
  );
};

export default function PetCard({ pet, onCardClick }: PetCardProps) {
  const adoptionStatus = pet.adoption?.status;
  const dotColor = pet.sex === "M" ? "bg-blue-500" : pet.sex === "F" ? "bg-red-500" : "bg-gray-300";
  const [pressed, setPressed] = useState(false);

  return (
    <div
      className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border border-gray-200/70 bg-neutral-50 p-2 transition-all duration-150 hover:shadow-md dark:border-gray-700/60 dark:bg-[#18171C] ${pressed ? "scale-[0.98] dark:bg-gray-800" : ""}`}
      onClick={() => onCardClick(pet)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* 공개/비공개 뱃지 */}
      <div className="absolute top-0 left-0 z-10 -translate-x-1/4 -translate-y-1/4">
        {!pet.isPublic && (
          <div className="rounded-full bg-yellow-500 p-1 shadow-sm dark:bg-gray-700">
            <Lock className="h-3 w-3 bg-yellow-500 text-white dark:bg-transparent dark:text-yellow-500" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {/* 이미지 */}
        <div className="relative flex h-20 w-20 shrink-0 flex-col items-center gap-0.5 self-center">
          <PetThumbnail
            petId={pet.petId}
            maxSize={160}
            className="h-full w-full rounded-xl"
            objectFit="cover"
          />
        </div>

        {/* 컨텐츠 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 이름 + 분양 상태 */}
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
            <h3 className="min-w-0 truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {pet.name ?? "이름 없음"}
            </h3>
            {adoptionStatus && <AdoptionStatusBadge status={adoptionStatus} />}
          </div>

          {/* 성장단계 + 해칭일 */}
          <div className="flex items-center gap-2 text-xs">
            {pet.growth && (
              <div className="flex items-center gap-0.5">
                <span className="text-gray-400">성장</span>
                <span className="dark:text-gray-300">
                  {GROWTH_KOREAN_INFO[pet.growth as PetDtoGrowth]}
                </span>
              </div>
            )}
            {pet.hatchingDate && (
              <div className="flex items-center gap-0.5">
                <span className="text-gray-400">해칭</span>
                <span className="dark:text-gray-300">
                  {(() => {
                    const dt = DateTime.fromISO(pet.hatchingDate);
                    return dt.isValid ? dt.toFormat("yy.MM.dd") : "-";
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* 부모 정보 */}
          <div
            className="flex items-center gap-1 truncate text-xs"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="shrink-0 text-gray-400">부모</span>
            {pet.father ? renderParent(pet.father) : <span className="text-gray-400">미등록</span>}
            <span className="text-gray-400">×</span>
            {pet.mother ? renderParent(pet.mother) : <span className="text-gray-400">미등록</span>}
          </div>

          {/* 모프 & 특성 */}
          <div className="flex flex-wrap gap-1">
            <BadgeList variant={"outline"} items={pet.morphs} maxDisplay={4} badgeSize="sm" inline />
            <BadgeList items={pet.traits} maxDisplay={4} variant="secondary" badgeSize="sm" inline />
          </div>
        </div>
      </div>
    </div>
  );
}
