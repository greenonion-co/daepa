import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auction_participants' })
export class AuctionParticipantEntity {
  @PrimaryColumn({ type: 'bigint' })
  auctionId: number;

  @PrimaryColumn()
  userId: string;

  @Column({ default: 0 })
  bidCount: number;

  @CreateDateColumn()
  firstJoinedAt: Date;
}
