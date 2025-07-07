import { Exclude, Expose } from 'class-transformer';
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
@Index('UNIQUE_EMAIL_PROVIDER', ['email', 'provider', 'provider_id'], {
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

  @Expose({ name: 'providerId' })
  @Column()
  provider_id: string;

  @Expose({ name: 'userId' })
  @Column()
  user_id: string;

  @Expose({ name: 'createdAt' })
  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @Column()
  @UpdateDateColumn()
  updated_at: Date;
}
