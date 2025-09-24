import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PET_GROWTH, PET_SEX } from 'src/pet/pet.constants';

@Entity({ name: 'pet_details' })
@Index('UNIQUE_PET_DETAIL_PET_ID', ['petId'], { unique: true })
export class PetDetailEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'enum', enum: PET_GROWTH, nullable: true })
  growth: PET_GROWTH | null; // 성장단계

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex: PET_SEX | null;

  @Column('json', { nullable: true })
  morphs: string[] | null; // 모프

  @Column('json', { nullable: true })
  traits: string[] | null; // 형질

  @Column('json', { nullable: true })
  foods: string[] | null; // 먹이

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight: number | null; // 몸무게(g)

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
