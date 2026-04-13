"use client";

import { PetDto } from "@repo/api-client";
import Link from "next/link";
import { DateTime } from "luxon";
import PetThumbnail from "@/components/common/PetThumbnail";
import { Badge } from "@/components/ui/badge";
import { getSexIcon } from "@/lib/sex-icon";
import { BadgeCheck } from "lucide-react";
import BreederBadge from "@/app/(브리더스룸)/components/BreederBadge";

interface FeedPetCardProps {
  pet: PetDto;
}

export default function FeedPetCard({ pet }: FeedPetCardProps) {
  const sexLabel = getSexIcon(pet.sex, { size: "xs" });

  return (
    <article className="overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-md dark:bg-neutral-900">
      {/* Header - 유저 정보 */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {pet.owner?.isBiz && pet.owner?.name ? (
          <Link
            href={`/@${pet.owner.showroomSlug ?? pet.owner.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-gray-100"
          >
            {pet.owner.name}
            <BadgeCheck className="h-5 w-5 fill-blue-500 stroke-white" />
          </Link>
        ) : (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-100">
            {pet.owner?.name ?? "-"}
          </span>
        )}
      </div>

      {/* 이미지 + 컨텐츠 */}
      <Link href={`/pet/${pet.petId}`}>
        <div className="relative aspect-square w-full bg-gray-100 dark:bg-transparent">
          <PetThumbnail
            petId={pet.petId}
            objectFit="cover"
            maxSize={400}
            className="h-full w-full rounded-none"
          />
        </div>

        <div className="mt-2 space-y-2 px-4 pb-4">
          {/* 이름과 성별 */}
          <div className="flex items-center gap-1.5">
            <h3 className="text-base leading-none font-bold text-gray-900 dark:text-gray-100">
              {pet.name || "이름 없음"}
            </h3>
            {pet.isBreeder && <BreederBadge size="sm" />}
            {sexLabel}
            {pet.hatchingDate && (
              <p className="ml-auto text-xs leading-none font-semibold text-gray-400 dark:text-gray-500">
                {DateTime.fromISO(pet.hatchingDate).toFormat("yy.M.d")}
              </p>
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
        </div>
      </Link>
    </article>
  );
}
