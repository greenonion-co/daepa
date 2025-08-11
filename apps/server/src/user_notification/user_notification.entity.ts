import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  USER_NOTIFICATION_STATUS,
  USER_NOTIFICATION_TYPE,
} from './user_notification.constant';
import { UserNotificationDetailJson } from './user_notification.dto';

@Entity({ name: 'user_notifications' })
@Index(['senderId', 'receiverId', 'type', 'targetId'], { unique: true })
export class UserNotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderId: string; // 알림 발신자 Id

  @Column()
  receiverId: string; // 알림 수신자 Id

  @Column({ type: 'enum', enum: USER_NOTIFICATION_TYPE })
  type: USER_NOTIFICATION_TYPE; // 알림 종류

  @Column({ nullable: true, type: 'int' })
  targetId?: number; // 알림 대상 객체 Id

  @Column({
    type: 'enum',
    enum: USER_NOTIFICATION_STATUS,
    default: USER_NOTIFICATION_STATUS.UNREAD,
  })
  status: USER_NOTIFICATION_STATUS; // 알림 상태

  @Column({ nullable: true, type: 'json' })
  detailJson: UserNotificationDetailJson;

  @CreateDateColumn()
  createdAt: Date; // 알림 생성 시간

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}
