"use client";

import {
  PetAdoptionCompletedDto,
  PetHiddenStatusDto,
  PetHiddenStatusDtoHiddenStatus,
} from "@repo/api-client";
import { DateTime } from "luxon";
import { EyeOff, Lock, ScanFace } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { cn, formatPrice } from "@/lib/utils";
import BadgeList from "@/app/(브리더스룸)/components/BadgeList";
import BreederBadge from "@/app/(브리더스룸)/components/BreederBadge";
import PetThumbnail from "@/components/common/PetThumbnail";

/** 기본 펫 정보 인터페이스 */
interface BasePetInfo {
  petId: string;
  name?: string;
  sex?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
  isBreeder?: boolean;
}

/** 소유자 정보가 있는 펫 */
interface PetWithOwner extends BasePetInfo {
  owner: { userId: string; name: string };
}

type PetData = PetHiddenStatusDto | PetWithOwner | BasePetInfo | PetAdoptionCompletedDto;

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

  const dotColor =
    pet.sex === "M"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === "F"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";
  const isMyPet = hasOwner(pet) && pet.owner.userId === user?.userId;
  const ownerName = hasOwner(pet) ? pet.owner.name : null;
  const isDeleted = pet.isDeleted;

  const verticalCardContent = (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col gap-1 rounded-xl bg-white p-2 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900",
        isDeleted && "cursor-not-allowed bg-red-100/50 dark:bg-red-900/30",
      )}
      style={{ width }}
    >
      <div className="relative aspect-square w-full rounded-xl bg-gray-100 dark:bg-gray-800">
        <PetThumbnail maxSize={150} petId={pet.petId} />
        {("isBreeder" in pet && pet.isBreeder) && (
          <div className="absolute top-1 left-1 z-10">
            <BreederBadge size="sm" />
          </div>
        )}
        {isDeleted ? (
          <div className="absolute right-1 bottom-1 rounded-md bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">
            삭제됨
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-center">
        <span
          className={cn(
            "text-[11px] font-semibold",
            isMyPet
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-gray-500/90 dark:text-gray-400",
          )}
        >
          {ownerName ? `@ ${ownerName}` : null}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          <span className="min-w-0 truncate text-[13px] font-[600] text-gray-600 dark:text-gray-200">
            {pet.name ?? "이름 없음"}
          </span>
          {pet.hatchingDate && (
            <span className="ml-auto shrink-0 text-[11px]">
              {DateTime.fromISO(pet.hatchingDate).toFormat("yy.M.d")}
            </span>
          )}
        </div>

        <BadgeList variant={"outline"} items={pet.morphs} badgeSize="sm" />
        <BadgeList items={pet.traits} variant={"secondary"} badgeSize="sm" />

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
        <PetThumbnail maxSize={150} petId={pet.petId} />
        {"isBreeder" in pet && pet.isBreeder && (
          <div className="absolute -top-1 -left-1 z-10">
            <BreederBadge size="sm" />
          </div>
        )}
        {isDeleted && (
          <div className="absolute -top-1 -right-1 rounded-md bg-red-600 px-1 py-0.5 text-[8px] font-bold text-white">
            삭제됨
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          <span className="min-w-0 truncate text-[14px] font-semibold text-gray-800 dark:text-gray-100">
            {pet.name ?? "이름 없음"}
          </span>
          {isMyPet ? (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              내 개체
            </span>
          ) : ownerName ? (
            <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <ScanFace className="h-3 w-3" />
              {ownerName}
            </span>
          ) : null}
        </div>

        <BadgeList items={pet.morphs} badgeSize="sm" />
        <BadgeList
          items={pet.traits}
          variant="outline"
          badgeSize="sm"
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

  if (isDeleted) {
    return <div className="pointer-events-none">{cardContent}</div>;
  }

  return (
    <Link href={`/pet/${pet.petId}`} className="cursor-pointer">
      {cardContent}
    </Link>
  );
}
