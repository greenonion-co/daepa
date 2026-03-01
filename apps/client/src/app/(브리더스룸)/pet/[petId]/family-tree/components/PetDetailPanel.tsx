"use client";

import { ChevronRight } from "lucide-react";
import PetThumbnail from "@/components/common/PetThumbnail";
import type { FamilyPetData } from "../lib/types";

interface PetDetailPanelProps {
  pet: FamilyPetData | null;
  father?: FamilyPetData | null;
  mother?: FamilyPetData | null;
  onAction?: (action: string, petId: string) => void;
  onFocusNode?: (petId: string) => void;
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

export default function PetDetailPanel({
  pet,
  father,
  mother,
  onAction,
  onFocusNode,
}: PetDetailPanelProps) {
  if (!pet) {
    return (
      <div className="pointer-events-none flex h-52 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/90 px-3 py-4 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:bg-gray-900/90">
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
      className="pointer-events-none flex w-full flex-col gap-1 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:bg-gray-900/90"
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
                  <button
                    type="button"
                    className="pointer-events-auto flex items-center gap-0.5 rounded px-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => onFocusNode?.(father.petId)}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2383E2] dark:bg-[#529CCA]" />
                    <span className="truncate text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      {father.name ?? "이름 없음"}
                    </span>
                  </button>
                )}
                {father && mother && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">x</span>
                )}
                {mother && (
                  <button
                    type="button"
                    className="pointer-events-auto flex items-center gap-0.5 rounded px-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => onFocusNode?.(mother.petId)}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E03E3E] dark:bg-[#FF7369]" />
                    <span className="truncate text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      {mother.name ?? "이름 없음"}
                    </span>
                  </button>
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
          <div className="pointer-events-auto flex flex-col gap-1 pt-1.5 dark:border-gray-800">
            {!disabledPet && (
              <button
                type="button"
                onClick={() => onAction("detail", pet.petId)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
              >
                상세 정보
                <ChevronRight className="h-3 w-3 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            {/* {!disabledPet &&
              pet.isOwner &&
              (pet.sex === "M" ||
                pet.sex === "MALE" ||
                pet.sex === "F" ||
                pet.sex === "FEMALE") && (
                <button
                  type="button"
                  onClick={() => onAction("select-mate", pet.petId)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
                >
                  페어 선택
                  <ChevronRight className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                </button>
              )} */}
            <button
              type="button"
              onClick={() => onAction("family-tree", pet.petId)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 px-2.5 py-1 text-[11px] text-gray-700 transition-colors hover:from-blue-200/70 hover:to-purple-200/80 active:from-blue-200/70 active:to-purple-200/80 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50 dark:text-gray-300 dark:hover:from-blue-900/60 dark:hover:to-purple-900/70 dark:active:from-blue-900/60 dark:active:to-purple-900/70"
            >
              브리딩맵
              <ChevronRight className="h-3 w-3 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => onAction("relation", pet.petId)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            >
              관계도
              <ChevronRight className="h-3 w-3 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </PanelRow>
      )}
    </div>
  );
}
