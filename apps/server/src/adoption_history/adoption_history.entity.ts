import { Exclude } from 'class-transformer';
import { PET_ADOPTION_METHOD } from 'src/pet/pet.constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';

@Entity({ name: 'adoption_histories' })
@Index('UNIQUE_ADOPTION_HISTORY', ['petId', 'sellerId', 'adoptionDate'], {
  unique: true,
})
export class AdoptionHistoryEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'date', nullable: true })
  adoptionDate?: Date | null; // 분양 날짜

  @Column({ type: 'varchar', nullable: true })
  buyerId?: string | null; // 입양자 ID

  @Column({ type: 'int', nullable: true })
  price?: number | null; // 실제 거래가

  @Column({ type: 'enum', enum: PET_ADOPTION_METHOD, nullable: true })
  method?: PET_ADOPTION_METHOD | null; // 거래 방식

  @Column({ type: 'text', nullable: true })
  memo?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 쿼리빌더 매핑용 속성 (DB 컬럼 아님)
  pet?: PetEntity;
  petDetail?: Partial<PetDetailEntity>;
  seller?: UserEntity;
  buyer?: UserEntity;
}
