import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'view_logs' })
@Index('IDX_VIEW_LOG_RESOURCE', ['resourceType', 'resourceId'])
@Index('IDX_VIEW_LOG_VIEWER', ['viewerId'])
@Index('IDX_VIEW_LOG_CREATED', ['createdAt'])
export class ViewLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  resourceType: string;

  @Column({ type: 'varchar' })
  resourceId: string;

  @Column({ type: 'varchar', nullable: true })
  viewerId: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
