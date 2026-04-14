"use client";

import { AdoptionHistoryDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import { overlay } from "overlay-kit";
import AdoptionReceiptModal from "./AdoptionReceiptModal";
import BadgeList from "../../components/BadgeList";
import PetThumbnail from "@/components/common/PetThumbnail";
import { ADOPTION_METHOD_KOREAN_INFO, GROWTH_KOREAN_INFO } from "../../constants";
import { DateTime } from "luxon";
import DeletedPetName from "../../components/DeletedPetName";
import LinkButton from "../../components/LinkButton";
import type { PetSnapshotParentDto } from "@repo/api-client";

interface AdoptionCardListProps {
  data: AdoptionHistoryDto[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction?: (node?: Element | null) => void;
  isEmpty?: boolean;
}

function ParentLabel({ parent }: { parent: PetSnapshotParentDto }) {
  const truncatedName =
    parent.name && parent.name.length > 6 ? `${parent.name.slice(0, 6)}...` : (parent.name ?? "");

  return (
    <span onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <LinkButton href={`/pet/${parent.petId}`} label={truncatedName} />
    </span>
  );
}

function AdoptionCard({ adoption }: { adoption: AdoptionHistoryDto }) {
  const { pet } = adoption;
  const dotColor =
    pet.sex === "M"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : pet.sex === "F"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";
  const adoptionDate = adoption.adoptionDate
    ? DateTime.fromISO(adoption.adoptionDate).toFormat("yyyy.MM.dd")
    : null;

  return (
    <div
      className="flex cursor-pointer flex-col gap-1 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-purple-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-purple-900/20"
      onClick={() => {
        overlay.open(({ isOpen, close }) => (
          <AdoptionReceiptModal isOpen={isOpen} onClose={close} adoption={adoption} />
        ));
      }}
    >
      {/* 거래 방식 + 분양 날짜 + 입양자 + 가격 */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {adoption.method && (
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            {ADOPTION_METHOD_KOREAN_INFO[adoption.method]}
          </span>
        )}
        {adoptionDate && (
          <span className="text-[13px] text-gray-700 dark:text-gray-300">
            <span className="rounded bg-gray-100 px-1 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
              분양
            </span>{" "}
            <span className="font-semibold">{adoptionDate}</span>
          </span>
        )}
        {adoption.buyer?.name && (
          <span className="text-[13px] text-gray-700 dark:text-gray-300">
            <span className="rounded bg-gray-100 px-1 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
              양수
            </span>{" "}
            <span className="font-semibold">
              {adoption.buyer.name.length > 6
                ? `${adoption.buyer.name.slice(0, 6)}...`
                : adoption.buyer.name}
            </span>
          </span>
        )}
        {adoption.price != null && (
          <span className="ml-auto text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
            {adoption.price.toLocaleString()}원
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {/* 썸네일 */}
        <div className="relative flex h-20 w-20 shrink-0 flex-col items-center gap-0.5 self-center">
          <PetThumbnail
            petId={pet.petId}
            maxSize={160}
            className="h-full w-full rounded-xl"
            objectFit="cover"
          />
        </div>

        {/* 펫 정보 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 이름 */}
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
            {pet.isDeleted ? (
              <DeletedPetName name={pet.name} maxLength={10} />
            ) : (
              <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {pet.name ?? "이름 없음"}
              </h3>
            )}
          </div>

          {/* 성장단계 + 해칭일 */}
          <div className="flex items-center gap-3 text-xs">
            {pet.growth && (
              <div className="flex items-center gap-0.5">
                <span className="text-gray-400">성장</span>
                <span className="dark:text-gray-300">{GROWTH_KOREAN_INFO[pet.growth]}</span>
              </div>
            )}
            {pet.hatchingDate && (
              <div className="flex items-center gap-0.5">
                <span className="text-gray-400">해칭</span>
                <span className="dark:text-gray-300">
                  {(() => {
                    const dt = DateTime.fromISO(pet.hatchingDate);
                    return dt.isValid ? dt.toFormat("yy.MM.dd") : "-";
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* 부모 정보 */}
          <div className="flex items-center gap-1 truncate text-xs">
            <span className="shrink-0 text-gray-400">부모</span>
            {pet.father ? (
              <ParentLabel parent={pet.father} />
            ) : (
              <span className="text-gray-400">미등록</span>
            )}
            <span className="text-gray-400">×</span>
            {pet.mother ? (
              <ParentLabel parent={pet.mother} />
            ) : (
              <span className="text-gray-400">미등록</span>
            )}
          </div>

          {/* 모프 & 형질 */}
          <div className="flex flex-wrap gap-1">
            <BadgeList variant="outline" items={pet.morphs} maxDisplay={4} badgeSize="sm" inline />
            <BadgeList
              items={pet.traits}
              maxDisplay={4}
              variant="secondary"
              badgeSize="sm"
              inline
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdoptionCardList({
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  isEmpty,
}: AdoptionCardListProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <p className="text-sm text-gray-400 dark:text-gray-500">분양 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2 pb-20">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-2">
        {data.map((adoption) => (
          <AdoptionCard key={adoption.id} adoption={adoption} />
        ))}
      </div>

      {hasMore ? (
        <div ref={loaderRefAction} className="flex justify-center py-4">
          {isFetchingMore && <Loading />}
        </div>
      ) : (
        data.length > 0 && (
          <span className="m-10 block text-center text-sm text-gray-400">
            데이터를 모두 불러왔습니다.
          </span>
        )
      )}
    </div>
  );
}
