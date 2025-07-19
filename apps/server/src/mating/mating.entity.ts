import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
}
