import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OAUTH_PROVIDER } from '../auth.constants';

@Entity({ name: 'oauth' })
@Index('UNIQUE_EMAIL_PROVIDER', ['email', 'provider', 'providerId'], {
  unique: true,
})
export class OauthEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: OAUTH_PROVIDER,
  })
  provider: OAUTH_PROVIDER;

  @Column()
  providerId: string;

  @Column()
  userId: string;

  @Exclude()
  @Column({ nullable: true })
  refreshToken: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
