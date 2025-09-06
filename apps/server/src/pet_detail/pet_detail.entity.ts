import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PET_SEX } from './pet_detail.constants';

@Entity({ name: 'pet_details' })
@Index('UNIQUE_PET_DETAIL_PET_ID', ['petId'], { unique: true })
export class PetDetailEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex?: PET_SEX;

  @Column('json', { nullable: true })
  morphs?: string[]; // 모프

  @Column('json', { nullable: true })
  traits?: string[]; // 형질

  @Column('json', { nullable: true })
  foods?: string[]; // 먹이

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight?: number; // 몸무게(g)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
