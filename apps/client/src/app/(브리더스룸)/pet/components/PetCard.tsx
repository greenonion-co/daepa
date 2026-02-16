"use client";

import { Lock } from "lucide-react";
import { PetDto, PetDtoGrowth, PetAdoptionDtoStatus } from "@repo/api-client";
import { cn } from "@/lib/utils";
import PetThumbnail from "@/components/common/PetThumbnail";
import { GROWTH_KOREAN_INFO, SALE_STATUS_KOREAN_INFO } from "../../constants";
import BadgeList from "../../components/BadgeList";
import { useAppRouter } from "@/hooks/useAppRouter";
import { DateTime } from "luxon";
import { getSexIcon } from "@/lib/sex-icon";

interface PetCardProps {
  pet: PetDto;
  onCardClick: (pet: PetDto) => void;
}

export default function PetCard({ pet, onCardClick }: PetCardProps) {
  const router = useAppRouter();
  const adoptionStatus = pet.adoption?.status;
  const adoptionLabel = adoptionStatus ? SALE_STATUS_KOREAN_INFO[adoptionStatus] : null;
  const sexLabel = getSexIcon(pet.sex, { size: "xs" });

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-lg bg-white transition-all duration-150 hover:shadow-md active:scale-[0.98] dark:bg-[#18171C] dark:active:bg-gray-800"
      onClick={() => onCardClick(pet)}
    >
      <div className="flex gap-2 p-2">
        {/* 이미지 + 성별 */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 self-center">
          <div className="relative h-15 w-15">
            <PetThumbnail
              petId={pet.petId}
              maxSize={160}
              className="h-full w-full rounded-xl"
              objectFit="cover"
            />
            {/* 공개/비공개 뱃지 */}
            <div className="absolute -bottom-1 -left-1">
              {!pet.isPublic && (
                <div className="rounded-full bg-white p-1 shadow-sm dark:bg-gray-700">
                  <Lock className="h-3 w-3 text-yellow-500" />
                </div>
              )}
            </div>
            {/* 분양 상태 뱃지 */}
            {adoptionStatus && adoptionStatus !== PetAdoptionDtoStatus.NONE && (
              <div className="absolute -top-2 -right-1">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
                    adoptionStatus === PetAdoptionDtoStatus.NFS
                      ? "bg-pink-500 text-white"
                      : adoptionStatus === PetAdoptionDtoStatus.ON_SALE
                        ? "bg-green-500 text-white"
                        : adoptionStatus === PetAdoptionDtoStatus.ON_RESERVATION
                          ? "bg-yellow-500 text-white"
                          : "bg-blue-500 text-white",
                  )}
                >
                  {adoptionLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="min-w-0 flex-1 items-center justify-center space-y-0.5">
          {/* 이름 + 성장단계 + 해칭일 */}
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {pet.name ?? "이름 없음"}
            </h3>
            {/* 성장단계 */}
            {pet.growth && (
              <p className="text-xs font-[500] text-gray-400 dark:text-gray-400">
                {GROWTH_KOREAN_INFO[pet.growth as PetDtoGrowth]}
              </p>
            )}
            {/* 해칭일 */}
            {pet.hatchingDate && (
              <p className="text-xs text-gray-700 dark:text-gray-500">
                {(() => {
                  const dt = DateTime.fromISO(pet.hatchingDate);
                  return dt.isValid ? dt.toFormat("yy.MM.dd") : "-";
                })()}
              </p>
            )}
            {/* 성별 */}
            {sexLabel && (
              <span
                className={cn(
                  "text-[10px] font-[500]",
                  (pet.sex === "M" && "text-blue-500") ||
                    (pet.sex === "F" && "text-red-500") ||
                    "text-amber-500",
                )}
              >
                {sexLabel}
              </span>
            )}
          </div>

          {/* 부모 정보 */}
          {(pet.father || pet.mother) && (
            <p className="truncate pb-2 text-xs text-gray-600 dark:text-gray-300">
              {pet.father && "name" in pet.father && "petId" in pet.father && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pet/${pet.father?.petId}`);
                  }}
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  {pet.father.name}
                </button>
              )}
              {pet.father && "name" in pet.father && pet.mother && "name" in pet.mother && " × "}
              {pet.mother && "name" in pet.mother && "petId" in pet.mother && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pet/${pet.mother?.petId}`);
                  }}
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  {pet.mother.name}
                </button>
              )}
            </p>
          )}

          {/* 모프 & 특성 */}
          <div className="flex flex-col gap-0.5">
            <BadgeList items={pet.morphs} maxDisplay={3} badgeSize="sm" />
            <BadgeList items={pet.traits} maxDisplay={3} variant="outline" badgeSize="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
