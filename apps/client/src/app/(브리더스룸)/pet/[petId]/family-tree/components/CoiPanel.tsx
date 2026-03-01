"use client";

import { Fragment } from "react";
import { COI_LEVEL_CONFIG, type CoiLevel, type CommonAncestorDetail } from "../lib/coi";
import PetThumbnail from "@/components/common/PetThumbnail";

import { X } from "lucide-react";

export interface CoiPanelPetInfo {
  petId: string;
  name?: string;
  sex?: string;
  species?: string;
  imageUrl?: string;
  ownerName?: string;
}

interface CoiPanelProps {
  pets?: (CoiPanelPetInfo | undefined)[];
  coi: number;
  level: CoiLevel;
  commonAncestors: CommonAncestorDetail[];
  equivalentRelation: string;
  isLoading: boolean;
  isReady: boolean;
  onClear: () => void;
  onClearPet?: (petId: string) => void;
  onFocusAncestor?: (petId: string) => void;
  onSelectMate?: (role: "부" | "모") => void;
}

export default function CoiPanel({
  pets,
  coi,
  level,
  commonAncestors,
  isLoading,
  isReady,
  onClear,
  onClearPet,
  onFocusAncestor,
  onSelectMate,
}: CoiPanelProps) {
  const expanded = false;

  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const config = COI_LEVEL_CONFIG[level];
  const coiPercent = (coi * 100).toFixed(2);
  const accentColor = isDark ? config.darkColor : config.color;
  const bgColor = isDark ? config.darkBgColor : config.bgColor;

  const ancestorLimit = expanded ? commonAncestors.length : 5;

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/90 ${
        expanded ? "w-80 p-4" : "w-52 p-3"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className={`font-medium text-gray-500 dark:text-gray-400 ${expanded ? "text-sm" : "text-[11px]"}`}
        >
          COI 계산
        </span>
        {pets && pets.some(Boolean) && (
          <button
            type="button"
            onClick={onClear}
            className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${expanded ? "text-xs" : "text-[10px]"}`}
          >
            초기화
          </button>
        )}
      </div>

      {/* 선택된 개체 정보 */}
      <div className="flex items-center gap-1">
        {(["부", "모"] as const).map((role, idx) => {
          const pet = pets?.[idx];
          const dotClass =
            pet?.sex === "M" || pet?.sex === "MALE"
              ? "bg-[#2383E2] dark:bg-[#529CCA]"
              : pet?.sex === "F" || pet?.sex === "FEMALE"
                ? "bg-[#E03E3E] dark:bg-[#FF7369]"
                : "bg-gray-300";

          return (
            <Fragment key={pet?.petId ?? idx}>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                {pet ? (
                  <div>
                    <span className="text-[10px]">{role}</span>

                    <div className="relative h-[80px] w-[80px] overflow-hidden rounded-lg">
                      <PetThumbnail
                        petId={pet.petId}
                        maxSize={70}
                        objectFit="cover"
                        className="h-full w-full"
                      />
                      {onClearPet && (
                        <button
                          type="button"
                          onClick={() => onClearPet(pet.petId)}
                          className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex w-full flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
                        <span className="truncate text-[11px] leading-none font-semibold text-gray-800 dark:text-gray-100">
                          {pet.name ?? "이름 없음"}
                        </span>
                      </div>
                      {pet.ownerName && (
                        <span className="truncate text-[9px] text-gray-400 dark:text-gray-500">
                          @{pet.ownerName}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px]">{role}</span>

                    <div
                      className={`flex h-[80px] w-[80px] flex-col items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 ${onSelectMate ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" : ""}`}
                      onClick={() => onSelectMate?.(role)}
                    >
                      <span className="text-sm">+</span>
                    </div>
                    <div className="h-[30px]" />
                  </div>
                )}
              </div>
              {idx === 0 && (
                <span className="text-[10px] text-gray-500 dark:text-gray-600">&times;</span>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* 결과 */}
      {!isReady ? (
        <p className="text-center text-[11px] text-blue-500 dark:text-gray-500"></p>
      ) : isLoading ? (
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="text-[11px] text-gray-400">조상 탐색 중...</span>
        </div>
      ) : (
        <>
          {/* COI 퍼센트 */}
          <div
            className={`rounded-lg text-center ${expanded ? "px-4 py-3" : "px-2 py-2"}`}
            style={{ backgroundColor: bgColor }}
          >
            <span
              className={`font-bold tabular-nums ${expanded ? "text-4xl" : "text-2xl"}`}
              style={{ color: accentColor }}
            >
              {coiPercent}%
            </span>
          </div>

          {/* 위험도 라벨 + 관계 */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full ${expanded ? "h-2.5 w-2.5" : "h-2 w-2"}`}
                style={{ backgroundColor: accentColor }}
              />
              <span
                className={`font-semibold ${expanded ? "text-sm" : "text-xs"}`}
                style={{ color: accentColor }}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* 공통 조상 */}
          {commonAncestors.length > 0 && (
            <div className="mt-1 border-t border-gray-100 pt-1.5 dark:border-gray-800">
              <p
                className={`mb-1 font-medium text-gray-500 dark:text-gray-400 ${expanded ? "text-xs" : "text-[10px]"}`}
              >
                공통 조상 ({commonAncestors.length}마리)
              </p>
              <div className={expanded ? "space-y-1.5" : "space-y-1"}>
                {commonAncestors.slice(0, ancestorLimit).map((ca) => (
                  <div
                    key={ca.petId}
                    className={`-mx-1 flex items-center justify-between gap-2 rounded px-1 ${onFocusAncestor ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                    onClick={() => onFocusAncestor?.(ca.petId)}
                  >
                    <span
                      className={`truncate text-gray-600 dark:text-gray-300 ${expanded ? "text-xs" : "text-[10px]"}`}
                    >
                      {ca.name ?? "이름 없음"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`text-gray-400 dark:text-gray-500 ${expanded ? "text-[11px]" : "text-[9px]"}`}
                      >
                        {ca.minGeneration === 0 ? "직접" : `${ca.minGeneration}세대`}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${expanded ? "text-xs" : "text-[10px]"}`}
                        style={{ color: accentColor }}
                      >
                        {(ca.contribution * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {!expanded && commonAncestors.length > 5 && (
                  <p className="text-[9px] text-gray-400 dark:text-gray-500">
                    외 {commonAncestors.length - 5}마리...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 기준 안내 */}
          <div
            className={`mt-1 border-t border-gray-100 pt-1.5 dark:border-gray-800 ${expanded ? "space-y-1" : "space-y-0.5"}`}
          >
            {(
              Object.entries(COI_LEVEL_CONFIG) as [CoiLevel, (typeof COI_LEVEL_CONFIG)[CoiLevel]][]
            ).map(([key, cfg]) => (
              <div
                key={key}
                className={`flex items-center gap-1 ${expanded ? "text-[11px]" : "text-[9px]"}`}
                style={{ opacity: key === level ? 1 : 0.5 }}
              >
                <span
                  className={`rounded-full ${expanded ? "h-2 w-2" : "h-1.5 w-1.5"}`}
                  style={{
                    backgroundColor: isDark ? cfg.darkColor : cfg.color,
                  }}
                />
                <span className="text-gray-500 dark:text-gray-400">{cfg.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
