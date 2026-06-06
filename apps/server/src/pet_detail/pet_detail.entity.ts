import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PET_GROWTH, PET_SEX } from 'src/pet/pet.constants';

@Entity({ name: 'pet_details' })
@Index('UNIQUE_PET_DETAIL_PET_ID', ['petId'], { unique: true })
export class PetDetailEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'enum', enum: PET_GROWTH, nullable: true })
  growth: PET_GROWTH | null; // 성장단계

  @Column({ type: 'enum', enum: PET_SEX, nullable: true })
  sex: PET_SEX | null;

  @Column('json', { nullable: true })
  morphs: string[] | null; // 모프

  @Column('json', { nullable: true })
  traits: string[] | null; // 형질

  @Column('json', { nullable: true })
  foods: string[] | null; // 먹이

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  weight: number | null; // 몸무게(g)

  // 펫 평가(육각형 능력치) 0~5. 필터링/정렬을 위해 개별 컬럼으로 저장.
  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score1: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score2: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score3: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score4: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score5: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score6: number | null;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
