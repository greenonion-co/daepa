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
import { PET_SEX, PET_SPECIES } from './pet.constants';
import { AdoptionEntity } from 'src/adoption/adoption.entity';
import { UserEntity } from 'src/user/user.entity';

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
  ownerId: string;

  @Column()
  name: string; // 이름

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: PET_SPECIES; // 종

  @Column('json', { nullable: true })
  morphs?: string[]; // 모프

  @Column('json', { nullable: true })
  traits?: string[]; // 형질

  @Column({ nullable: true })
  birthdate?: number; // 생년월일 (yyyyMMdd)

  @Column({ nullable: true })
  growth?: string; // 성장단계

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex?: PET_SEX; // 성별

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight?: number; // 몸무게(g)

  @Column('json', { nullable: true })
  foods?: string[]; // 먹이

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc?: string; // 소개말

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: true })
  isPublic?: boolean;

  @OneToOne(() => AdoptionEntity, (adoption) => adoption.pet)
  adoption: AdoptionEntity;

  @OneToOne(() => UserEntity, (user) => user)
  owner: UserEntity;
}
