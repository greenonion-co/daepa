import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'auction_bids' })
@Index('IDX_AUCTION_BID_AUCTION_TS', ['auctionId', 'serverTsMs'])
@Index('IDX_AUCTION_BID_BIDDER', ['bidderUserId'])
export class AuctionBidEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  auctionId: number; // auctions.id

  @Column()
  bidderUserId: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'bigint' })
  serverTsMs: number; // 서버 수신 epoch ms (정렬 기준)

  @Column({ type: 'tinyint', default: 0 })
  triggeredExtension: number;

  @CreateDateColumn()
  createdAt: Date;
}
