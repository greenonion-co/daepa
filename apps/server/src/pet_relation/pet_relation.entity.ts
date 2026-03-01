import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'pet_relations' })
@Index('UNIQUE_PET_ID', ['petId'], { unique: true })
@Index('IDX_FATHER_MOTHER', ['fatherId', 'motherId'])
@Index('IDX_MOTHER_ID', ['motherId'])
export class PetRelationEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'varchar', nullable: true })
  fatherId: string | null;

  @Column({ type: 'varchar', nullable: true })
  motherId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
