// SSR 환경에서 axios baseURL 이 비면 Next.js 자체(localhost:3000) 로 요청이 가서
// 경매 페이지가 항상 notFound() 처리됨. setupApiClient 모듈을 import 해
// module-level setAxiosInstanceBaseURL() 가 SSR/CSR 양쪽에서 실행되도록 보장.
import "@/lib/setupApiClient";

import {
  auctionControllerCreateAuction,
  auctionControllerGetByShareToken,
  auctionControllerCancel,
  auctionControllerBids,
  type AuctionStateDto,
  type CreateAuctionDto,
  type CreateAuctionResultDto,
  type BidHistoryResponseDto,
} from "@repo/api-client";

export async function fetchAuctionByShareToken(
  shareToken: string,
): Promise<AuctionStateDto | null> {
  try {
    const res = await auctionControllerGetByShareToken(shareToken);
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function createAuction(
  input: CreateAuctionDto,
): Promise<CreateAuctionResultDto> {
  const res = await auctionControllerCreateAuction(input);
  return res.data.data;
}

export async function cancelAuction(shareToken: string): Promise<void> {
  await auctionControllerCancel(shareToken);
}

export async function fetchBidHistory(
  auctionId: string,
  cursor?: string,
  limit = 50,
): Promise<BidHistoryResponseDto> {
  const res = await auctionControllerBids(auctionId, { cursor, limit });
  return res.data;
}
