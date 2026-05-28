export enum AUCTION_STATUS {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELED = 'CANCELED',
}

export const MIN_AUCTION_LENGTH_MS = 5 * 60 * 1000;
export const MAX_AUCTION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_EXTENSION_MINUTES = 1;
export const MAX_EXTENSION_MINUTES = 10;
export const MIN_BID_INCREMENT = 100;

export const RECENT_BIDS_KEEP = 50;

export const AUCTION_QUEUE_NAME = 'auction-jobs';
export const AUCTION_BID_QUEUE_NAME = 'auction-bid-persist';

export const AUCTION_BID_RATE_LIMIT_WINDOW_MS = 1000;
export const AUCTION_BID_RATE_LIMIT_MAX = 5;
