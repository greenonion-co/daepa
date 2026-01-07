import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource, EntityManager, Brackets } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetRelationEntity } from './pet_relation.entity';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from '../parent_request/parent_request.constants';
import {
  RawSiblingQueryResult,
  RawChildQueryResult,
  ChildPetDetailDto,
  GetChildrenPageResponseDto,
  GetSiblingsPageResponseDto,
  GetClutchMatesResponseDto,
  GetSiblingsQueryDto,
  GetClutchMatesQueryDto,
} from './pet_relation.dto';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { PetEntity } from '../pet/pet.entity';
import { replaceSiblingPublicSafe } from '../common/utils/pet-parent.helper';
import { PageOptionsDto, PageMetaDto } from '../common/page.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';

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
   * 특정 펫의 자식 펫들을 모든 관련 정보와 함께 조회 (페이지네이션)
   * @param petId - 부모 펫 ID
   * @param userId - 요청 사용자 ID
   * @param pageOptionsDto - 페이지네이션 옵션
   * @param manager - 선택적 EntityManager
   * @returns 자식 펫들의 상세 정보 (페이지네이션)
   */
  async getChildrenWithDetails(
    petId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
    manager?: EntityManager,
  ): Promise<GetChildrenPageResponseDto> {
    const run = async (em: EntityManager) => {
      // 부모 펫 조회
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
        .select([
          // pet_relations
          'pr.pet_id as petId',
          // pets
          'p.name as name',
          'p.species as species',
          'p.hatching_date as hatchingDate',
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
        ])
        .andWhere('p.is_deleted = :isDeleted', { isDeleted: false })
        .andWhere('(pr.father_id = :petId OR pr.mother_id = :petId)', {
          petId,
        });

      // 총 개수 조회 (페이지네이션 적용 전)
      const totalCount = await queryBuilder.getCount();

      // 정렬 및 페이지네이션 (getRawMany에서는 offset/limit 사용)
      queryBuilder
        .orderBy('p.hatching_date', pageOptionsDto.order)
        .offset(pageOptionsDto.skip)
        .limit(pageOptionsDto.itemPerPage);

      // 데이터 조회
      const rawChildren: RawChildQueryResult[] =
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
        } as ChildPetDetailDto;

        return replaceSiblingPublicSafe(child, userId);
      });

      const meta = new PageMetaDto({ pageOptionsDto, totalCount });

      return { data: children, meta };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }

  /**
   * 특정 펫의 형제 펫들을 모든 관련 정보와 함께 조회 (페이지네이션)
   * @param petId - 대상 펫 ID
   * @param userId - 요청 사용자 ID
   * @param queryDto - 쿼리 옵션 (페이지네이션 + type 필터)
   * @param manager - 선택적 EntityManager
   * @returns 형제 펫들의 상세 정보 (페이지네이션)
   */
  async getSiblingsWithDetails(
    petId: string,
    userId: string,
    queryDto: GetSiblingsQueryDto,
    manager?: EntityManager,
  ): Promise<GetSiblingsPageResponseDto> {
    const run = async (em: EntityManager) => {
      // Step 1: 대상 펫의 승인된 부모 정보 조회 (형제 찾기용)
      const { father: rawFather, mother: rawMother } =
        await this.parentRequestService.getParentsWithRequestStatus(
          petId,
          { statuses: [PARENT_STATUS.APPROVED] },
          em,
        );

      // pet 조회
      const pet = await em.findOne(PetEntity, { where: { petId } });
      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (!rawFather && !rawMother) {
        const emptyMeta = new PageMetaDto({
          pageOptionsDto: queryDto,
          totalCount: 0,
        });
        return { data: [], meta: emptyMeta };
      }

      // Step 2: 모든 형제 펫 정보를 한 번에 조회 (JOIN 사용)
      const queryBuilder = em
        .createQueryBuilder(PetRelationEntity, 'pr')
        .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
        .leftJoin('pet_details', 'pd', 'pd.pet_id = pr.pet_id')
        .leftJoin('users', 'u', 'u.user_id = p.owner_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
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
          'l.laying_date as laying_layingDate',
        ])
        .andWhere('p.is_deleted = :isDeleted', { isDeleted: false });

      // type 조건 (옵션)
      if (queryDto.type) {
        queryBuilder.andWhere('p.type = :type', { type: queryDto.type });
      }

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

      // 총 개수 조회 (페이지네이션 적용 전)
      const totalCount = await queryBuilder.getCount();

      // 정렬 및 페이지네이션 (getRawMany에서는 offset/limit 사용)
      queryBuilder
        .orderBy('p.hatching_date', queryDto.order)
        .offset(queryDto.skip)
        .limit(queryDto.itemPerPage);

      // 데이터 조회
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
        } as PetSummaryDto;

        return replaceSiblingPublicSafe(sibling, userId);
      });

      const pageMetaDto = new PageMetaDto({
        totalCount,
        pageOptionsDto: queryDto,
      });

      return { data: siblings, meta: pageMetaDto };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }

  /**
   * 특정 펫의 클러치 메이트를 조회합니다 (페이지네이션 없음)
   * 클러치 메이트 조건: 같은 부모(father_id, mother_id)를 가진 펫들
   * @param petId - 대상 펫 ID
   * @param userId - 요청 사용자 ID
   * @param queryDto - 쿼리 옵션 (type 필터)
   * @param manager - 선택적 EntityManager
   * @returns 클러치 메이트 상세 정보
   */
  async getClutchMatesByPetId(
    petId: string,
    userId: string,
    queryDto?: GetClutchMatesQueryDto,
    manager?: EntityManager,
  ): Promise<GetClutchMatesResponseDto> {
    const run = async (em: EntityManager) => {
      // CTE: 대상 펫의 부모 및 클러치 정보
      const targetPetCte = em
        .createQueryBuilder(PetEntity, 'p')
        .leftJoin('pet_relations', 'pr', 'pr.pet_id = p.pet_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
        .select('pr.father_id', 'father_id')
        .addSelect('pr.mother_id', 'mother_id')
        .addSelect('p.laying_id', 'laying_id')
        .addSelect('p.hatching_date', 'hatching_date')
        .addSelect('l.laying_date', 'laying_date')
        .where('p.pet_id = :petId', { petId });

      // 단일 쿼리: CTE를 사용하여 클러치 메이트 조회
      const queryBuilder = em
        .createQueryBuilder()
        .addCommonTableExpression(targetPetCte, 'target_pet')
        .from('target_pet', 'tp')
        // 클러치 메이트 정보
        .select('p.pet_id', 'petId')
        .addSelect('p.name', 'name')
        .addSelect('p.species', 'species')
        .addSelect('p.hatching_date', 'hatchingDate')
        .addSelect('p.type', 'type')
        .addSelect('p.is_public', 'isPublic')
        .addSelect('p.is_deleted', 'isDeleted')
        .addSelect('pd.sex', 'sex')
        .addSelect('pd.morphs', 'morphs')
        .addSelect('pd.traits', 'traits')
        .addSelect('pd.weight', 'weight')
        .addSelect('pd.growth', 'growth')
        .addSelect('u.user_id', 'owner_userId')
        .addSelect('u.name', 'owner_name')
        .addSelect('u.role', 'owner_role')
        .addSelect('u.is_biz', 'owner_isBiz')
        .addSelect('u.status', 'owner_status')
        // JOIN
        .innerJoin(
          'pet_relations',
          'pr',
          'pr.father_id = tp.father_id AND pr.mother_id = tp.mother_id AND pr.pet_id != :petId',
          { petId },
        )
        .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id AND p.is_deleted = false')
        .leftJoin('pet_details', 'pd', 'pd.pet_id = p.pet_id')
        .leftJoin('users', 'u', 'u.user_id = p.owner_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
        // 클러치 조건:  layingId, hatchingDate 중 하나가 같아야 함
        .where(
          new Brackets((qb) => {
            qb.where(
              'tp.laying_id IS NOT NULL AND p.laying_id = tp.laying_id',
            ).orWhere(
              'tp.hatching_date IS NOT NULL AND p.hatching_date = tp.hatching_date',
            );
          }),
        )
        // 부모 정보가 있는 경우만
        .andWhere('tp.father_id IS NOT NULL')
        .andWhere('tp.mother_id IS NOT NULL')
        .orderBy('p.hatching_date', 'DESC');

      // type 필터 (옵션)
      if (queryDto?.type) {
        queryBuilder.andWhere('p.type = :type', { type: queryDto.type });
      }

      const rawResults: RawSiblingQueryResult[] =
        await queryBuilder.getRawMany();

      // 데이터 변환 및 비공개 펫 마스킹
      const clutchMates = rawResults.map((raw) => {
        const mate = plainToInstance(PetSummaryDto, {
          petId: raw.petId,
          type: raw.type,
          name: raw.name ?? undefined,
          species: raw.species,
          hatchingDate: raw.hatchingDate ?? undefined,
          isPublic: raw.isPublic,
          isDeleted: raw.isDeleted,
          owner: raw.owner_userId
            ? {
                userId: raw.owner_userId,
                name: raw.owner_name ?? undefined,
                role: raw.owner_role ?? undefined,
                isBiz: raw.owner_isBiz ?? undefined,
                status: raw.owner_status ?? undefined,
              }
            : undefined,
          sex: raw.sex ?? undefined,
          morphs: raw.morphs ?? undefined,
          traits: raw.traits ?? undefined,
          weight: raw.weight ?? undefined,
          growth: raw.growth ?? undefined,
        });

        return replaceSiblingPublicSafe(mate, userId);
      });

      return { data: clutchMates };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
