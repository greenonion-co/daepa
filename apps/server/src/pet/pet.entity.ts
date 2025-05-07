import { Expose } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { SEX_ENUM, SPECIES_ENUM } from './pet.constants';

@Entity({ name: 'pets' })
@Index('UNIQUE_PET_ID', ['pet_id'], { unique: true })
@Index('UNIQUE_OWNER_PET_NAME', ['owner_id', 'name'], { unique: true })
export class PetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Expose({ name: 'petId' })
  pet_id: string;

  @Column()
  @Expose({ name: 'ownerId' })
  owner_id: string;

  @Column()
  name: string; // 이름

  @Column({ type: 'enum', enum: SPECIES_ENUM })
  species: typeof SPECIES_ENUM; // 종

  @Column('json', { nullable: true })
  morphs?: string[]; // 모프

  @Column('json', { nullable: true })
  traits?: string[]; // 형질

  @Column({ nullable: true })
  birthdate?: string; // 생년월일

  @Column({ type: 'enum', enum: SEX_ENUM, nullable: true })
  sex?: typeof SEX_ENUM; // 성별

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight?: number; // 몸무게(g)

  @Column('json', { nullable: true })
  foods?: string[]; // 먹이
}
