import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { PET_SPECIES, PET_TYPE } from './pet.constants';
import { AdoptionEntity } from '../adoption/adoption.entity';
import { PetImageEntity } from 'src/pet_image/pet_image.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { LayingEntity } from 'src/laying/laying.entity';

@Entity({ name: 'pets' })
@Index('UNIQUE_PET_ID', ['petId'], { unique: true })
@Index('UNIQUE_OWNER_PET_NAME', ['ownerId', 'name'], { unique: true })
export class PetEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({
    type: 'enum',
    enum: PET_TYPE,
    default: PET_TYPE.PET,
  })
  type: PET_TYPE;

  @Column({ type: 'varchar', nullable: true })
  ownerId: string | null;

  @Column({ type: 'int', nullable: true })
  layingId: number | null;

  @Column({ type: 'date', nullable: true })
  hatchingDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null; // 이름

  @Column({ type: 'enum', enum: PET_SPECIES })
  species: PET_SPECIES; // 종

  @Column({ type: 'tinyint', nullable: true })
  clutchOrder: number | null; // 동배 번호(같은 차수 내 구분)

  @Column({ type: 'varchar', length: 500, nullable: true })
  desc: string | null; // 소개말

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column('json', { nullable: true })
  photoOrder: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 분양 관계 정의
  @OneToOne(() => AdoptionEntity, (adoption) => adoption.pet, {
    nullable: true,
  })
  adoption: AdoptionEntity | null;

  @OneToOne(() => PetImageEntity, (image) => image.petId)
  photos: PetImageEntity | null;

  @OneToOne(() => PetDetailEntity, (petDetail) => petDetail.petId, {
    nullable: true,
  })
  petDetail: PetDetailEntity | null;

  @OneToOne(() => EggDetailEntity, (eggDetail) => eggDetail.petId, {
    nullable: true,
  })
  eggDetail: EggDetailEntity | null;

  @OneToOne(() => LayingEntity, (laying) => laying.pet, {
    nullable: true,
  })
  laying: LayingEntity | null;
}
