import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetEntity } from './pet.entity';
import { PetSingleDto } from './pet.dto';
import { PET_TYPE } from './pet.constants';
import { PetDetailEntity } from '../pet_detail/pet_detail.entity';
import { EggDetailEntity } from '../egg_detail/egg_detail.entity';

export type PetSingleCacheData = PetSingleDto & { ownerId: string };

/**
 * pet + pet_detail/egg_detail 데이터를 로드한다.
 * CACHE.pet 키의 fallback으로 사용되며, PetService와 ParentRequestService 등에서 공유한다.
 */
export async function loadPetData(
  em: EntityManager,
  petId: string,
): Promise<PetSingleCacheData | null> {
  const pet = await em.findOne(PetEntity, { where: { petId } });
  if (!pet) return null;

  let petDetail: PetDetailEntity | null = null;
  let eggDetail: EggDetailEntity | null = null;

  if (pet.type === PET_TYPE.EGG) {
    eggDetail = await em.findOne(EggDetailEntity, { where: { petId } });
  } else {
    petDetail = await em.findOne(PetDetailEntity, { where: { petId } });
  }

  if (!pet.ownerId) {
    throw new NotFoundException('펫의 소유자를 찾을 수 없습니다.');
  }

  const { growth, sex, morphs, traits, foods, weight } = petDetail ?? {};
  const { temperature, status: eggStatus } = eggDetail ?? {};

  if (pet.isDeleted) {
    return {
      ...plainToInstance(PetSingleDto, {
        petId: pet.petId,
        species: pet.species,
        name: pet.name,
        isDeleted: pet.isDeleted,
        deletedAt: pet.deletedAt,
        deleteReason: pet.deleteReason,
        isPublic: pet.isPublic,
        isBreeder: pet.isBreeder,
        sex,
      }),
      ownerId: pet.ownerId,
    };
  }

  return {
    ...plainToInstance(PetSingleDto, {
      ...pet,
      growth,
      sex,
      morphs,
      traits,
      foods,
      weight,
      eggDetail,
      temperature,
      eggStatus,
    }),
    ownerId: pet.ownerId,
  };
}
