import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { PairEntity } from '../pair/pair.entity';

@Entity({ name: 'matings' })
@Index('UNIQUE_MATING', ['pairId', 'matingDate'], {
  unique: true,
})
export class MatingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pairId: number;

  @Column({ type: 'date', nullable: true })
  matingDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PairEntity)
  pair: PairEntity;
}
