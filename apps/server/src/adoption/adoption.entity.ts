import { Exclude } from 'class-transformer';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_LOCATION,
} from 'src/pet/pet.constants';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity({ name: 'adoptions' })
@Index('UNIQUE_ADOPTION_ID', ['adoptionId'], { unique: true })
export class AdoptionEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adoptionId: string;

  @Column()
  petId: string;

  @Column({ nullable: true })
  price?: number; // 가격

  @Column({ type: 'date', nullable: true })
  adoptionDate?: Date; // 분양 날짜

  @Column()
  sellerId: string; // 분양자 ID

  @Column({ nullable: true })
  buyerId?: string; // 입양자 ID

  @Column({ type: 'text', nullable: true })
  memo?: string; // 메모

  @Column({ type: 'enum', enum: PET_ADOPTION_LOCATION, nullable: true })
  location?: PET_ADOPTION_LOCATION; // 거래 장소

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'enum', enum: ADOPTION_SALE_STATUS, nullable: true })
  status?: ADOPTION_SALE_STATUS;

  // 펫과의 관계 수정
  @OneToOne(() => PetEntity, (pet) => pet.adoption)
  @JoinColumn({ name: 'petId', referencedColumnName: 'petId' })
  pet: PetEntity;

  @OneToOne(() => PetDetailEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'petId', referencedColumnName: 'petId' })
  petDetail: PetDetailEntity;

  // 판매자와의 관계
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'sellerId', referencedColumnName: 'userId' })
  seller: UserEntity;

  // 구매자와의 관계
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'buyerId', referencedColumnName: 'userId' })
  buyer: UserEntity;
}
