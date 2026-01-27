import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DEVICE_PLATFORM {
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity({ name: 'fcm_tokens' })
@Index('UNIQUE_USER_DEVICE', ['userId', 'deviceId'], { unique: true })
@Index('IDX_USER_ID', ['userId'])
export class FcmTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  deviceId: string; // 기기 고유 ID

  @Column()
  token: string; // FCM 토큰

  @Column({
    type: 'enum',
    enum: DEVICE_PLATFORM,
  })
  platform: DEVICE_PLATFORM;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
