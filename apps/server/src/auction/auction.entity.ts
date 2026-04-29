import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AUCTION_STATUS } from './auction.constants';

@Entity({ name: 'auctions' })
@Index('UNIQUE_AUCTION_AUCTION_ID', ['auctionId'], { unique: true })
@Index('UNIQUE_AUCTION_SHARE_TOKEN', ['shareToken'], { unique: true })
@Index('IDX_AUCTION_STATUS_END', ['status', 'currentEndTime'])
@Index('IDX_AUCTION_PET', ['petId'])
@Index('IDX_AUCTION_HOST', ['hostUserId'])
export class AuctionEntity {
  @Exclude()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 22 })
  auctionId: string; // 외부 노출용 nanoid

  @Column()
  petId: string; // FK -> pets.pet_id

  @Column()
  hostUserId: string; // FK -> users.user_id

  @Column({ length: 22 })
  shareToken: string; // 공유 URL용 nanoid

  @Column({
    type: 'enum',
    enum: AUCTION_STATUS,
    default: AUCTION_STATUS.PENDING,
  })
  status: AUCTION_STATUS;

  @Column({ type: 'bigint' })
  startingPrice: number; // 원 단위

  @Column({ type: 'bigint' })
  minIncrement: number;

  @Column({ type: 'int', default: 5 })
  extensionMinutes: number;

  @Column({ type: 'datetime', precision: 3 })
  startTime: Date;

  @Column({ type: 'datetime', precision: 3 })
  originalEndTime: Date;

  @Column({ type: 'datetime', precision: 3 })
  currentEndTime: Date;

  @Column({ type: 'bigint', nullable: true })
  finalPrice: number | null;

  @Column({ type: 'varchar', nullable: true })
  winnerUserId: string | null;

  @Column({ type: 'bigint', nullable: true })
  winnerBidId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
