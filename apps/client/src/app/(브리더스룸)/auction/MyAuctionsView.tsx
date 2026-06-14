"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Plus } from "lucide-react";
import {
  myAuctionControllerMyAuctions,
  petControllerFindPetByPetId,
  type CreatePetDto,
  type MyAuctionItemDto,
  MyAuctionItemDtoStatus,
  type PetDto,
} from "@repo/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PetCard from "@/app/(브리더스룸)/pet/components/PetCard";
import LoadingScreen from "@/app/loading";

// 큰 모달들은 트리거 클릭 시점에만 chunk 로드
const CreateAuctionChooserDialog = dynamic(
  () => import("./components/CreateAuctionChooserDialog"),
  { ssr: false },
);
const MyPetPickerDialog = dynamic(() => import("./components/MyPetPickerDialog"), { ssr: false });
const CreateAuctionDialog = dynamic(() => import("@/app/auction/components/CreateAuctionDialog"), {
  ssr: false,
});
// 직접 dynamic import 시 Turbopack 이 한글 route group 포함 chunk 이름을
// 바이트 경계 무시한 채 자르다 panic — 짧은 경로의 재수출 shim 으로 우회.
const QuickRegisterModal = dynamic(() => import("./components/QuickRegisterModalLazy"), {
  ssr: false,
});

const KRW = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString("ko-KR")}원` : null;

// AuctionLiveView 의 StatusLine 과 색상 톤을 통일 — 서비스 전반에서 경매 상태 색이 일관되게 보이도록.
const STATUS_META: Record<MyAuctionItemDtoStatus, { label: string; className: string }> = {
  PENDING: {
    label: "시작 전",
    className:
      "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-300",
  },
  ACTIVE: {
    label: "진행 중",
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  ENDED: {
    label: "종료",
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  CANCELED: {
    label: "취소됨",
    className:
      "border-red-300 bg-red-100 text-red-700 dark:border-red-700/60 dark:bg-red-900/40 dark:text-red-300",
  },
};

function formatDateRange(startMs: number, endMs: number): string {
  const start = DateTime.fromMillis(startMs);
  const end = DateTime.fromMillis(endMs);
  const startFmt = start.toFormat("yyyy.M.d HH시 mm분");
  const endFmt = start.hasSame(end, "day")
    ? end.toFormat("HH시 mm분")
    : end.toFormat("yyyy.M.d HH시 mm분");
  return `${startFmt} ~ ${endFmt}`;
}

/** 경매 메타 영역 — 외부 카드의 클릭 동선에 위임 (자체 Link 없음) */
function AuctionMetaRow({ item }: { item: MyAuctionItemDto }) {
  const meta = STATUS_META[item.status];
  const showHighest =
    typeof item.highestBid === "number" &&
    item.highestBid > 0 &&
    item.status === MyAuctionItemDtoStatus.ACTIVE;
  const showFinal = typeof item.finalPrice === "number" && item.finalPrice > 0;

  return (
    <div className="px-3 py-2">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
        <span className="truncate text-xs font-medium">
          {formatDateRange(item.startTimeMs, item.currentEndTimeMs)}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">시작가</span>{" "}
        <span className="font-medium tabular-nums">{KRW(item.startingPrice)}</span>
        {showHighest && (
          <>
            <span className="text-muted-foreground mx-1">·</span>
            <span className="text-muted-foreground">현재가</span>{" "}
            <span className="font-medium tabular-nums">{KRW(item.highestBid)}</span>
          </>
        )}
        {showFinal && (
          <>
            <span className="text-muted-foreground mx-1">·</span>
            <span className="text-muted-foreground">낙찰가</span>{" "}
            <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              {KRW(item.finalPrice)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** 펫 정보 영역 — PetCard 재사용. 자체 클릭은 비활성(pointer-events-none) → 외부 카드 클릭으로 위임. */
function AuctionPetSection({ petId }: { petId: string }) {
  const { data: petResponse, isLoading } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    enabled: !!petId,
  });
  // PetSingleDto ↔ PetDto 는 구조적으로 동일 — PetCard 시그니처에 맞춰 cast
  const pet = (petResponse?.data?.data as unknown as PetDto) ?? null;

  if (isLoading) {
    return (
      <div className="flex gap-2 p-2">
        <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2 py-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <p className="text-muted-foreground px-3 py-3 text-sm">개체 정보를 불러올 수 없습니다.</p>
    );
  }

  // pointer-events-none 으로 PetCard 자체 hover/click 효과를 무력화 → 외부 카드의 단일 클릭 동선 유지.
  // (Link 로 감싸지 않는 이유: PetCard 내부에 부모 이름 LinkButton 등 nested anchor 가 존재해 시맨틱 위반 발생)
  return (
    <div className="pointer-events-none p-2 select-none">
      <PetCard pet={pet} onCardClick={() => undefined} />
    </div>
  );
}

function AuctionItemCard({ item }: { item: MyAuctionItemDto }) {
  const router = useRouter();
  const navigate = () => router.push(`/auction/${item.shareToken}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate();
        }
      }}
      className="focus-visible:ring-ring cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none dark:bg-neutral-900"
    >
      <AuctionMetaRow item={item} />
      <div className="border-t border-gray-100 dark:border-neutral-800">
        <AuctionPetSection petId={item.petId} />
      </div>
    </div>
  );
}

