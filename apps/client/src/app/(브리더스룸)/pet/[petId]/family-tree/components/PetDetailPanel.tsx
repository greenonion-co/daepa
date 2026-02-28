"use client";

import PetThumbnail from "@/components/common/PetThumbnail";
// import { SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import type { FamilyPetData } from "../lib/types";
// import type { PetDtoSpecies } from "@repo/api-client";

interface PetDetailPanelProps {
  pet: FamilyPetData | null;
  father?: FamilyPetData | null;
  mother?: FamilyPetData | null;
  onAction?: (action: string, petId: string) => void;
}

function PanelRow({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
      style={{ animationDelay: `${delay}ms`, animationDuration: "200ms" }}
    >
      {children}
    </div>
  );
}

export default function PetDetailPanel({ pet, father, mother, onAction }: PetDetailPanelProps) {
  if (!pet) {
    return (
      <div className="pointer-events-none flex h-52 w-52 items-center justify-center rounded-xl border border-gray-200 bg-white/90 px-3 py-4 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
        <p className="text-xs text-gray-400 dark:text-gray-500">선택된 개체가 없습니다</p>
      </div>
    );
  }

  const dotColor =
    pet.sex === "M" || pet.sex === "MALE"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === "F" || pet.sex === "FEMALE"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";

  // const speciesLabel = pet.species ? SPECIES_KOREAN_INFO[pet.species as PetDtoSpecies] : null;

  const hatchingLabel = pet.hatchingDate
    ? new Date(pet.hatchingDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const disabledPet = pet.isPublic === false && !pet.isOwner;
  let step = 0;

  return (
    <div
      key={pet.petId}
      className="pointer-events-none flex w-52 flex-col gap-1 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90"
    >
      {/* 비공개 배지 */}
      {disabledPet && (
        <PanelRow delay={step++ * 50}>
          <div className="flex justify-center">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              비공개 개체
            </span>
          </div>
        </PanelRow>
      )}

      {/* 썸네일 */}
      <PanelRow delay={step++ * 50}>
        <div className="mx-auto overflow-hidden">
          <PetThumbnail petId={pet.petId} maxSize={200} objectFit="cover" />
        </div>
      </PanelRow>

      {/* 이름 + 성별 + 부모 정보 */}
      {!disabledPet && (
        <PanelRow delay={step++ * 50}>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
              <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                {pet.name ?? "이름 없음"}
              </span>
            </div>
            {(father || mother) && (
              <div className="flex items-center justify-center gap-1">
                {father && (
                  <div className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2383E2] dark:bg-[#529CCA]" />
                    <span className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                      {father.name ?? "이름 없음"}
                    </span>
                  </div>
                )}
                {father && mother && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">x</span>
                )}
                {mother && (
                  <div className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E03E3E] dark:bg-[#FF7369]" />
                    <span className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                      {mother.name ?? "이름 없음"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </PanelRow>
      )}

      {/* 소유자 */}
      {!disabledPet && pet.ownerName && (
        <PanelRow delay={step++ * 50}>
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
            @{pet.ownerName}
          </p>
        </PanelRow>
      )}

      {/* 종 */}
      {/* {speciesLabel && (
        <PanelRow delay={step++ * 50}>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">{speciesLabel}</p>
        </PanelRow>
      )} */}

      {/* 모프 */}
      {pet.morphs && pet.morphs.length > 0 && (
        <PanelRow delay={step++ * 50}>
          <div className="flex flex-wrap justify-center gap-1">
            {pet.morphs.slice(0, 2).map((morph) => (
              <span
                key={morph}
                className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 dark:border-gray-700 dark:text-gray-400"
              >
                {morph}
              </span>
            ))}
            {pet.morphs.length > 2 && (
              <span className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
                +{pet.morphs.length - 2}
              </span>
            )}
          </div>
        </PanelRow>
      )}

      {/* 형질 */}
      {/* {pet.traits && pet.traits.length > 0 && (
        <PanelRow delay={step++ * 50}>
          <div className="flex flex-wrap justify-center gap-1">
            {pet.traits.slice(0, 2).map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 dark:border-gray-700 dark:text-gray-400"
              >
                {trait}
              </span>
            ))}
            {pet.traits.length > 2 && (
              <span className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
                +{pet.traits.length - 2}
              </span>
            )}
          </div>
        </PanelRow>
      )} */}

      {/* 해칭일 */}
      {hatchingLabel && (
        <PanelRow delay={step++ * 50}>
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
            {hatchingLabel}
          </p>
        </PanelRow>
      )}

      {/* 액션 메뉴 */}
      {onAction && (
        <PanelRow delay={step++ * 50}>
          <div className="pointer-events-auto flex flex-col gap-0.5 border-t border-gray-100 pt-1.5 dark:border-gray-800">
            {!disabledPet && (
              <button
                type="button"
                onClick={() => onAction("detail", pet.petId)}
                className="w-full rounded-md px-2 py-1 text-left text-[11px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                상세 보기
              </button>
            )}
            {!disabledPet &&
              pet.isOwner &&
              (pet.sex === "M" ||
                pet.sex === "MALE" ||
                pet.sex === "F" ||
                pet.sex === "FEMALE") && (
                <button
                  type="button"
                  onClick={() => onAction("select-mate", pet.petId)}
                  className="w-full rounded-md px-2 py-1 text-left text-[11px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  메이팅 개체 선택
                </button>
              )}
            <button
              type="button"
              onClick={() => onAction("relation", pet.petId)}
              className="w-full rounded-md px-2 py-1 text-left text-[11px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              관계도
            </button>
            <button
              type="button"
              onClick={() => onAction("family-tree", pet.petId)}
              className="w-full rounded-md px-2 py-1 text-left text-[11px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              가계도
            </button>
          </div>
        </PanelRow>
      )}
    </div>
  );
}
