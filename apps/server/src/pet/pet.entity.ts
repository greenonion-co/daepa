import { Exclude, Expose } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PET_SEX, PET_SPECIES } from './pet.constants';

@Entity({ name: 'pets' })
@Index('UNIQUE_PET_ID', ['pet_id'], { unique: true })
@Index('UNIQUE_OWNER_PET_NAME', ['owner_id', 'name'], { unique: true })
export class PetEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'petId' })
  @Column()
  pet_id: string;

  @Expose({ name: 'ownerId' })
  @Column()
  owner_id: string;

  @Column()
  name: string; // 이름

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: keyof typeof PET_SPECIES; // 종

  @Column('json', { nullable: true })
  morphs?: string[]; // 모프

  @Column('json', { nullable: true })
  traits?: string[]; // 형질

  @Column({ nullable: true })
  birthdate?: number; // 생년월일 (yyyyMMdd)

  @Column({ nullable: true })
  growth?: string; // 성장단계

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex?: keyof typeof PET_SEX; // 성별

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight?: number; // 몸무게(g)

  @Column('json', { nullable: true })
  foods?: string[]; // 먹이

  @Expose({ name: 'desc' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 소개말

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
