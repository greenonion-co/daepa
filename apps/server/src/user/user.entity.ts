import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { AdoptionEntity } from 'src/adoption/adoption.entity';
import { PetEntity } from 'src/pet/pet.entity';

@Entity({ name: 'users' })
@Index('UNIQUE_USER_ID', ['userId'], { unique: true })
@Index('UNIQUE_EMAIL', ['email'], { unique: true })
@Index('UNIQUE_USER_NAME', ['name'], { unique: true })
export class UserEntity {
  @Exclude()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: USER_ROLE,
  })
  role: USER_ROLE;

  @Column({ default: false })
  isBiz: boolean;

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  refreshTokenExpiresAt?: Date | null;

  @Column({
    type: 'enum',
    enum: USER_STATUS,
  })
  status: USER_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => AdoptionEntity, (adoption) => adoption.seller)
  sellerAdoption: AdoptionEntity;

  @OneToOne(() => AdoptionEntity, (adoption) => adoption.buyer)
  buyerAdoption: AdoptionEntity;

  @OneToOne(() => PetEntity, (pet) => pet.owner)
  pet: PetEntity;
}
