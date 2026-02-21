import { Exclude } from 'class-transformer';
import { PET_ADOPTION_STATUS } from 'src/pet/pet.constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';

@Entity({ name: 'pet_adoptions' })
@Index('UNIQUE_PET_ADOPTION_PET_ID', ['petId'], { unique: true })
export class PetAdoptionEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({
    type: 'enum',
    enum: PET_ADOPTION_STATUS,
    nullable: true,
    default: null,
  })
  status: PET_ADOPTION_STATUS | null;

  @Column({ type: 'int', nullable: true })
  price?: number | null; // 희망 분양가

  @Column({ type: 'text', nullable: true })
  memo?: string | null;

  @Column({ type: 'varchar', nullable: true })
  reservedUserId?: string | null; // 예약 시 예약자 ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // petDetail을 위한 임시 속성 (쿼리에서만 사용)
  petDetail?: Partial<PetDetailEntity>;
}
