"use client";

import {
  PetHiddenStatusDto,
  PetHiddenStatusDtoHiddenStatus,
  SiblingPetDetailDto,
  SiblingPetDetailDtoSex,
} from "@repo/api-client";
import { DateTime } from "luxon";
import { EyeOff, Lock, ScanFace } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { cn, formatPrice } from "@/lib/utils";
import BadgeList from "@/app/(브리더스룸)/components/BadgeList";

/** 기본 펫 정보 인터페이스 */
interface BasePetInfo {
  petId: string;
  name?: string;
  sex?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
}

/** 소유자 정보가 있는 펫 */
interface PetWithOwner extends BasePetInfo {
  owner: { userId: string; name: string };
}

type PetData = SiblingPetDetailDto | PetHiddenStatusDto | PetWithOwner | BasePetInfo;

type CardVariant = "vertical" | "horizontal";

interface SiblingPetCardProps {
  pet: PetData;
  /** 카드 레이아웃 (vertical: 기본, horizontal: 가로형) */
  variant?: CardVariant;
  /** 분양가 표시 */
  price?: number;
  /** 분양일 표시 */
  adoptionDate?: string;
  /** 카드 너비 (vertical 모드) */
  width?: number;
}

function isHiddenPet(pet: PetData): pet is PetHiddenStatusDto {
  return "hiddenStatus" in pet;
}

function hasOwner(pet: PetData): pet is PetWithOwner {
  return "owner" in pet && pet.owner !== undefined;
}

function getSexLabel(sex?: string) {
  switch (sex) {
    case "MALE":
    case SiblingPetDetailDtoSex.MALE:
      return "♂";
    case "FEMALE":
    case SiblingPetDetailDtoSex.FEMALE:
      return "♀";
    default:
      return null;
  }
}

function isMale(sex?: string) {
  return sex === "MALE" || sex === SiblingPetDetailDtoSex.MALE;
}

export default function SiblingPetCard({
  pet,
  variant = "vertical",
  price,
  adoptionDate,
  width = 160,
}: SiblingPetCardProps) {
  const { user } = useUserStore();

  // Hidden pet 처리
  if (isHiddenPet(pet)) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl bg-gray-50 p-2 dark:bg-gray-800",
          variant === "vertical" ? "flex-col" : "w-full",
        )}
        style={variant === "vertical" ? { width } : undefined}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700",
            variant === "vertical" ? "aspect-square w-full" : "h-14 w-14",
          )}
        >
          {pet.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED ? (
            <EyeOff className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          ) : (
            <Lock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <span className="text-[12px] text-gray-500 dark:text-gray-400">
          {pet.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED ? "삭제됨" : "비공개"}
        </span>
      </div>
    );
  }

  const sexLabel = getSexLabel(pet.sex);
  const isMyPet = hasOwner(pet) && pet.owner.userId === user?.userId;
  const ownerName = hasOwner(pet) ? pet.owner.name : null;
  const isDeleted = pet.isDeleted;

  const verticalCardContent = (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1 rounded-xl bg-white p-2 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900",
        isDeleted && "cursor-not-allowed bg-red-100/50 dark:bg-red-900/30",
      )}
      style={{ width }}
    >
      <div className="relative aspect-square w-full rounded-xl bg-gray-100 dark:bg-gray-800">
        <Image
          src="/assets/lizard.png"
          alt={pet.name ?? "펫 이미지"}
          fill
          className="object-cover"
        />

        {isDeleted ? (
          <div className="absolute bottom-1 right-1 rounded-md bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">
            삭제됨
          </div>
        ) : null}
      </div>
      {!isMyPet && ownerName ? (
        <div className="flex items-center justify-center">
          <span className="text-[11px] font-semibold text-gray-500/90 dark:text-gray-400">
            @ {ownerName}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex items-center gap-1">
          <span className="min-w-0 truncate text-[13px] font-[600] text-gray-600 dark:text-gray-200">
            {pet.name ?? "이름 없음"}
          </span>
          {sexLabel && (
            <span
              className={cn(
                "shrink-0 text-[13px] font-bold",
                isMale(pet.sex) ? "text-blue-600" : "text-red-600",
              )}
            >
              {sexLabel}
            </span>
          )}
        </div>

        <BadgeList items={pet.morphs} />
        <BadgeList
          items={pet.traits}
          variant="outline"
          badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
        />

        {pet.hatchingDate && (
          <span className="mt-2 text-[11px] font-[600] text-gray-500 dark:text-gray-400">
            {DateTime.fromISO(pet.hatchingDate).toFormat("yy년 M월 d일")}
          </span>
        )}

        {price !== undefined && (
          <span className="mt-1 text-[13px] font-bold text-emerald-600">{formatPrice(price)}</span>
        )}
      </div>
    </div>
  );

  const horizontalCardContent = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900",
        isDeleted && "cursor-not-allowed bg-red-100/50 dark:bg-red-900/30",
      )}
    >
      <div className="relative h-14 w-14 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800">
        <Image
          src="/assets/lizard.png"
          alt={pet.name ?? "펫 이미지"}
          fill
          className="rounded-xl object-cover"
        />
        {isDeleted && (
          <div className="absolute -right-1 -top-1 rounded-md bg-red-600 px-1 py-0.5 text-[8px] font-bold text-white">
            삭제됨
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-[14px] font-semibold text-gray-800 dark:text-gray-100">
            {pet.name ?? "이름 없음"}
          </span>
          {sexLabel && (
            <span
              className={cn(
                "shrink-0 text-[13px] font-bold",
                isMale(pet.sex) ? "text-blue-500" : "text-red-500",
              )}
            >
              {sexLabel}
            </span>
          )}
          {ownerName && !isMyPet && (
            <span className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <ScanFace className="h-3 w-3" />
              {ownerName}
            </span>
          )}
        </div>

        <BadgeList items={pet.morphs} />
        <BadgeList
          items={pet.traits}
          variant="outline"
          badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      <div className="shrink-0 text-right">
        {price !== undefined && (
          <p className="text-[14px] font-bold text-emerald-600">{formatPrice(price)}</p>
        )}
        {adoptionDate && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {DateTime.fromISO(adoptionDate).toFormat("yy.M.d")}
          </p>
        )}
        {!price && pet.hatchingDate && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {DateTime.fromISO(pet.hatchingDate).toFormat("yy.M.d")}
          </p>
        )}
      </div>
    </div>
  );

  const cardContent = variant === "vertical" ? verticalCardContent : horizontalCardContent;

  // isMyPet인 경우 그라데이션 border wrapper 적용
  const wrappedContent =
    isMyPet && variant === "vertical" ? (
      <div
        className="rounded-xl p-[1.5px]"
        style={{
          background: "linear-gradient(90deg, #60a5fa, #c084fc)",
        }}
      >
        {cardContent}
      </div>
    ) : (
      cardContent
    );

  return (
    <Link href={`/pet/${pet.petId}`} className={cn(isDeleted && "pointer-events-none")}>
      {wrappedContent}
    </Link>
  );
}
