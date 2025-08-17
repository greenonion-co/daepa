import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pet_images' })
@Index('UNIQUE_PET_IMAGE_ID', ['petId', 'fileName'], { unique: true })
export class PetImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column()
  fileName: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column()
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
