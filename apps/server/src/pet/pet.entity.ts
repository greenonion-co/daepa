import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { PET_GROWTH, PET_SEX, PET_SPECIES } from './pet.constants';
import { AdoptionEntity } from '../adoption/adoption.entity';

@Entity({ name: 'pets' })
@Index('UNIQUE_PET_ID', ['petId'], { unique: true })
@Index('UNIQUE_OWNER_PET_NAME', ['ownerId', 'name'], { unique: true })
export class PetEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ nullable: true })
  ownerId?: string;

  @Column({ nullable: true })
  pairId?: number;

  @Column({ type: 'int', nullable: true })
  layingId?: number;

  @Column({ type: 'date', nullable: true })
  hatchingDate?: Date;

  @Column({ nullable: true })
  name?: string; // 이름

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex?: PET_SEX; // 성별

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: PET_SPECIES; // 종

  @Column('json', { nullable: true })
  morphs?: string[]; // 모프

  @Column('json', { nullable: true })
  traits?: string[]; // 형질

  @Column('json', { nullable: true })
  foods?: string[]; // 먹이

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight?: number; // 몸무게(g)

  @Column({ type: 'enum', enum: PET_GROWTH, nullable: true })
  growth?: PET_GROWTH; // 성장단계

  @Column({ type: 'tinyint', nullable: true })
  clutchOrder?: number; // 동배 번호(같은 차수 내 구분)

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  temperature?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 소개말

  @Column({ default: true })
  isPublic?: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column('json', { nullable: true })
  photos?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 분양 관계 정의
  @OneToOne(() => AdoptionEntity, (adoption) => adoption.pet, {
    nullable: true,
  })
  adoption?: AdoptionEntity;

  // @OneToMany(() => PetImageEntity, (image) => image.petId)
  // photos?: PetImageEntity[];
}
