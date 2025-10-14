import { PetEntity } from 'src/pet/pet.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'layings' })
@Index('UNIQUE_LAYING', ['matingId', 'layingDate'], {
  unique: true,
})
@Index('UNIQUE_CLUTCH', ['matingId', 'clutch'], {
  unique: true,
})
export class LayingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  matingId?: number;

  @Column({ type: 'date' })
  layingDate: Date;

  @Column({ type: 'tinyint', nullable: true })
  clutch?: number; // 차수(클러치)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => PetEntity, (pet) => pet.laying)
  pet: PetEntity;
}
