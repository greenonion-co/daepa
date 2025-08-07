import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';

@Entity({ name: 'parent_requests' })
@Index('UNIQUE_CHILD_PARENT_ACTIVE', ['childPetId', 'parentPetId', 'status'], {
  unique: false,
})
export class ParentRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  childPetId: string;

  @Column({ nullable: false })
  parentPetId: string;

  @Column({
    type: 'enum',
    enum: PARENT_ROLE,
    nullable: false,
  })
  role: PARENT_ROLE;

  @Column({
    type: 'enum',
    enum: PARENT_STATUS,
    default: PARENT_STATUS.PENDING,
    nullable: true,
  })
  status?: PARENT_STATUS;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
