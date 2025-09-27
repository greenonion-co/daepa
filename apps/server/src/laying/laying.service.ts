import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { LayingEntity } from './laying.entity';
import { CreateLayingDto, UpdateLayingDto } from './laying.dto';
import { PetService } from '../pet/pet.service';
import { CreatePetDto } from '../pet/pet.dto';
import { PET_TYPE } from 'src/pet/pet.constants';
import { PARENT_ROLE } from 'src/parent_request/parent_request.constants';
import { range } from 'es-toolkit';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    private readonly petService: PetService,
    private readonly dataSource: DataSource,
  ) {}

  async createLaying(
    createLayingDto: CreateLayingDto,
    ownerId: string,
  ): Promise<LayingEntity> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 중복 체크를 transaction 내에서 수행
      const exists = await entityManager.existsBy(LayingEntity, {
        matingId: createLayingDto.matingId,
        layingDate: createLayingDto.layingDate,
      });

      if (exists) {
        throw new BadRequestException(
          '이미 해당 날짜에 산란 정보가 존재합니다.',
        );
      }

      // 산란 정보 생성
      const layingEntity = entityManager.create(LayingEntity, createLayingDto);
      const savedLaying = await entityManager.save(LayingEntity, layingEntity);

      // clutchCount만큼 펫을 배치로 생성
      const { clutchCount, temperature, species } = createLayingDto;
      if (clutchCount && clutchCount > 0) {
        // 펫 생성 DTO들을 미리 준비
        const petDtos: CreatePetDto[] = range(1, clutchCount + 1).map((i) => ({
          species,
          temperature,
          layingId: savedLaying.id,
          clutchOrder: i,
          type: PET_TYPE.EGG,
          ...(createLayingDto.motherId && {
            mother: {
              parentId: createLayingDto.motherId,
              role: PARENT_ROLE.MOTHER,
            },
          }),
          ...(createLayingDto.fatherId && {
            father: {
              parentId: createLayingDto.fatherId,
              role: PARENT_ROLE.FATHER,
            },
          }),
        }));

        for (const petDto of petDtos) {
          await this.petService.createPet(petDto, ownerId, entityManager);
        }
      }

      return savedLaying;
    });
  }

  async updateLaying(id: number, updateLayingDto: UpdateLayingDto) {
    // 존재 여부와 업데이트를 한 번에 처리
    const result = await this.layingRepository.update({ id }, updateLayingDto);

    if (result.affected === 0) {
      throw new NotFoundException('산란 정보를 찾을 수 없습니다.');
    }
  }
}
