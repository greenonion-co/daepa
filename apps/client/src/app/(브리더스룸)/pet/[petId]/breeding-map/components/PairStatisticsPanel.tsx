"use client";

import CalendarSelect from "@/app/(브리더스룸)/hatching/components/CalendarSelect";
import { cn } from "@/lib/utils";
import type { PairStatisticsSummary } from "../hooks/usePairStatistics";
import { Plus } from "lucide-react";

export interface PairChildInfo {
  petId: string;
  name?: string;
  sex?: string;
  morphs?: string[];
  season?: number;
  clutchIndex?: number;
}

interface PairStatisticsPanelProps {
  statistics: PairStatisticsSummary | null;
  isLoading: boolean;
  hasPair: boolean;
  isOpposite?: boolean;
  /** 선택된 두 개체 모두 내 개체인지 여부 */
  isBothOwned?: boolean;
  onAddMating?: (matingDate: string, season: number) => void | Promise<void>;
  matingDates?: string[];
  latestSeason?: number;
  onAddLaying?: () => void;
  onExpand?: () => void;
  /** 트리에 존재하는 두 개체의 자식 목록 */
  pairChildren?: PairChildInfo[];
  onChildClick?: (petId: string) => void;
}

function AddButtons({
  onAddMating,
  onAddLaying,
  canAddLaying,
  matingDates,
  latestSeason,
}: {
  onAddMating?: (matingDate: string, season: number) => void | Promise<void>;
  onAddLaying?: () => void;
  canAddLaying?: boolean;
  matingDates?: string[];
  latestSeason?: number;
}) {
  if (!onAddMating && !onAddLaying) return null;
  return (
    <div className="mx-auto flex gap-1">
      {onAddMating && (
        <CalendarSelect
          size="sm"
          triggerText="메이팅"
          triggerTextClassName="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent dark:from-blue-400 dark:to-purple-400"
          confirmButtonText="추가"
          disabledDates={matingDates}
          showSeasonInput
          popOverAlign="end"
          latestSeason={latestSeason}
          onConfirm={(matingDate, season) => onAddMating(matingDate, season!)}
        />
      )}
      {onAddLaying && (
        <button
          type="button"
          onClick={canAddLaying ? onAddLaying : undefined}
          disabled={!canAddLaying}
          className={cn(
            "flex w-fit items-center justify-center gap-1 rounded-lg px-1",
            canAddLaying
              ? "cursor-pointer text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
              : "cursor-not-allowed opacity-40",
          )}
          title={canAddLaying ? "산란 추가" : "메이팅을 먼저 추가해주세요"}
        >
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-100 text-[12px] text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Plus className="h-2 w-2" />
          </div>
          <div className="flex items-center gap-1 text-xs">산란</div>
        </button>
      )}
    </div>
  );
}

export default function PairStatisticsPanel({
  statistics,
  isLoading,
  hasPair,
  isOpposite = true,
  isBothOwned = true,
  onAddMating,
  matingDates,
  latestSeason,
  onAddLaying,
  onExpand,
  pairChildren,
  onChildClick,
}: PairStatisticsPanelProps) {
  const canAddLaying = (statistics?.totalMatings ?? 0) > 0;

  if (!isOpposite) {
    return (
      <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 p-3 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          메이팅 정보
        </span>
        <p className="text-center text-[10px] text-red-500 dark:text-gray-500">
          수컷 × 암컷 조합에서만 확인할 수 있습니다
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pointer-events-auto flex w-full flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 p-3 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50">
        <span className="self-start text-[11px] font-medium text-gray-500 dark:text-gray-400">
          메이팅 정보
        </span>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (!hasPair || !statistics) {
    return (
      <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 p-3 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            메이팅 정보
          </span>
          {isBothOwned && (
            <AddButtons
              onAddMating={onAddMating}
              onAddLaying={onAddLaying}
              canAddLaying={canAddLaying}
              matingDates={matingDates}
              latestSeason={latestSeason}
            />
          )}
        </div>

        {!isBothOwned ? (
          <p className="text-center text-[10px] text-red-400 dark:text-red-500">
            부/모 중 타인 소유 개체가 있습니다.
          </p>
        ) : (
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
            선택된 페어 메이팅 정보 없음
          </p>
        )}
      </div>
    );
  }

  const { egg, totalMatings, totalLayings } = statistics;

  return (
    <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 p-3 shadow-lg backdrop-blur-sm md:w-52 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          메이팅 정보
        </span>
        {isBothOwned && (
          <AddButtons
            onAddMating={onAddMating}
            onAddLaying={onAddLaying}
            canAddLaying={canAddLaying}
            matingDates={matingDates}
            latestSeason={latestSeason}
          />
        )}
      </div>
      {!isBothOwned && (
        <p className="text-center text-[10px] text-red-400 dark:text-red-500">
          부/모 중 타인 소유 개체가 있습니다.
        </p>
      )}

      {/* 핵심 지표 */}
      <div className="space-y-1">
        <StatRow label="메이팅" value={`${totalMatings}시즌`} />
        <StatRow label="산란" value={`${totalLayings}차`} />
        <StatRow label="알" value={`${egg.total}개`} />
        <StatRow label="유정란 비율" value={`${egg.fertilizedRate.toFixed(1)}%`} />
        <StatRow label="해칭 성공" value={`${egg.hatched}개`} highlight />
        <StatRow label="해칭 성공률" value={`${egg.hatchingRate.toFixed(1)}%`} highlight />
      </div>

      {/* 상세 보기 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onExpand?.()}
          className="flex items-center gap-1 text-blue-500 hover:font-semibold dark:text-gray-500 dark:hover:text-gray-300"
          title="상세 보기"
        >
          <span className={"text-[11px]"}>상세 정보 열기</span>
          <ExpandIcon size={10} />
        </button>
      </div>

      {/* 자식 목록 */}
      {pairChildren && pairChildren.length > 0 && (
        <div className="border-t border-gray-100 pt-1.5 dark:border-gray-800">
          <p className="mb-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            자식 ({pairChildren.length})
          </p>
          <div className="flex max-h-24 flex-col gap-0.5 overflow-x-hidden overflow-y-auto">
            {pairChildren.map((child) => {
              const dotColor =
                child.sex === "M" || child.sex === "MALE"
                  ? "bg-[#2383E2] dark:bg-[#529CCA]"
                  : child.sex === "F" || child.sex === "FEMALE"
                    ? "bg-[#E03E3E] dark:bg-[#FF7369]"
                    : "bg-gray-300";
              return (
                <div
                  key={child.petId}
                  className="-mx-1 flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  onMouseEnter={() => onChildClick?.(child.petId)}
                  onClick={() => onChildClick?.(child.petId)}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className="truncate text-[10px] text-gray-600 dark:text-gray-300">
                    {child.name ?? "이름 없음"}
                  </span>
                  {child.season != null && (
                    <span className="shrink-0 text-[9px] text-gray-400 dark:text-gray-500">
                      {child.season}-{child.clutchIndex}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1">
      <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-[11px] font-medium tabular-nums ${
          highlight ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ExpandIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="10 2 14 2 14 6" />
      <polyline points="6 14 2 14 2 10" />
      <line x1="14" y1="2" x2="9" y2="7" />
      <line x1="2" y1="14" x2="7" y2="9" />
    </svg>
  );
}
