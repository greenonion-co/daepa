import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from './user_notification.constant';
import { Expose } from 'class-transformer';

@Entity({ name: 'user_notifications' })
export class UserNotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ name: 'senderId' })
  @Column()
  sender_id: string; // 알림 발신자 Id

  @Expose({ name: 'receiverId' })
  @Column()
  receiver_id: string; // 알림 수신자 Id

  @Column({ type: 'enum', enum: USER_NOTIFICATION_TYPE })
  type: string; // 알림 종류

  @Expose({ name: 'targetId' })
  @Column({ nullable: true })
  target_id?: string; // 알림 대상 객체 Id

  @Column({
    type: 'enum',
    enum: USER_NOTIFICATION_STATUS,
    default: USER_NOTIFICATION_STATUS.UNREAD,
  })
  status: string; // 알림 상태

  @Expose({ name: 'detailJson' })
  @Column('json')
  detail_json: Record<string, any>;

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
