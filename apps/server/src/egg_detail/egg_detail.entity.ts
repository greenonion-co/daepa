import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EGG_STATUS } from './egg_detail.constants';

@Entity({ name: 'egg_details' })
@Index('UNIQUE_EGG_DETAIL_PET_ID', ['petId'], { unique: true })
export class EggDetailEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  temperature?: number;

  @Column({ type: 'enum', enum: EGG_STATUS, nullable: true })
  status?: EGG_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
