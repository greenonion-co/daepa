"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import {
  PetDto,
  PetDtoGrowth,
  PetParentDto,
  PetHiddenStatusDtoHiddenStatus,
} from "@repo/api-client";
import PetThumbnail from "@/components/common/PetThumbnail";
import { GROWTH_KOREAN_INFO } from "../../constants";
import BadgeList from "../../components/BadgeList";
import AdoptionStatusBadge from "../../components/AdoptionStatusBadge";
import LinkButton from "../../components/LinkButton";
import DeletedPetName from "../../components/DeletedPetName";
import HiddenPetBadge from "@/components/common/HiddenPetBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DateTime } from "luxon";
import PetHoverPreview from "./PetHoverPreview";
import { useDebouncedHover } from "@/hooks/useDebouncedHover";

interface PetCardProps {
  pet: PetDto;
  onCardClick: (pet: PetDto) => void;
}

type HoveredParent = { petId: string; name?: string; status?: string } | null;

const renderParent = (
  parent: PetDto["father"] | PetDto["mother"],
  onHover: (info: HoveredParent) => void,
) => {
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
    <span
      onMouseEnter={() => onHover({ petId: p.petId, name: p.name, status: p.status })}
      onMouseLeave={() => onHover(null)}
    >
      <LinkButton
        href={`/pet/${p.petId}`}
        label={truncatedName}
        className={
          p.status === "approved"
            ? "text-[#0F7B6C] hover:decoration-[#0F7B6C] dark:text-[#4DAB9A] dark:hover:decoration-[#4DAB9A]"
            : p.status === "pending"
              ? "text-[#D9730D] hover:decoration-[#D9730D] dark:text-[#FFA344] dark:hover:decoration-[#FFA344]"
              : undefined
        }
      />
    </span>
  );
};

export default function PetCard({ pet, onCardClick }: PetCardProps) {
  const adoptionStatus = pet.adoption?.status;
  const dotColor =
    pet.sex === "M"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === "F"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";
  const [pressed, setPressed] = useState(false);
  const [hoveredParent, parentHoverEnter, parentHoverLeave] = useDebouncedHover<NonNullable<HoveredParent>>();
  const handleParentHover = (info: HoveredParent) => info ? parentHoverEnter(info) : parentHoverLeave();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border border-gray-200/70 bg-neutral-50 p-2 transition-all duration-150 hover:shadow-md dark:border-gray-700/60 dark:bg-[#18171C] ${pressed ? "scale-[0.98] dark:bg-gray-800" : ""}`}
      onClick={() => onCardClick(pet)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div className="flex gap-2">
        {/* 이미지 */}
        <div className="relative flex h-20 w-20 shrink-0 flex-col items-center gap-0.5 self-center">
          <PetThumbnail
            petId={pet.petId}
            maxSize={160}
            className="h-full w-full rounded-xl"
            objectFit="cover"
          />
          {!pet.isPublic && (
            <div className="absolute top-1 left-1 rounded-md bg-black/50 px-1 py-0.5 backdrop-blur-sm">
              <Lock className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* 컨텐츠 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 이름 + 분양 상태 */}
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
            <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pet.name ?? "이름 없음"}
            </h3>
            {adoptionStatus && <AdoptionStatusBadge status={adoptionStatus} />}
          </div>

          {/* 성장단계 + 해칭일 */}
          <div className="flex items-center gap-3 text-xs">
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
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          >
            <span className="shrink-0 text-gray-400">부모</span>
            {pet.father ? (
              renderParent(pet.father, handleParentHover)
            ) : (
              <span className="text-gray-400">미등록</span>
            )}
            <span className="text-gray-400">×</span>
            {pet.mother ? (
              renderParent(pet.mother, handleParentHover)
            ) : (
              <span className="text-gray-400">미등록</span>
            )}
          </div>

          {/* 모프 & 특성 */}
          <div className="flex flex-wrap gap-1">
            <BadgeList
              variant={"outline"}
              items={pet.morphs}
              maxDisplay={4}
              badgeSize="sm"
              inline
            />
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

      {hoveredParent && (
        <PetHoverPreview
          petId={hoveredParent.petId}
          mousePos={mousePos}
          name={hoveredParent.name}
          parentStatus={hoveredParent.status}
        />
      )}
    </div>
  );
}
