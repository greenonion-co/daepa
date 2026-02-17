"use client";
import { DateTime } from "luxon";
import {
  EGG_STATUS_KOREAN_INFO,
  GENDER_KOREAN_INFO,
  SPECIES_KOREAN_ALIAS_INFO,
} from "../../constants";
import {
  PetDto,
  PetDtoEggStatus,
  PetDtoFather,
  PetDtoMother,
  PetDtoSex,
  PetDtoType,
  PetHiddenStatusDtoHiddenStatus,
} from "@repo/api-client";

import { cn, getEggDDayText } from "@/lib/utils";
import TooltipText from "../../components/TooltipText";
import { useEffect, useRef } from "react";
import BadgeList from "../../components/BadgeList";
import Link from "next/link";
import { getSexIcon } from "@/lib/sex-icon";

interface PetCardProps {
  date: string;
  pets: PetDto[];
  tab: "all" | PetDtoType;
  isSelected: boolean;
}

const getParentInfo = (parent: PetDtoFather | PetDtoMother | undefined) => {
  if (!parent) return "-";

  if ("hiddenStatus" in parent) {
    return (
      (parent.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET &&
        "(비공개 처리된 펫입니다.)") ||
      (parent.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED && "(삭제된 펫입니다.)")
    );
  }

  return parent.name;
};

const HatchingPetCard = ({ date, pets, tab, isSelected }: PetCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      className={cn(
        "mb-7 scroll-mt-20 rounded-2xl bg-white dark:bg-transparent",
        isSelected && "rounded-xl border-[1.5px] border-blue-200 shadow-md dark:border-blue-700/50",
      )}
    >
      <div className="flex flex-wrap">
        {pets
          .filter((pet) => {
            if (tab === "all") return true;
            if (tab === PetDtoType.PET) return pet.type === PetDtoType.PET;
            if (tab === PetDtoType.EGG) return pet.type === PetDtoType.EGG;
          })
          .map((pet, index) => {
            const isEgg = pet.type === PetDtoType.EGG;

            const cardContent = (
              <div
                className={cn(
                  "flex w-full flex-1 items-center justify-between p-2 text-[14px]",
                  !isEgg && "hover:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                <div className="flex">
                  <div className="flex w-[56px] items-center justify-center font-semibold text-gray-500 dark:text-gray-400">
                    {index === 0 && date
                      ? DateTime.fromISO(date).setLocale("ko").toFormat("dd EEE")
                      : ""}
                  </div>

                  <div className="flex flex-col gap-1 px-1 py-1.5">
                    <div className="flex gap-1 font-semibold">
                      {pet.type === PetDtoType.PET ? (
                        <div className="flex items-center gap-1">
                          <div className="text-gray-800 dark:text-gray-300">{pet?.name}</div>
                          {/*<div className="text-[12px] text-gray-500 dark:text-gray-400">*/}
                          {/*  | {SPECIES_KOREAN_ALIAS_INFO[pet.species]}*/}
                          {/*</div>*/}
                          {getSexIcon(pet.sex, { size: "xs" })}
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          {pet.father && !("hiddenStatus" in pet.father) && (
                            <Link
                              href={`/pet/${pet.father.petId}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TooltipText
                                text={getParentInfo(pet.father) || "@"}
                                title={pet.father?.name ?? "@"}
                                content={`${pet.father?.morphs?.join(" | ") ?? ""} ${pet.father?.traits?.join(" | ") ?? ""}`}
                                description={
                                  pet.father?.owner?.name ? `@${pet.father?.owner?.name}` : ""
                                }
                                className="cursor-pointer text-blue-700 underline dark:text-blue-400"
                              />
                            </Link>
                          )}
                          x
                          {pet.mother && !("hiddenStatus" in pet.mother) && (
                            <Link
                              href={`/pet/${pet.mother.petId}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TooltipText
                                text={getParentInfo(pet.mother) || "@"}
                                title={pet.mother?.name ?? "@"}
                                content={`${pet.mother?.morphs?.join(" | ") ?? ""} ${pet.mother?.traits?.join(" | ") ?? ""}`}
                                description={
                                  pet.mother?.owner?.name ? `@${pet.mother?.owner?.name}` : ""
                                }
                                className="cursor-pointer text-blue-700 underline dark:text-blue-400"
                              />
                            </Link>
                          )}
                          {/* {isEgg && `${pet.clutch ?? "@"}-${pet.clutchOrder ?? "@"}`} */}
                          {isEgg && pet.temperature ? (
                            <span className="font-[400] text-gray-500 dark:text-gray-400">
                              {" "}
                              | {pet.temperature}℃
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <BadgeList variant={"outline"} items={pet.morphs} />
                    <BadgeList items={pet.traits} variant="secondary" />

                    {pet?.desc && (
                      <div className="text-gray-800 dark:text-gray-200">{pet.desc}</div>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "text-gray-600 dark:text-gray-400",
                    pet.type === PetDtoType.PET && "text-blue-700 dark:text-blue-300",
                  )}
                >
                  {pet.type === PetDtoType.EGG
                    ? (() => {
                        const status = pet.eggDetail?.status;
                        if (!status) return "";

                        // 유정란인 경우 D-day 표시
                        if (status === PetDtoEggStatus.FERTILIZED && date) {
                          const dDayText = getEggDDayText(date, pet.temperature ?? 25);
                          const colorClass = dDayText.startsWith("D-")
                            ? "text-green-600"
                            : dDayText.startsWith("D+")
                              ? "text-red-500"
                              : "text-blue-600";
                          return (
                            <span className={colorClass}>
                              {dDayText}
                              <span className="text-green-600/60 dark:text-green-300/30">
                                {" "}
                                유정란
                              </span>
                            </span>
                          );
                        }

                        const statusColorClass =
                          status === PetDtoEggStatus.UNFERTILIZED
                            ? "text-gray-500 dark:text-gray-400"
                            : status === PetDtoEggStatus.DEAD
                              ? "text-red-500/80 dark:text-red-400/80"
                              : "";
                        return (
                          <span className={statusColorClass}>{EGG_STATUS_KOREAN_INFO[status]}</span>
                        );
                      })()
                    : (() => {
                        const d = DateTime.fromISO(pet.hatchingDate ?? "");
                        return d.isValid ? `${d.toFormat("MM/dd")} 해칭 완료` : "";
                      })()}
                </div>
              </div>
            );

            return isEgg ? (
              <div key={pet.petId} className="w-full">
                {cardContent}
              </div>
            ) : (
              <Link key={pet.petId} href={`/pet/${pet.petId}`} className="w-full cursor-pointer">
                {cardContent}
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default HatchingPetCard;
