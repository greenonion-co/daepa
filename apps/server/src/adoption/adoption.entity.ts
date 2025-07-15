import { Exclude, Expose } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'adoptions' })
@Index('UNIQUE_PET_ADOPTION', ['pet_id'], { unique: true })
@Index('UNIQUE_ADOPTION_ID', ['adoption_id'], { unique: true })
export class AdoptionEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'adoptionId' })
  @Column()
  adoption_id: string;

  @Expose({ name: 'petId' })
  @Column()
  pet_id: string;

  @Column({ nullable: true })
  price?: number; // 가격

  @Expose({ name: 'adoptionDate' })
  @Column({ type: 'date', nullable: true })
  adoption_date?: Date; // 분양 날짜

  @Expose({ name: 'sellerId' })
  @Column()
  seller_id: string; // 분양자 ID

  @Expose({ name: 'buyerId' })
  @Column({ nullable: true })
  buyer_id?: string; // 입양자 ID

  @Column({ type: 'text', nullable: true })
  memo?: string; // 메모

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string; // 거래 장소

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;

  @Expose({ name: 'isDeleted' })
  @Column({ default: false })
  is_deleted: boolean;
}
