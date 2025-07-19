import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LayingEntity } from '../laying/laying.entity';

@Entity({ name: 'matings' })
@Index('UNIQUE_MATING', ['userId', 'fatherId', 'motherId', 'matingDate'], {
  unique: true,
})
export class MatingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column({ nullable: true })
  fatherId: string;

  @Column({ nullable: true })
  motherId: string;

  @Column()
  matingDate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => LayingEntity, (laying) => laying.mating)
  layings: LayingEntity[];
}
