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

  @Column()
  petId: string;

  @Column()
  parentId: string;

  @Column()
  isMyPet: boolean;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
