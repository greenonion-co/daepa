import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PetRelationEntity } from './pet_relation.entity';
import { PARENT_ROLE } from '../parent_request/parent_request.constants';
import {
  RawSiblingQueryResult,
  GetSiblingsWithDetailsDataDto,
  GetChildrenWithDetailsDataDto,
  SiblingPetDetailDto,
} from './pet_relation.dto';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { PetEntity } from '../pet/pet.entity';
import { replaceSiblingPublicSafe } from '../common/utils/pet-parent.helper';

@Injectable()
export class PetRelationService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ParentRequestService))
    private readonly parentRequestService: ParentRequestService,
  ) {}

  /**
   * 펫의 부모 관계 정보를 업데이트합니다 (Upsert)
   * @param petId - 자식 펫 ID
   * @param role - 부모 역할 (FATHER | MOTHER)
   * @param parentPetId - 부모 펫 ID
   * @param manager - 선택적 EntityManager (외부 트랜잭션 지원)
   */
  async upsertParentRelation(
    petId: string,
    role: PARENT_ROLE,
    parentPetId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      // 기존 레코드 조회
      const existing = await em.findOne(PetRelationEntity, {
        where: { petId },
      });

      if (existing) {
        // UPDATE: 기존 레코드의 father_id 또는 mother_id만 업데이트
        const updateData: Partial<PetRelationEntity> = {};
        if (role === PARENT_ROLE.FATHER) {
          updateData.fatherId = parentPetId;
        } else if (role === PARENT_ROLE.MOTHER) {
          updateData.motherId = parentPetId;
        }

        await em.update(PetRelationEntity, { petId }, updateData);
      } else {
        // INSERT: 새 레코드 생성
        const newRelation: Partial<PetRelationEntity> = {
          petId,
          fatherId: role === PARENT_ROLE.FATHER ? parentPetId : null,
          motherId: role === PARENT_ROLE.MOTHER ? parentPetId : null,
        };

        await em.save(PetRelationEntity, newRelation);
      }
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  /**
   * 펫의 부모 관계 정보를 조회합니다
   * @param petId - 펫 ID
   * @param manager - 선택적 EntityManager
   */
  async getPetRelation(
    petId: string,
    manager?: EntityManager,
  ): Promise<PetRelationEntity | null> {
    const run = async (em: EntityManager) => {
      return em.findOne(PetRelationEntity, {
        where: { petId },
      });
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }

  /**
   * 펫의 특정 부모 관계를 제거합니다 (NULL로 설정)
   * @param petId - 자식 펫 ID
   * @param role - 제거할 부모 역할 (FATHER | MOTHER)
   * @param manager - 선택적 EntityManager (외부 트랜잭션 지원)
   */
  async removeParentRelation(
    petId: string,
    role: PARENT_ROLE,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      // 기존 레코드 조회
      const existing = await em.findOne(PetRelationEntity, {
        where: { petId },
      });

      if (existing) {
        // 제거할 부모 결정
        const newFatherId =
          role === PARENT_ROLE.FATHER ? null : existing.fatherId;
        const newMotherId =
          role === PARENT_ROLE.MOTHER ? null : existing.motherId;

        // 양쪽 부모가 모두 NULL이 되면 레코드 삭제
        if (!newFatherId && !newMotherId) {
          await em.delete(PetRelationEntity, { petId });
        } else {
          // 한쪽 부모만 NULL이면 UPDATE
          const updateData: Partial<PetRelationEntity> = {};
          if (role === PARENT_ROLE.FATHER) {
            updateData.fatherId = null;
          } else if (role === PARENT_ROLE.MOTHER) {
            updateData.motherId = null;
          }
          await em.update(PetRelationEntity, { petId }, updateData);
        }
      }
      // 레코드가 없으면 아무 작업도 하지 않음
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  /**
   * 특정 펫의 자식 펫들을 모든 관련 정보와 함께 조회
   * @param petId - 부모 펫 ID
   * @param userId - 요청 사용자 ID
   * @param manager - 선택적 EntityManager
   * @returns 자식 펫들의 상세 정보
   */
  async getChildrenWithDetails(
    petId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<GetChildrenWithDetailsDataDto> {
    const run = async (em: EntityManager) => {
      // 부모 펫 조회로 ownerId 획득
      const parentPet = await em.findOne(PetEntity, { where: { petId } });
      if (!parentPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      // 자식 펫 조회: father_id 또는 mother_id가 대상 펫인 경우
      const queryBuilder = em
        .createQueryBuilder(PetRelationEntity, 'pr')
        .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
        .leftJoin('pet_details', 'pd', 'pd.pet_id = pr.pet_id')
        .leftJoin('users', 'u', 'u.user_id = p.owner_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
        .leftJoin('matings', 'm', 'm.id = l.mating_id')
        .select([
          // pet_relations
          'pr.pet_id as petId',
          // pets
          'p.name as name',
          'p.species as species',
          'p.hatching_date as hatchingDate',
          'p.laying_id as layingId',
          'p.type as type',
          'p.owner_id as ownerId',
          'p.is_public as isPublic',
          'p.is_deleted as isDeleted',
          // pet_details
          'pd.sex as sex',
          'pd.morphs as morphs',
          'pd.traits as traits',
          'pd.weight as weight',
          'pd.growth as growth',
          // users (owner)
          'u.user_id as owner_userId',
          'u.name as owner_name',
          'u.role as owner_role',
          'u.is_biz as owner_isBiz',
          'u.status as owner_status',
          // layings
          'l.id as laying_id',
          'l.mating_id as laying_matingId',
          'l.laying_date as laying_layingDate',
          'l.clutch as laying_clutch',
          // matings
          'm.id as mating_id',
          'm.pair_id as mating_pairId',
          'm.mating_date as mating_matingDate',
        ])
        .andWhere('p.is_deleted = :isDeleted', { isDeleted: false })
        .andWhere('(pr.father_id = :petId OR pr.mother_id = :petId)', {
          petId,
        });

      const rawChildren: RawSiblingQueryResult[] =
        await queryBuilder.getRawMany();

      // 데이터 변환 및 비공개 펫 마스킹
      const children = rawChildren.map((raw) => {
        const child = {
          petId: raw.petId,
          type: raw.type,
          name: raw.name ?? undefined,
          species: raw.species,
          hatchingDate: raw.hatchingDate ?? undefined,
          isPublic: raw.isPublic,
          isDeleted: raw.isDeleted,
          owner: {
            userId: raw.owner_userId ?? undefined,
            name: raw.owner_name ?? undefined,
            role: raw.owner_role ?? undefined,
            isBiz: raw.owner_isBiz ?? undefined,
            status: raw.owner_status ?? undefined,
          },
          sex: raw.sex ?? undefined,
          morphs: raw.morphs ?? undefined,
          traits: raw.traits ?? undefined,
          weight: raw.weight ?? undefined,
          growth: raw.growth ?? undefined,
          laying: raw.laying_id
            ? {
                id: raw.laying_id,
                matingId: raw.laying_matingId,
                layingDate: raw.laying_layingDate,
                clutch: raw.laying_clutch,
              }
            : null,
          mating: raw.mating_id
            ? {
                id: raw.mating_id,
                pairId: raw.mating_pairId,
                matingDate: raw.mating_matingDate,
              }
            : null,
        } as SiblingPetDetailDto;

        return replaceSiblingPublicSafe(child, userId);
      });

      return { children };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }

  /**
   * 특정 펫의 형제 펫들을 모든 관련 정보와 함께 조회
   * @param petId - 대상 펫 ID
   * @param userId - 요청 사용자 ID
   * @param manager - 선택적 EntityManager
   * @returns 형제 펫들의 상세 정보
   */
  async getSiblingsWithDetails(
    petId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<GetSiblingsWithDetailsDataDto> {
    const run = async (em: EntityManager) => {
      // Step 1: 대상 펫의 부모 정보 조회 (형제 찾기용)
      const { father: rawFather, mother: rawMother } =
        await this.parentRequestService.getParentsWithRequestStatus(petId, em);

      // pet 조회
      const pet = await em.findOne(PetEntity, { where: { petId } });
      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (!rawFather && !rawMother) {
        return { siblings: [] };
      }

      // Step 2: 모든 형제 펫 정보를 한 번에 조회 (JOIN 사용)
      const queryBuilder = em
        .createQueryBuilder(PetRelationEntity, 'pr')
        .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
        .leftJoin('pet_details', 'pd', 'pd.pet_id = pr.pet_id')
        .leftJoin('users', 'u', 'u.user_id = p.owner_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
        .leftJoin('matings', 'm', 'm.id = l.mating_id')
        .select([
          // pet_relations
          'pr.pet_id as petId',
          // pets
          'p.name as name',
          'p.species as species',
          'p.hatching_date as hatchingDate',
          'p.laying_id as layingId',
          'p.type as type',
          'p.owner_id as ownerId',
          'p.is_public as isPublic',
          'p.is_deleted as isDeleted',
          // pet_details
          'pd.sex as sex',
          'pd.morphs as morphs',
          'pd.traits as traits',
          'pd.weight as weight',
          'pd.growth as growth',
          // users (owner)
          'u.user_id as owner_userId',
          'u.name as owner_name',
          'u.role as owner_role',
          'u.is_biz as owner_isBiz',
          'u.status as owner_status',
          // layings
          'l.id as laying_id',
          'l.mating_id as laying_matingId',
          'l.laying_date as laying_layingDate',
          'l.clutch as laying_clutch',
          // matings
          'm.id as mating_id',
          'm.pair_id as mating_pairId',
          'm.mating_date as mating_matingDate',
        ])
        .andWhere('p.is_deleted = :isDeleted', { isDeleted: false });

      // fatherId 조건 (null 처리)
      if (rawFather) {
        queryBuilder.andWhere('pr.father_id = :fatherId', {
          fatherId: rawFather.petId,
        });
      } else {
        queryBuilder.andWhere('pr.father_id IS NULL');
      }

      // motherId 조건 (null 처리)
      if (rawMother) {
        queryBuilder.andWhere('pr.mother_id = :motherId', {
          motherId: rawMother.petId,
        });
      } else {
        queryBuilder.andWhere('pr.mother_id IS NULL');
      }

      const rawSiblings: RawSiblingQueryResult[] =
        await queryBuilder.getRawMany();

      // Step 3: 데이터 변환 및 비공개 펫 마스킹
      const siblings = rawSiblings.map((raw) => {
        const sibling = {
          petId: raw.petId,
          type: raw.type,
          name: raw.name ?? undefined,
          species: raw.species,
          hatchingDate: raw.hatchingDate ?? undefined,
          isPublic: raw.isPublic,
          isDeleted: raw.isDeleted,
          owner: {
            userId: raw.owner_userId ?? undefined,
            name: raw.owner_name ?? undefined,
            role: raw.owner_role ?? undefined,
            isBiz: raw.owner_isBiz ?? undefined,
            status: raw.owner_status ?? undefined,
          },
          sex: raw.sex ?? undefined,
          morphs: raw.morphs ?? undefined,
          traits: raw.traits ?? undefined,
          weight: raw.weight ?? undefined,
          growth: raw.growth ?? undefined,
          laying: raw.laying_id
            ? {
                id: raw.laying_id,
                matingId: raw.laying_matingId,
                layingDate: raw.laying_layingDate,
                clutch: raw.laying_clutch,
              }
            : null,
          mating: raw.mating_id
            ? {
                id: raw.mating_id,
                pairId: raw.mating_pairId,
                matingDate: raw.mating_matingDate,
              }
            : null,
        } as SiblingPetDetailDto;

        return replaceSiblingPublicSafe(sibling, userId);
      });

      return { siblings };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
