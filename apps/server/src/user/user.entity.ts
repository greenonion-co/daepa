import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { USER_ROLE } from './user.constant';

@Entity({ name: 'users' })
@Index('UNIQUE_USER_ID', ['user_id'], { unique: true })
export class UserEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'userId' })
  @Column()
  user_id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: USER_ROLE,
  })
  role: USER_ROLE;

  @Exclude()
  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @Column()
  @UpdateDateColumn()
  updated_at: Date;
}
