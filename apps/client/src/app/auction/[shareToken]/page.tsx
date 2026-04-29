import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AuctionLiveView from "./AuctionLiveView";
import EndedAuctionNotice from "./EndedAuctionNotice";
import { fetchAuctionByShareToken } from "../api";

interface Props {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareToken } = await params;
  const state = await fetchAuctionByShareToken(shareToken);
  if (!state) {
    return { title: "경매를 찾을 수 없습니다" };
  }
  return {
    title: "Breedy 경매",
    description: `시작가 ${state.startingPrice.toLocaleString("ko-KR")}원부터 시작되는 실시간 경매`,
  };
}

export default async function AuctionPage({ params }: Props) {
  const { shareToken } = await params;
  const state = await fetchAuctionByShareToken(shareToken);
  if (!state) notFound();

  if (state.status === "ENDED" || state.status === "CANCELED") {
    return <EndedAuctionNotice />;
  }

  return <AuctionLiveView initialState={state} />;
}
