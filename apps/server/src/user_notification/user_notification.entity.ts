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
  sender_id: string;

  @Expose({ name: 'receiverId' })
  @Column()
  receiver_id: string;

  @Column({ type: 'enum', enum: USER_NOTIFICATION_TYPE })
  type: string;

  @Expose({ name: 'targetId' })
  @Column()
  target_id: string;

  @Column({
    type: 'enum',
    enum: USER_NOTIFICATION_STATUS,
    nullable: true,
    default: USER_NOTIFICATION_STATUS.UNREAD,
  })
  status?: string;

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
