"use client";

import { PetDto, PetDtoSex } from "@repo/api-client";
import Link from "next/link";
import { DateTime } from "luxon";
import PetThumbnail from "@/components/common/PetThumbnail";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedPetCardProps {
  pet: PetDto;
}

function getSexLabel(sex?: PetDtoSex) {
  switch (sex) {
    case PetDtoSex.MALE:
      return "수컷";
    case PetDtoSex.FEMALE:
      return "암컷";
    default:
      return null;
  }
}

function isMale(sex?: PetDtoSex) {
  return sex === PetDtoSex.MALE;
}

export default function FeedPetCard({ pet }: FeedPetCardProps) {
  const sexLabel = getSexLabel(pet.sex);

  return (
    <Link href={`/pet/${pet.petId}`} className="block">
      <article className="overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-md dark:bg-neutral-900">
        {/* Header - 유저 정보 */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-200 to-purple-200 text-xs font-bold text-white">
            {pet.owner.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pet.owner.name || "익명"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{pet.species}</p>
          </div>
        </div>

        {/* 이미지 */}
        <div className="relative aspect-square w-full bg-gray-100 dark:bg-transparent">
          <PetThumbnail
            petId={pet.petId}
            objectFit="cover"
            maxSize={400}
            className="h-full w-full rounded-none"
          />
        </div>

        {/* 액션 버튼 (인스타 스타일) */}
        {/* <div className="flex items-center gap-4 px-4 py-3">
          <button
            type="button"
            className="text-gray-700 transition-colors hover:text-red-500 dark:text-gray-300"
          >
            <Heart className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="text-gray-700 transition-colors hover:text-blue-500 dark:text-gray-300"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div> */}

        {/* 컨텐츠 */}
        <div className="mt-2 space-y-2 px-4 pb-4">
          {/* 이름과 성별 */}
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {pet.name || "이름 없음"}
            </h3>
            {sexLabel && (
              <span
                className={cn(
                  "text-base font-bold",
                  isMale(pet.sex) ? "text-blue-500" : "text-pink-500",
                )}
              >
                {sexLabel}
              </span>
            )}
          </div>

          {/* 모프 & 형질 */}
          <div className="flex flex-wrap gap-1">
            {pet.morphs?.slice(0, 3).map((morph, index) => (
              <Badge key={`morph-${morph}-${index}`} variant="default" size="sm">
                {morph}
              </Badge>
            ))}
            {pet.traits?.slice(0, 2).map((trait, index) => (
              <Badge
                key={`trait-${trait}-${index}`}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-800"
              >
                {trait}
              </Badge>
            ))}
            {(() => {
              const extraMorphs = Math.max(0, (pet.morphs?.length || 0) - 3);
              const extraTraits = Math.max(0, (pet.traits?.length || 0) - 2);
              const total = extraMorphs + extraTraits;
              return total > 0 ? (
                <Badge variant="secondary" size="sm">
                  +{total}
                </Badge>
              ) : null;
            })()}
          </div>

          {/* 설명 */}
          {pet.desc && (
            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{pet.desc}</p>
          )}

          {/* 날짜 */}
          {pet.hatchingDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {DateTime.fromISO(pet.hatchingDate).toFormat("yyyy년 M월 d일")} 출생
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
