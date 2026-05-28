"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { auctionControllerBids, petControllerFindPetByPetId, type PetDto } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import PetCard from "@/app/(브리더스룸)/pet/components/PetCard";
import PetDetailModal from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import CancelAuctionButton from "./CancelAuctionButton";
import { useAuctionSocket } from "../useAuctionSocket";
import type { AuctionStateWire, AuctionStatus, BidAcceptedEvent } from "../types";

interface Props {
  initialState: AuctionStateWire;
}

const KRW = (n: number) => `${Number(n || 0).toLocaleString("ko-KR")}원`;

function formatRemainingParts(ms: number): { main: string; ms: string } {
  if (ms <= 0) return { main: "00:00", ms: "000" };
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const msPart = total % 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const main = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return { main, ms: pad(msPart, 3) };
}

const REJECT_MESSAGES: Record<string, string> = {
  NOT_FOUND: "경매를 찾을 수 없습니다.",
  NOT_ACTIVE: "현재 입찰할 수 없는 경매입니다.",
  NOT_STARTED: "아직 경매가 시작되지 않았습니다.",
  ALREADY_ENDED: "이미 종료된 경매입니다.",
  BID_TOO_LOW: "현재 최소 입찰가보다 낮습니다.",
  RATE_LIMITED: "너무 빠르게 입찰하고 있습니다.",
  UNAUTHENTICATED: "로그인이 필요합니다.",
  OWN_PET: "본인이 등록한 펫에는 입찰할 수 없습니다.",
  BAD_AMOUNT: "입찰 금액이 올바르지 않습니다.",
  BAD_INPUT: "입력값이 올바르지 않습니다.",
  INTERNAL: "일시적인 오류가 발생했습니다.",
};

