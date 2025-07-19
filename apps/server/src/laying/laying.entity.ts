import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LAYING_EGG_TYPE } from './laying.constants';

@Entity({ name: 'layings' })
@Index('UNIQUE_EGG_ID', ['eggId'], {
  unique: true,
})
export class LayingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matingId: number;

  @Column()
  eggId: string;

  @Column()
  layingDate: number;

  @Column()
  layingOrder: number;

  @Column({ type: 'enum', enum: LAYING_EGG_TYPE, nullable: true })
  eggType: LAYING_EGG_TYPE;

  @Column({ nullable: true })
  temperture: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
