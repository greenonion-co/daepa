import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { USER_ROLE, USER_STATUS } from './user.constant';

@Entity({ name: 'users' })
@Index('UNIQUE_USER_ID', ['userId'], { unique: true })
@Index('UNIQUE_EMAIL', ['email'], { unique: true })
@Index('UNIQUE_USER_NAME', ['name'], { unique: true })
@Index('UNIQUE_SHOWROOM_SLUG', ['showroomSlug'], { unique: true })
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

  @Column({ type: 'varchar', nullable: true })
  realName?: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', nullable: true })
  address?: string | null;

  @Column({ default: false })
  isBiz: boolean;

  @Column({ default: false })
  isRealNamePublic: boolean;

  @Column({ default: false })
  isPhonePublic: boolean;

  @Column({ default: false })
  isAddressPublic: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerImageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  refreshTokenExpiresAt?: Date | null;

  @Column({
    type: 'enum',
    enum: USER_STATUS,
  })
  status: USER_STATUS;

  /**
   * 공개 펫 슬롯 한도 override.
   * null 이면 role 기본값을 사용 (DEFAULT_PET_LIMIT_BY_ROLE).
   * 관리자가 예외적으로 사용자별 한도를 지정할 때 사용.
   */
  @Column({ type: 'int', nullable: true })
  petLimitOverride: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  showroomSlug?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
