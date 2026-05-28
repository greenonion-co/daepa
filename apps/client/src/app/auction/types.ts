import {
  type AuctionStateDto,
  type AuctionBidDto,
  AuctionStateDtoStatus,
} from "@repo/api-client";

export type AuctionStatus = AuctionStateDtoStatus;
export const AUCTION_STATUS = AuctionStateDtoStatus;

// 자동 생성된 DTO 를 그대로 사용 — alias 만 제공
export type AuctionStateWire = AuctionStateDto;
export type AuctionBidWire = AuctionBidDto;

// WS 이벤트 페이로드는 서버에서만 보내고 OpenAPI 스키마에 없으므로 직접 정의
export interface BidAcceptedEvent {
  auctionId: string;
  shareToken: string;
  bidderId: string;
  nickname: string;
  amount: number;
  newEndTimeMs: number;
  extended: boolean;
  tsMs: number;
}

export interface AuctionEndedEvent {
  auctionId: string;
  shareToken: string;
  winner: { userId: string; price: number } | null;
}

export interface AuctionCanceledEvent {
  auctionId: string;
  shareToken: string;
}

export interface AuctionStartedEvent {
  auctionId: string;
  shareToken: string;
}

export interface BidRejectedEvent {
  code: string;
  requiredMin?: number;
}
