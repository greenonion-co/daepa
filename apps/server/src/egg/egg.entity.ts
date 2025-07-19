import { Exclude } from 'class-transformer';
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
@Index('UNIQUE_EGG_ID', ['eggId'], { unique: true })
@Index('UNIQUE_CLUTCH', ['name', 'layingDate', 'clutch', 'clutchOrder'], {
  unique: true,
})
export class EggEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eggId: string;

  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: PET_SPECIES; // 종

  @Column()
  layingDate: number; // 산란일

  @Column({ type: 'tinyint', nullable: true })
  clutch?: number; // 차수(클러치)

  @Column({ type: 'tinyint' })
  clutchOrder: number; // 동배 번호(같은 차수 내 구분)

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 알 정보

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  hatchedPetId?: string; // 해칭 여부 판단 시에도 사용

  @Column({ default: false })
  isDeleted: boolean;
}
