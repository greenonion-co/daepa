import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, DataSource } from 'typeorm';
import { PairEntity } from './pair.entity';
import { CreatePairDto } from './pair.dto';

@Injectable()
export class PairService {
  constructor(private readonly dataSource: DataSource) {}

  async createPair(
    createPairDto: CreatePairDto,
    managerInjected?: EntityManager,
  ) {
    const run = async (manager: EntityManager) => {
      const { fatherId, motherId, ownerId } = createPairDto;
      if (!ownerId)
        throw new BadRequestException('등록 시 주인 아이디가 필요합니다.');
      if (!fatherId && !motherId) {
        throw new BadRequestException(
          '등록하려면 최소 한 마리의 부모 정보가 필요합니다.',
        );
      }

      const exist = await manager.existsBy(PairEntity, {
        ownerId,
        fatherId,
        motherId,
      });
      if (!exist) {
        const newPair = manager.create(PairEntity, createPairDto);
        return manager.save(PairEntity, newPair);
      }
    };

    if (managerInjected) return run(managerInjected);
    return this.dataSource.transaction(run);
  }
}
