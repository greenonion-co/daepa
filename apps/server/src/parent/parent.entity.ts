import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { PARENT_STATUS, PARENT_ROLE } from './parent.constant';

@Entity({ name: 'parents' })
export class ParentEntity {
  @Expose({ name: 'relationId' })
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'petId' })
  @Column()
  pet_id: string;

  @Expose({ name: 'parentId' })
  @Column()
  parent_id: string;

  @Expose({ name: 'isMyPet' })
  @Column()
  is_my_pet: boolean;

  @Column({
    type: 'enum',
    enum: PARENT_ROLE,
  })
  role: PARENT_ROLE;

  @Column({
    type: 'enum',
    enum: PARENT_STATUS,
    default: PARENT_STATUS.PENDING,
    nullable: true,
  })
  status: PARENT_STATUS;

  @Expose({ name: 'createdAt' })
  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @Column()
  @UpdateDateColumn()
  updated_at: Date;
}
