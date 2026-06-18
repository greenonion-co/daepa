import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum INQUIRY_STATUS {
  PENDING = 'pending',
  ANSWERED = 'answered',
}

@Entity({ name: 'inquiries' })
@Index('IDX_INQUIRY_USER', ['userId'])
export class InquiryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string; // 문의 작성자 userId

  @Column({ type: 'text' })
  content: string; // 문의 내용

  @Column({
    type: 'enum',
    enum: INQUIRY_STATUS,
    default: INQUIRY_STATUS.PENDING,
  })
  status: INQUIRY_STATUS;

  @Column({ type: 'text', nullable: true })
  answer: string | null; // 관리자 답변

  @Column({ type: 'varchar', nullable: true })
  answeredBy: string | null; // 답변한 관리자 userId

  @Column({ type: 'datetime', nullable: true })
  answeredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
