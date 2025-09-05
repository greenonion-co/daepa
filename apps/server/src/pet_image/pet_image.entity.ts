import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PetImageItem } from './pet_image.dto';

@Entity({ name: 'pet_images' })
@Index('UNIQUE_PET_ID_FILE_NAME', ['petId'], { unique: true })
export class PetImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column({ type: 'json', nullable: true })
  files: PetImageItem[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
