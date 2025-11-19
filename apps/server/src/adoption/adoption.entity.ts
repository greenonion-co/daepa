import { Exclude } from 'class-transformer';
import {
  ADOPTION_SALE_STATUS,
  PET_ADOPTION_METHOD,
} from 'src/pet/pet.constants';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
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

  @Column({ type: 'enum', enum: PET_ADOPTION_METHOD, nullable: true })
  method?: PET_ADOPTION_METHOD; // 거래 방식

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 데이터 자체를 삭제한 것과, 판매완료가 아닌 최신 데이터를 구분하기 위한 플래그
  // 동일한 주인이 판매완료를 했다가, 추후에 다시 재입양을 하여 또다시 분양정보를 생성하는 케이스 대응 목적
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'enum', enum: ADOPTION_SALE_STATUS, nullable: true })
  status?: ADOPTION_SALE_STATUS;

  // 펫과의 관계 수정
  @OneToOne(() => PetEntity, (pet) => pet.adoption)
  pet: PetEntity;

  // petDetail을 위한 임시 속성 (쿼리에서만 사용)
  petDetail?: Partial<PetDetailEntity>;

  // // 판매자와의 관계
  @OneToOne(() => UserEntity, (user) => user.userId)
  seller: UserEntity;

  // // 구매자와의 관계
  @OneToOne(() => UserEntity, (user) => user.userId, { nullable: true })
  buyer: UserEntity;
}
