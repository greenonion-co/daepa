import { BadRequestException, Injectable } from '@nestjs/common';
import { LayingEntity } from './laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLayingDto } from './laying.dto';
import { isMySQLError } from 'src/common/error';
import { MatingService } from 'src/mating/mating.service';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    private readonly matingService: MatingService,
  ) {}

  async createLaying(createLayingDto: CreateLayingDto) {
    const isMatingExist = await this.matingService.isMatingExist({
      id: createLayingDto.matingId,
    });
    if (!isMatingExist) {
      throw new BadRequestException('유효한 메이팅 정보가 존재하지 않습니다.');
    }

    // incrementedLayingOrder 생성 시의 동시성 문제 해결 목적
    let retries = 5;
    while (retries > 0) {
      try {
        const clutchEggs = await this.layingRepository.countBy({
          matingId: createLayingDto.matingId,
          layingDate: createLayingDto.layingDate,
        });

        const incrementedLayingOrder = clutchEggs + 1;

        const layingEntity = this.layingRepository.create({
          ...createLayingDto,
          layingOrder: incrementedLayingOrder,
        });
        return await this.layingRepository.save(layingEntity);
      } catch (error) {
        if (
          isMySQLError(error) &&
          error.code === 'ER_DUP_ENTRY' &&
          retries > 1
        ) {
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }
  }
}
