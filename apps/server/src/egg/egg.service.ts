import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EggEntity } from './egg.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEggDto } from './egg.dto';
import { plainToInstance } from 'class-transformer';
import { ParentService } from 'src/parent/parent.service';

@Injectable()
export class EggService {
  constructor(
    @InjectRepository(EggEntity)
    private readonly eggRepository: Repository<EggEntity>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
  ) {}

  async createEgg(
    inputEggData: { eggId: string; ownerId: string } & CreateEggDto,
  ): Promise<void> {
    const eggData = plainToInstance(EggEntity, inputEggData);
    await this.eggRepository.insert(eggData);

    // TODO: is_egg = true
    if (inputEggData.father) {
      await this.parentService.createParent(
        inputEggData.eggId,
        inputEggData.father,
      );
    }
    if (inputEggData.mother) {
      await this.parentService.createParent(
        inputEggData.eggId,
        inputEggData.mother,
      );
    }
  }
}
