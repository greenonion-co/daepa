"use client";
import { format, isValid, parseISO } from "date-fns";
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

import { cn } from "@/lib/utils";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import TooltipText from "../../components/TooltipText";
import { useEffect, useRef } from "react";

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
  const router = useRouter();
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
        "mb-7 scroll-mt-20",
        isSelected && "rounded-xl border-[1.5px] border-blue-200 shadow-md",
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
            const morphs = pet.morphs?.join(" | ");
            const traits = pet.traits?.join(" | ");
            return (
              <div
                key={pet.petId}
                className="w-full cursor-pointer"
                onClick={() => router.push(`/pet/${pet.petId}`)}
              >
                <div
                  className={cn(
                    "flex w-full flex-1 items-center justify-between p-2 text-[14px] hover:rounded-xl hover:bg-gray-100",
                  )}
                >
                  <div className="flex">
                    <div className="flex w-[56px] items-center justify-center font-semibold text-gray-500">
                      {index === 0 && date ? format(parseISO(date), "dd EE", { locale: ko }) : ""}
                    </div>

                    <div className="flex flex-col px-1 py-1.5">
                      <div className="flex gap-1 font-semibold">
                        {pet.type === PetDtoType.PET ? (
                          <div className="flex items-center gap-1">
                            <div className="text-gray-800">{pet?.name}</div>
                            <div className="text-[12px] text-gray-500">
                              | {SPECIES_KOREAN_ALIAS_INFO[pet.species]}
                            </div>
                            <div className="text-[12px] text-gray-500">
                              | {GENDER_KOREAN_INFO[pet.sex ?? PetDtoSex.NON]}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            {pet.father && !("hiddenStatus" in pet.father) && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!pet.father || "hiddenStatus" in pet.father) return;
                                  router.push(`/pet/${pet.father.petId}`);
                                }}
                              >
                                <TooltipText
                                  text={getParentInfo(pet.father) || "@"}
                                  title={pet.father?.name ?? "@"}
                                  content={`${pet.father?.morphs?.join(" | ") ?? ""} ${pet.father?.traits?.join(" | ") ?? ""}`}
                                  description={pet.father?.owner?.name ?? ""}
                                  className="text-blue-700 underline"
                                />
                              </div>
                            )}
                            x
                            {pet.mother && !("hiddenStatus" in pet.mother) && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!pet.mother || "hiddenStatus" in pet.mother) return;
                                  router.push(`/pet/${pet.mother.petId}`);
                                }}
                              >
                                <TooltipText
                                  text={getParentInfo(pet.mother) || "@"}
                                  title={pet.mother?.name ?? "@"}
                                  content={`${pet.mother?.morphs?.join(" | ") ?? ""} ${pet.mother?.traits?.join(" | ") ?? ""}`}
                                  description={pet.mother?.owner?.name ?? ""}
                                  className="text-blue-700 underline"
                                />
                              </div>
                            )}
                            {/* {isEgg && `${pet.clutch ?? "@"}-${pet.clutchOrder ?? "@"}`} */}
                            {isEgg && pet.temperature ? (
                              <span className="font-[400] text-gray-500">
                                {" "}
                                | {pet.temperature}℃
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {morphs ? <span className="text-[12px] text-gray-500"> {morphs}</span> : null}
                      {traits ? <span className="text-[12px] text-gray-500"> {traits}</span> : null}
                      {pet?.desc && <div className="text-gray-800">{pet.desc}</div>}
                    </div>
                  </div>

                  <div
                    className={cn("text-gray-600", pet.type === PetDtoType.PET && "text-blue-700")}
                  >
                    {pet.type === PetDtoType.EGG
                      ? pet.eggDetail?.status
                        ? EGG_STATUS_KOREAN_INFO[
                            pet.eggDetail?.status ?? PetDtoEggStatus.UNFERTILIZED
                          ]
                        : ""
                      : (() => {
                          const d = parseISO(pet.hatchingDate ?? "");
                          return isValid(d) ? format(d, "MM/dd 해칭", { locale: ko }) : "";
                        })()}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default HatchingPetCard;
