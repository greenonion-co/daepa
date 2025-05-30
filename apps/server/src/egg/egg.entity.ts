import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'eggs' })
@Index('UNIQUE_EGG_ID', ['egg_id'], { unique: true })
@Index('UNIQUE_CLUTCH', ['name', 'laying_date', 'clutch', 'clutch_order'], {
  unique: true,
})
export class EggEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'eggId' })
  @Column()
  egg_id: string;

  @Expose({ name: 'ownerId' })
  @Column()
  owner_id: string;

  @Expose({ name: 'layingDate' })
  @Column({ nullable: true })
  laying_date?: number; // 산란일

  @Expose({ name: 'clutch' })
  @Column({ type: 'tinyint', nullable: true })
  clutch?: number; // 차수(클러치)

  @Expose({ name: 'clutchOrder' })
  @Column({ nullable: true })
  clutch_order?: number; // 동배 번호(같은 차수 내 구분)

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 알 정보

  @Expose({ name: 'hatchingDate' })
  @Column({ nullable: true })
  hatching_date?: number; // 해칭일

  @Expose({ name: 'petId' })
  @Column({ nullable: true })
  pet_id?: string; // 펫으로 등록된 경우, pets 테이블로부터 업데이트

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
