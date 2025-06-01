import { Exclude, Expose } from 'class-transformer';
import { PET_SPECIES } from 'src/pet/pet.constants';
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

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: keyof typeof PET_SPECIES; // 종

  @Expose({ name: 'layingDate' })
  @Column()
  laying_date: number; // 산란일

  @Expose({ name: 'clutch' })
  @Column({ type: 'tinyint', nullable: true })
  clutch?: number; // 차수(클러치)

  @Expose({ name: 'clutchOrder' })
  @Column({ type: 'tinyint' })
  clutch_order: number; // 동배 번호(같은 차수 내 구분)

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 알 정보

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;

  @Expose({ name: 'hatchedPetId' })
  @Column({ nullable: true })
  hatched_pet_id?: string; // 해칭 여부 판단 시에도 사용

  @Expose({ name: 'isDeleted' })
  @Column({ default: false })
  is_deleted: boolean;
}