function AuctionList({ items }: { items: MyAuctionItemDto[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-muted-foreground text-sm">해당하는 경매가 없습니다.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.auctionId}>
          <AuctionItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export function MyAuctionsView() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [myAuctionControllerMyAuctions.name],
    queryFn: () => myAuctionControllerMyAuctions(),
  });

  const items = useMemo(() => data?.data?.data ?? [], [data]);

  // 경매 생성 후 목록 자동 갱신
  const invalidateMyAuctions = () =>
    queryClient.invalidateQueries({ queryKey: [myAuctionControllerMyAuctions.name] });

  const openCreateAuctionWithPetId = (petId: string, onBack?: () => void) => {
    overlay.open(({ isOpen: open, close, unmount }) => (
      <CreateAuctionDialog
        isOpen={open}
        onClose={() => {
          close();
          setTimeout(unmount, 200);
          invalidateMyAuctions();
        }}
        initialPetId={petId}
        lockPetId
        onBack={
          onBack &&
          (() => {
            close();
            setTimeout(unmount, 200);
            onBack();
          })
        }
      />
    ));
  };

  // "새 개체 추가 후 경매" 경로 — 펫 생성은 다이얼로그 제출 시점에 isPublic=true 로 수행.
  const openCreateAuctionWithPendingPet = (
    pendingPet: CreatePetDto,
    onBack?: () => void,
  ) => {
    overlay.open(({ isOpen: open, close, unmount }) => (
      <CreateAuctionDialog
        isOpen={open}
        onClose={() => {
          close();
          setTimeout(unmount, 200);
          invalidateMyAuctions();
        }}
        pendingPet={pendingPet}
        lockPetId
        onBack={
          onBack &&
          (() => {
            close();
            setTimeout(unmount, 200);
            onBack();
          })
        }
      />
    ));
  };

  const openMyPetPicker = () => {
    overlay.open(({ isOpen: open, close, unmount }) => (
      <MyPetPickerDialog
        isOpen={open}
        onClose={() => {
          close();
          setTimeout(unmount, 200);
        }}
        onSelect={(petId) => {
          openCreateAuctionWithPetId(petId, () => openMyPetPicker());
        }}
      />
    ));
  };

  const openQuickRegister = (initialDraft?: CreatePetDto) => {
    overlay.open(({ isOpen: open, close, unmount }) => (
      <QuickRegisterModal
        isOpen={open}
        onClose={() => {
          close();
          setTimeout(unmount, 200);
        }}
        initialDraft={initialDraft}
        preventOutsideClose
        onSubmitDraft={(dto) => {
          openCreateAuctionWithPendingPet(dto, () => openQuickRegister(dto));
        }}
      />
    ));
  };

  const openCreateAuctionFlow = () => {
    overlay.open(({ isOpen: open, close, unmount }) => (
      <CreateAuctionChooserDialog
        isOpen={open}
        onClose={() => {
          close();
          setTimeout(unmount, 200);
        }}
        onSelectExisting={() => {
          close();
          setTimeout(unmount, 200);
          openMyPetPicker();
        }}
        onCreateNew={() => {
          close();
          setTimeout(unmount, 200);
          openQuickRegister();
        }}
      />
    ));
  };

  const grouped = useMemo(() => {
    const active: MyAuctionItemDto[] = [];
    const ended: MyAuctionItemDto[] = [];
    const canceled: MyAuctionItemDto[] = [];
    for (const item of items) {
      if (
        item.status === MyAuctionItemDtoStatus.PENDING ||
        item.status === MyAuctionItemDtoStatus.ACTIVE
      ) {
        active.push(item);
      } else if (item.status === MyAuctionItemDtoStatus.ENDED) {
        ended.push(item);
      } else if (item.status === MyAuctionItemDtoStatus.CANCELED) {
        canceled.push(item);
      }
    }
    return { active, ended, canceled };
  }, [items]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="w-full">
      {/* '경매' 탭 안에서 렌더되므로 별도 제목 없이 생성 버튼만 우측 정렬 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={openCreateAuctionFlow}
          size="sm"
          className="breeder-badge-shine w-full rounded-lg bg-amber-600 text-white hover:bg-amber-700 sm:w-auto dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          경매 생성
        </Button>
      </div>
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            진행 중
            {grouped.active.length > 0 && (
              <span className="ml-1 text-xs">({grouped.active.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ended">
            종료
            {grouped.ended.length > 0 && (
              <span className="ml-1 text-xs">({grouped.ended.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="canceled">
            취소
            {grouped.canceled.length > 0 && (
              <span className="ml-1 text-xs">({grouped.canceled.length})</span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-3">
          <AuctionList items={grouped.active} />
        </TabsContent>
        <TabsContent value="ended" className="mt-3">
          <AuctionList items={grouped.ended} />
        </TabsContent>
        <TabsContent value="canceled" className="mt-3">
          <AuctionList items={grouped.canceled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
