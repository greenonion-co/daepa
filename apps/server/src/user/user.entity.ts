import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { OAUTH_PROVIDER } from 'src/auth/auth.constants';

@Entity({ name: 'users' })
@Index('UNIQUE_USER_ID', ['user_id'], { unique: true })
@Index('UNIQUE_EMAIL', ['email'], { unique: true })
@Index('UNIQUE_PROVIDER_ID', ['provider', 'provider_id'], { unique: true })
@Index('UNIQUE_USER_NAME', ['name'], { unique: true })
export class UserEntity {
  @Exclude()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Expose({ name: 'userId' })
  @Column()
  user_id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: USER_ROLE,
  })
  role: USER_ROLE;

  @Expose({ name: 'isBiz' })
  @Column({ default: false })
  is_biz: boolean;

  @Column({
    type: 'enum',
    enum: OAUTH_PROVIDER,
  })
  provider: OAUTH_PROVIDER;

  @Expose({ name: 'providerId' })
  @Column({ type: 'varchar', nullable: true })
  provider_id: string | null;

  @Expose({ name: 'refreshToken' })
  @Column({ type: 'varchar', nullable: true })
  refresh_token?: string | null;

  @Expose({ name: 'refreshTokenExpiresAt' })
  @Column({ type: 'datetime', nullable: true })
  refresh_token_expires_at?: Date | null;

  @Column({
    type: 'enum',
    enum: USER_STATUS,
  })
  status: USER_STATUS;

  @Expose({ name: 'createdAt' })
  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @Column()
  @UpdateDateColumn()
  updated_at: Date;
}
