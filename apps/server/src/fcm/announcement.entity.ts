import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ANNOUNCEMENT_STATUS {
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity({ name: 'announcements' })
export class AnnouncementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string; // 공지 제목

  @Column({ type: 'text' })
  body: string; // 공지 내용

  @Column({ nullable: true })
  dataPath?: string; // 알림 클릭 시 이동 경로 (data.path)

  @Column()
  sentBy: string; // 발송한 관리자 userId

  @Column({
    type: 'enum',
    enum: ANNOUNCEMENT_STATUS,
    default: ANNOUNCEMENT_STATUS.SENDING,
  })
  status: ANNOUNCEMENT_STATUS;

  @Column({ default: 0 })
  targetCount: number; // 발송 대상 토큰 수

  @Column({ default: 0 })
  successCount: number; // 발송 성공 토큰 수

  @Column({ default: 0 })
  failureCount: number; // 발송 실패 토큰 수

  @Column({ type: 'json', nullable: true })
  failuresByCode?: Record<string, number> | null; // FCM 에러 코드별 실패 토큰 수

  @CreateDateColumn()
  createdAt: Date;
}