export default function AuctionLiveView({ initialState }: Props) {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [state, setState] = useState<AuctionStateWire>(initialState);

  // 펫 정보는 client side fetch — axios 인터셉터가 토큰을 첨부해서
  // 본인이 비공개 펫의 호스트인 경우에도 정상 조회됨.
  // SSR 에서는 토큰이 없어 비공개 펫이 NotFound 처리되므로 client 로 옮김.
  const { data: petResponse, isLoading: petLoading } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, state.petId],
    queryFn: () => petControllerFindPetByPetId(state.petId),
    enabled: !!state.petId,
    staleTime: 5 * 60 * 1000,
  });
  // PetSingleDto 와 PetDto 는 구조적으로 동일 — PetCard / PetDetailModal 시그니처에 맞춰 cast
  const pet = (petResponse?.data?.data as unknown as PetDto) ?? null;

  const [petModalOpen, setPetModalOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [now, setNow] = useState(Date.now());

  const serverOffsetRef = useRef<number>(initialState.serverNowMs - Date.now());

  const getServerNow = useCallback(() => Date.now() + serverOffsetRef.current, []);

  const minBid = useMemo(() => {
    if (state.highestBid > 0) {
      return state.highestBid + state.minIncrement;
    }
    return state.startingPrice;
  }, [state]);

  const [bidInput, setBidInput] = useState<string>("");
  // 사용자가 직접 input 을 건드린 적이 있으면 minBid 변경으로 덮어쓰지 않는다.
  // (인기 경매에서 타이핑 중 다른 입찰이 들어와 입력이 사라지는 문제 방지)
  const bidInputDirtyRef = useRef(false);
  useEffect(() => {
    if (bidInputDirtyRef.current) return;
    setBidInput(String(minBid));
  }, [minBid]);

  // 연장 애니메이션용 setTimeout 의 cleanup — unmount 후 setState 경고 방지
  const extendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (extendingTimerRef.current) clearTimeout(extendingTimerRef.current);
    };
  }, []);

  // 카운트다운: 100ms 틱
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { connected, placeBid } = useAuctionSocket({
    shareToken: state.shareToken,
    onState: (s) => {
      setState(s);
      serverOffsetRef.current = s.serverNowMs - Date.now();
    },
    onBidAccepted: (event: BidAcceptedEvent) => {
      setState((prev) => ({
        ...prev,
        highestBid: event.amount,
        highestBidder: { userId: event.bidderId, nickname: event.nickname },
        currentEndTimeMs: event.newEndTimeMs,
        recentBids: [
          {
            bidderUserId: event.bidderId,
            bidderNickname: event.nickname || null,
            amount: event.amount,
            serverTsMs: event.tsMs,
            triggeredExtension: event.extended,
          },
          ...prev.recentBids.slice(0, 49),
        ],
      }));
      if (event.extended) {
        setExtending(true);
        if (extendingTimerRef.current) clearTimeout(extendingTimerRef.current);
        extendingTimerRef.current = setTimeout(() => {
          setExtending(false);
          extendingTimerRef.current = null;
        }, 2000);
      }
    },
    onBidRejected: (e) => {
      const msg = REJECT_MESSAGES[e.code] ?? `입찰 실패: ${e.code}`;
      if (e.code === "BID_TOO_LOW" && e.requiredMin) {
        toast.error(`${msg} (최소 ${KRW(e.requiredMin)})`);
      } else if (e.code === "UNAUTHENTICATED") {
        toast.error(msg);
        router.push("/sign-in");
      } else {
        toast.error(msg);
      }
    },
    onEnded: (e) => {
      setState((prev) => ({
        ...prev,
        status: "ENDED",
        finalPrice: e.winner?.price ?? null,
        winnerUserId: e.winner?.userId ?? null,
      }));
      toast.message(e.winner ? `낙찰가 ${KRW(e.winner.price)}` : "입찰 없이 종료");
    },
    onCanceled: () => {
      setState((prev) => ({ ...prev, status: "CANCELED" }));
      toast.message("경매가 취소되었습니다");
    },
    onStarted: () => {
      setState((prev) => ({ ...prev, status: "ACTIVE" }));
      toast.message("경매가 시작되었습니다");
    },
    onServerTime: (s) => {
      serverOffsetRef.current = s - Date.now();
    },
  });

  const isActive = state.status === "ACTIVE";
  const isPending = state.status === "PENDING";
  const isEnded = state.status === "ENDED" || state.status === "CANCELED";
  // PENDING 일 때는 시작까지 남은 시간, ACTIVE 일 때는 종료까지 남은 시간을 보여준다.
  const remaining = isPending
    ? state.startTimeMs - getServerNow()
    : state.currentEndTimeMs - getServerNow();
  const remainingParts = formatRemainingParts(remaining);
  const isOwnPet = isLoggedIn && user?.userId === state.hostUserId;

  const handleBid = useCallback(() => {
    if (!isLoggedIn) {
      router.push("/sign-in");
      return;
    }
    const amount = Number(bidInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("입찰 금액을 입력하세요.");
      return;
    }
    if (amount < minBid) {
      toast.error(`최소 ${KRW(minBid)} 이상 입찰 가능합니다.`);
      return;
    }
    placeBid(amount);
    // 제출 후엔 다음 새 minBid 가 자동으로 채워지도록 dirty 해제
    bidInputDirtyRef.current = false;
  }, [isLoggedIn, bidInput, minBid, placeBid, router]);

  const quickAdd = (k: number) => {
    setBidInput(String(minBid + state.minIncrement * k));
    bidInputDirtyRef.current = true;
  };

  // 실시간 now 의존성 → useMemo도 재계산
  void now;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      {petLoading ? (
        <Card>
          <CardContent className="flex gap-2 p-2">
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2 py-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ) : pet ? (
        <PetCard pet={pet} onCardClick={() => setPetModalOpen(true)} />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground p-3 text-sm">
            비공개 개체이거나 조회 권한이 없습니다.
          </CardContent>
        </Card>
      )}

      {pet && (
        <PetDetailModal isOpen={petModalOpen} pet={pet} onClose={() => setPetModalOpen(false)} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <StatusLine status={state.status} />
          {isActive && (
            <Badge variant={connected ? "default" : "destructive"}>
              {connected ? "실시간 연결됨" : "연결 중..."}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">
              {isEnded ? "낙찰가" : "현재 최고가"}
            </span>
            <span className="text-3xl font-bold tabular-nums">
              {isEnded
                ? state.finalPrice && state.finalPrice > 0
                  ? KRW(state.finalPrice)
                  : "입찰 없이 종료"
                : state.highestBid > 0
                  ? KRW(state.highestBid)
                  : `${KRW(state.startingPrice)} (시작가)`}
            </span>
            {state.highestBidder?.nickname && (
              <span className="text-muted-foreground text-xs">
                {isEnded ? "낙찰자" : "최근 입찰"}: {state.highestBidder.nickname}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">
              {isPending ? "경매 시작까지" : "남은 시간"}
            </span>
            <span
              className={`font-mono text-2xl tabular-nums ${
                remaining < 60_000 && !isEnded ? "text-red-500" : ""
              }`}
            >
              {isActive ? (
                <>
                  {remainingParts.main}
                  <span className="text-base opacity-60">.{remainingParts.ms}</span>
                </>
              ) : isPending ? (
                // 경매 시작 전에는 ms 단위 카운팅 부담 없이 초 단위까지만 노출.
                remainingParts.main
              ) : (
                "—"
              )}
              {extending && (
                <span className="ml-2 animate-pulse text-base text-amber-500">⏱ 연장됨!</span>
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {isPending
                ? `시작: ${new Date(state.startTimeMs).toLocaleString("ko-KR")}`
                : `종료: ${new Date(state.currentEndTimeMs).toLocaleString("ko-KR")}`}
            </span>
          </div>

          {isActive && !isOwnPet && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <span className="text-sm">
                최소 입찰가: <strong>{KRW(minBid)}</strong>
              </span>
              <Input
                type="number"
                value={bidInput}
                onChange={(e) => {
                  setBidInput(e.target.value);
                  bidInputDirtyRef.current = true;
                }}
                min={minBid}
                step={state.minIncrement}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => quickAdd(0)}>
                  +0
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickAdd(1)}>
                  +1단위
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickAdd(5)}>
                  +5단위
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickAdd(10)}>
                  +10단위
                </Button>
              </div>
              <Button onClick={handleBid} disabled={!connected}>
                {isLoggedIn ? "입찰하기" : "로그인 후 입찰"}
              </Button>
            </div>
          )}

          {isOwnPet && isActive && (
            <div className="bg-muted text-muted-foreground rounded-md border p-3 text-sm">
              본인이 등록한 펫의 경매에는 입찰할 수 없습니다.
            </div>
          )}

          {/* 호스트 전용 — 시작 전/진행 중일 때만 취소 가능. 진행 중 취소는 강력한 확인 절차. */}
          {isOwnPet && (isPending || isActive) && (
            <div className="flex justify-end">
              <CancelAuctionButton
                shareToken={state.shareToken}
                status={state.status}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 입찰</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {state.recentBids.length === 0 ? (
            <p className="text-muted-foreground text-sm">아직 입찰이 없습니다.</p>
          ) : (
            <ul className="divide-y text-sm">
              {state.recentBids.slice(0, 20).map((b, i) => (
                <li
                  key={`${b.serverTsMs}-${b.bidderUserId}-${i}`}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    {b.bidderNickname ?? "익명"}{" "}
                    {b.triggeredExtension && (
                      <span className="ml-1 text-xs text-amber-600">⏱연장</span>
                    )}
                  </span>
                  <span className="font-medium tabular-nums">{KRW(b.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          {isOwnPet && (
            <FullBidHistory
              auctionId={state.auctionId}
              recentVisibleCount={state.recentBids.length}
              lastVisibleTsMs={state.recentBids[state.recentBids.length - 1]?.serverTsMs}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FullBidHistory({
  auctionId,
  recentVisibleCount,
  lastVisibleTsMs,
}: {
  auctionId: string;
  /** 위 "최근 입찰" 영역에 노출되어 있는 항목 수 (0 이면 그 영역이 비어있어 전체 처음부터 fetch) */
  recentVisibleCount: number;
  /** 위 영역의 마지막(가장 오래된) 항목의 serverTsMs — 펼침 cursor 기준 */
  lastVisibleTsMs?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  // 펼치는 시점의 cursor 를 캡쳐 — 이후 실시간 입찰이 들어와도 query 가 다시 발생하지 않음.
  const [frozenCursor, setFrozenCursor] = useState<string | undefined>(undefined);
  const { ref: loadMoreRef, inView } = useInView();

  const handleToggle = () => {
    if (!expanded) {
      // 보여진 항목이 있으면 그 다음(더 오래된) 부터 fetch.
      // 없으면 처음부터 fetch (cursor=undefined).
      setFrozenCursor(
        recentVisibleCount > 0 && lastVisibleTsMs !== undefined
          ? String(lastVisibleTsMs)
          : undefined,
      );
    }
    setExpanded((p) => !p);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["auction-bids", auctionId, frozenCursor ?? "head"],
    queryFn: ({ pageParam }) =>
      auctionControllerBids(auctionId, {
        cursor: pageParam ?? frozenCursor,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    enabled: expanded,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (expanded && inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [expanded, inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const bids = useMemo(() => data?.pages.flatMap((p) => p.data.data) ?? [], [data]);

  return (
    <>
      {/* 슬라이딩 영역 — 펼침 시 최근 입찰 list 끝에 자연스럽게 이어진다.
          max-h transition 으로 부드럽게 펼쳐지며, divide-y 가 위 ul 과 시각적으로 단일 list 처럼 보임. */}
      <div
        aria-hidden={!expanded}
        className={cn(
          "overflow-hidden transition-[max-height] duration-300 ease-out",
          expanded ? "max-h-[20000px]" : "max-h-0",
        )}
      >
        {isLoading ? (
          <p className="text-muted-foreground py-3 text-center text-sm">불러오는 중...</p>
        ) : bids.length === 0 ? (
          <p className="text-muted-foreground py-3 text-center text-sm">
            이전 입찰 내역이 없습니다.
          </p>
        ) : (
          <ul className="divide-y border-t text-sm">
            {bids.map((b, i) => (
              <li
                key={`${b.serverTsMs}-${b.bidderUserId}-${i}`}
                className="flex items-center justify-between py-2"
              >
                <span>
                  {b.bidderNickname ?? "익명"}{" "}
                  {b.triggeredExtension && (
                    <span className="ml-1 text-xs text-amber-600">⏱연장</span>
                  )}
                </span>
                <span className="font-medium tabular-nums">{KRW(b.amount)}</span>
              </li>
            ))}
            {hasNextPage && (
              <li ref={loadMoreRef} className="text-muted-foreground p-2 text-center text-xs">
                {isFetchingNextPage ? "더 불러오는 중..." : ""}
              </li>
            )}
          </ul>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-full justify-center text-sm"
        onClick={handleToggle}
      >
        {expanded ? (
          <>
            <ChevronUp className="mr-1 h-4 w-4" /> 이전 입찰 내역 접기
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-4 w-4" /> 이전 입찰 내역 보기
          </>
        )}
      </Button>
    </>
  );
}

function StatusLine({ status }: { status: AuctionStatus }) {
  const map: Record<AuctionStatus, { label: string; className: string; live?: boolean }> = {
    PENDING: {
      label: "경매 시작 전",
      className:
        "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/60",
    },
    ACTIVE: {
      label: "경매 진행 중",
      className:
        "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/60",
      live: true,
    },
    ENDED: {
      label: "종료된 경매",
      className:
        "bg-gray-100 text-gray-600 ring-1 ring-gray-300 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
    },
    CANCELED: {
      label: "취소된 경매",
      className:
        "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/60",
    },
  };
  const meta = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.className}`}
    >
      {meta.live && (
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {meta.label}
    </span>
  );
}
