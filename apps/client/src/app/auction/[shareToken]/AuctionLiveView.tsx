"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  petControllerFindPetByPetId,
  type PetDto,
} from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import PetCard from "@/app/(브리더스룸)/pet/components/PetCard";
import PetDetailModal from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import { useAuctionSocket } from "../useAuctionSocket";
import type {
  AuctionStateWire,
  AuctionStatus,
  BidAcceptedEvent,
} from "../types";

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
  const main =
    h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
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

  const serverOffsetRef = useRef<number>(
    initialState.serverNowMs - Date.now(),
  );

  const getServerNow = useCallback(
    () => Date.now() + serverOffsetRef.current,
    [],
  );

  const minBid = useMemo(() => {
    if (state.highestBid > 0) {
      return state.highestBid + state.minIncrement;
    }
    return state.startingPrice;
  }, [state]);

  const [bidInput, setBidInput] = useState<string>("");
  useEffect(() => {
    setBidInput(String(minBid));
  }, [minBid]);

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
        setTimeout(() => setExtending(false), 2000);
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
      toast.message(
        e.winner ? `낙찰가 ${KRW(e.winner.price)}` : "입찰 없이 종료",
      );
    },
    onStarted: () => {
      setState((prev) => ({ ...prev, status: "ACTIVE" }));
      toast.message("경매가 시작되었습니다");
    },
    onServerTime: (s) => {
      serverOffsetRef.current = s - Date.now();
    },
  });

  const remaining = state.currentEndTimeMs - getServerNow();
  const remainingParts = formatRemainingParts(remaining);
  const isActive = state.status === "ACTIVE";
  const isEnded = state.status === "ENDED" || state.status === "CANCELED";
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
  }, [isLoggedIn, bidInput, minBid, placeBid, router]);

  const quickAdd = (k: number) => {
    setBidInput(String(minBid + state.minIncrement * k));
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
          <CardContent className="p-3 text-sm text-muted-foreground">
            비공개 개체이거나 조회 권한이 없습니다.
          </CardContent>
        </Card>
      )}

      {pet && (
        <PetDetailModal
          isOpen={petModalOpen}
          pet={pet}
          onClose={() => setPetModalOpen(false)}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">경매</CardTitle>
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "실시간 연결됨" : "연결 중..."}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusLine status={state.status} />

          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">현재 최고가</span>
            <span className="text-3xl font-bold tabular-nums">
              {state.highestBid > 0
                ? KRW(state.highestBid)
                : `${KRW(state.startingPrice)} (시작가)`}
            </span>
            {state.highestBidder?.nickname && (
              <span className="text-xs text-muted-foreground">
                최근 입찰: {state.highestBidder.nickname}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">남은 시간</span>
            <span
              className={`text-2xl font-mono tabular-nums ${
                remaining < 60_000 ? "text-red-500" : ""
              }`}
            >
              {isActive ? (
                <>
                  {remainingParts.main}
                  <span className="text-base opacity-60">
                    .{remainingParts.ms}
                  </span>
                </>
              ) : (
                "—"
              )}
              {extending && (
                <span className="ml-2 animate-pulse text-amber-500 text-base">
                  ⏱ 연장됨!
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              종료: {new Date(state.currentEndTimeMs).toLocaleString("ko-KR")}
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
                onChange={(e) => setBidInput(e.target.value)}
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
            <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              본인이 등록한 펫의 경매에는 입찰할 수 없습니다.
            </div>
          )}

          {isEnded && (
            <div className="rounded-md border bg-muted p-3 text-sm">
              {state.winnerUserId && state.finalPrice ? (
                <span>
                  ✨ 낙찰가 <strong>{KRW(state.finalPrice)}</strong>
                </span>
              ) : (
                <span>입찰 없이 종료되었습니다.</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 입찰</CardTitle>
        </CardHeader>
        <CardContent>
          {state.recentBids.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 입찰이 없습니다.</p>
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
                  <span className="tabular-nums font-medium">
                    {KRW(b.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusLine({ status }: { status: AuctionStatus }) {
  const map: Record<AuctionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
    {
      PENDING: { label: "시작 전", variant: "secondary" },
      ACTIVE: { label: "진행 중", variant: "default" },
      ENDED: { label: "종료", variant: "outline" },
      CANCELED: { label: "취소됨", variant: "destructive" },
    };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}
