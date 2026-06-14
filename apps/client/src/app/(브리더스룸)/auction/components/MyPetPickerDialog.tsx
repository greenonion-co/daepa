"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  myAuctionControllerMyAuctions,
  MyAuctionItemDtoStatus,
  petControllerFindAll,
  type PetControllerFindAllGrowthItem,
  type PetControllerFindAllSexItem,
  type PetDto,
  type PetDtoSpecies,
} from "@repo/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/common/Loading";
import { toast } from "@/lib/toast";
import {
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
} from "@/app/(브리더스룸)/constants";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import MultiSelect from "@/app/(브리더스룸)/components/selector/MultiSelect";
import PetCard from "@/app/(브리더스룸)/pet/components/PetCard";

const ITEM_PER_PAGE = 20;

interface MyPetPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (petId: string) => void;
}

export default function MyPetPickerDialog({ isOpen, onClose, onSelect }: MyPetPickerDialogProps) {
  const [keyword, setKeyword] = useState("");
  const [species, setSpecies] = useState<PetDtoSpecies | undefined>(undefined);
  const [morphs, setMorphs] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [growth, setGrowth] = useState<PetControllerFindAllGrowthItem[]>([]);
  const [sex, setSex] = useState<PetControllerFindAllSexItem[]>([]);
  const [page, setPage] = useState(1);

  const { data: petsResponse, isLoading } = useQuery({
    queryKey: [
      petControllerFindAll.name,
      "MY_PET_PICKER",
      { keyword: keyword.trim(), species, morphs, traits, growth, sex, page },
    ],
    queryFn: () =>
      petControllerFindAll({
        filterType: "MY",
        page,
        itemPerPage: ITEM_PER_PAGE,
        ...(keyword.trim() && { keyword: keyword.trim() }),
        ...(species && { species }),
        ...(morphs.length > 0 && { morphs }),
        ...(traits.length > 0 && { traits }),
        ...(growth.length > 0 && { growth }),
        ...(sex.length > 0 && { sex }),
      }),
    enabled: isOpen,
  });

  // 진행 중/예정 경매가 있는 펫 ID — 페이지에서 이미 캐시된 쿼리를 재사용해 추가 요청 없음.
  const { data: auctionsResponse } = useQuery({
    queryKey: [myAuctionControllerMyAuctions.name],
    queryFn: () => myAuctionControllerMyAuctions(),
    enabled: isOpen,
  });

  const activeAuctionPetIds = useMemo(() => {
    const items = auctionsResponse?.data?.data ?? [];
    const set = new Set<string>();
    for (const a of items) {
      if (
        a.status === MyAuctionItemDtoStatus.PENDING ||
        a.status === MyAuctionItemDtoStatus.ACTIVE
      ) {
        set.add(a.petId);
      }
    }
    return set;
  }, [auctionsResponse]);

  const pets: PetDto[] = petsResponse?.data?.data ?? [];
  const totalCount = petsResponse?.data?.meta?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEM_PER_PAGE));

  const handleCardClick = (pet: PetDto) => {
    if (pet.isPublic === false) {
      toast.info("비공개 개체는 경매를 시작할 수 없습니다. 공개로 전환 후 다시 시도해 주세요.");
      return;
    }
    if (activeAuctionPetIds.has(pet.petId)) {
      toast.info("이미 진행 중인 경매가 있는 개체입니다.");
      return;
    }
    onSelect(pet.petId);
    onClose();
  };

  const handleSpeciesChange = (item: PetDtoSpecies | null | undefined) => {
    setSpecies(item ?? undefined);
    setMorphs([]);
    setTraits([]);
    setPage(1);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* 우측 상단 닫기 버튼이 있으므로 백그라운드 오터치 닫힘 방지 (경매 생성 흐름 공통) */}
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        preventOutsideClose
      >
        <DialogHeader className="border-b px-6 pt-6 pb-3">
          <DialogTitle>경매할 개체 선택</DialogTitle>
        </DialogHeader>

        {/* 필터 */}
        <div className="flex flex-col gap-2 border-b px-4 py-3">
          <Input
            placeholder="이름으로 검색"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="h-9"
          />
          <div className="flex flex-wrap items-center gap-2">
            <SingleSelect
              showSelectAll
              showTitle
              type="species"
              initialItem={species}
              onSelect={handleSpeciesChange}
            />
            {species && (
              <>
                <MultiSelect
                  title="모프"
                  displayMap={MORPH_LIST_BY_SPECIES[species]}
                  selected={morphs}
                  onChange={(v) => {
                    setMorphs(v);
                    setPage(1);
                  }}
                />
                <MultiSelect
                  title="형질"
                  displayMap={TRAIT_LIST_BY_SPECIES[species]}
                  selected={traits}
                  onChange={(v) => {
                    setTraits(v);
                    setPage(1);
                  }}
                />
              </>
            )}
            <MultiSelect
              title="크기"
              displayMap={GROWTH_KOREAN_INFO as Record<string, string>}
              selected={growth}
              onChange={(v) => {
                setGrowth(v as PetControllerFindAllGrowthItem[]);
                setPage(1);
              }}
            />
            <MultiSelect
              title="성별"
              displayMap={GENDER_KOREAN_INFO}
              selected={sex}
              onChange={(v) => {
                setSex(v as PetControllerFindAllSexItem[]);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* 결과 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : pets.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              조건에 맞는 개체가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-2">
              {pets.map((pet) => {
                const isPrivate = pet.isPublic === false;
                const inAuction = activeAuctionPetIds.has(pet.petId);
                const disabled = isPrivate || inAuction;
                return (
                  <div key={pet.petId} className="relative">
                    <PetCard pet={pet} onCardClick={handleCardClick} />
                    {disabled && (
                      <>
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/65 dark:bg-black/55" />
                        <span className="pointer-events-none absolute top-2 right-2 rounded-md bg-gray-800/90 px-2 py-0.5 text-[11px] font-medium text-white">
                          {inAuction ? "경매중" : "비공개"}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
