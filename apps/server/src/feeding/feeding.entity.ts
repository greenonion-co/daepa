import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'feedings' })
@Index('IDX_PET_FEEDING_AT', ['petId', 'feedingAt'])
export class FeedingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  petId: string;

  @Column({ type: 'date' })
  feedingAt: Date;

  @Column('json', { nullable: true })
  foods: string[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  memo?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
