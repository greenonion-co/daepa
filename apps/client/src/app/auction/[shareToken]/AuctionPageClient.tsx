"use client";

import { useUserStore } from "@/app/(브리더스룸)/store/user";
import type { AuctionStateWire } from "../types";
import AuctionLiveView from "./AuctionLiveView";
import EndedAuctionNotice from "./EndedAuctionNotice";

interface Props {
  initialState: AuctionStateWire;
}

/**
 * 경매 페이지 라우터 — SSR 에서는 user 정보를 알 수 없어
 * 호스트 본인이 자기 종료된 경매를 못 보는 문제를 해결하기 위해
 * client 단에서 user 정보 + 상태를 보고 분기한다.
 *
 * - 종료/취소 상태이고 user 정보가 아직 로드 전 → EndedAuctionNotice (안전 default)
 * - 종료/취소 상태 + 호스트 본인 → AuctionLiveView (낙찰 결과/입찰 히스토리 확인)
 * - 종료/취소 상태 + 비호스트 → EndedAuctionNotice (10초 후 홈으로 redirect)
 * - 진행 중/예정 → AuctionLiveView
 */
export default function AuctionPageClient({ initialState }: Props) {
  const user = useUserStore((s) => s.user);
  const isInitialized = useUserStore((s) => s.isInitialized);

  const isEnded =
    initialState.status === "ENDED" || initialState.status === "CANCELED";
  const isHost = !!user && user.userId === initialState.hostUserId;

  if (isEnded && (!isInitialized || !isHost)) {
    return <EndedAuctionNotice />;
  }

  return <AuctionLiveView initialState={initialState} />;
}
