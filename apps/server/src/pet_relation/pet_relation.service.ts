import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Brackets } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetRelationEntity } from './pet_relation.entity';
import { PARENT_ROLE } from '../parent_request/parent_request.constants';
import {
  RawFamilyTreeQueryResult,
  RawSiblingQueryResult,
  RawChildQueryResult,
  ChildPetDetailDto,
  GetChildrenPageResponseDto,
  GetSiblingsPageResponseDto,
  GetClutchMatesResponseDto,
  GetSiblingsQueryDto,
  GetClutchMatesQueryDto,
  FamilyTreeNodeDto,
  GetFamilyTreeResponseDto,
} from './pet_relation.dto';
import { PetEntity } from '../pet/pet.entity';
import { replaceSiblingPublicSafe } from '../common/utils/pet-parent.helper';
import { PageOptionsDto, PageMetaDto } from '../common/page.dto';
import { PetSummaryDto, PetHiddenStatusDto } from 'src/pet/pet.dto';
import { PET_HIDDEN_STATUS } from 'src/pet/pet.constants';
import { PET_TYPE } from '../pet/pet.constants';
import { CacheService } from '../common/cache.service';
import { CACHE } from '../common/cache-keys';
import { loadPetData } from '../pet/pet.loader';

@Injectable()
export class PetRelationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
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
        .andWhere('p.type = :type AND p.is_deleted = :isDeleted', {
          type: PET_TYPE.PET,
          isDeleted: false,
        })
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
    // 트랜잭션 컨텍스트에서는 캐시 우회
    if (manager) {
      return this.getSiblingsDirect(petId, userId, queryDto, manager);
    }

    // 1. 관계 캐시: 형제 petId + 정렬/필터용 메타 (구조적 데이터)
    const siblingEntries = await this.cacheService.wrap(
      CACHE.siblings.key(petId),
      () => this.findSiblingEntries(petId),
      CACHE.siblings.ttl,
    );

    if (!siblingEntries.length) {
      return {
        data: [],
        meta: new PageMetaDto({ pageOptionsDto: queryDto, totalCount: 0 }),
      };
    }

    // 2. 메모리에서 필터 → 삭제 제거 → 정렬 → totalCount → 페이지 슬라이스
    let filtered = siblingEntries;
    if (queryDto.type) {
      const typeFilter = queryDto.type as string;
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    // 전체 항목의 pet 캐시 조회 (삭제 여부 판별용)
    const allPetDataResults = await Promise.all(
      filtered.map((entry) =>
        this.cacheService
          .wrap(
            CACHE.pet.key(entry.petId),
            () => loadPetData(this.dataSource.manager, entry.petId),
            CACHE.pet.ttl,
          )
          .then((data) => [entry.petId, data] as const),
      ),
    );
    const allPetDataMap = new Map(allPetDataResults);

    // 삭제된 펫 제거 후 정렬 → 페이지네이션
    filtered = filtered.filter((e) => {
      const petData = allPetDataMap.get(e.petId);
      return petData && !petData.isDeleted;
    });

    const order = queryDto.order as string;
    filtered.sort((a, b) => {
      const aTime = a.hatchingDate ? new Date(a.hatchingDate).getTime() : 0;
      const bTime = b.hatchingDate ? new Date(b.hatchingDate).getTime() : 0;
      return order === 'ASC' ? aTime - bTime : bTime - aTime;
    });

    const totalCount = filtered.length;
    const pageSlice = filtered.slice(
      queryDto.skip,
      queryDto.skip + queryDto.itemPerPage,
    );

    // 3. 페이지 항목의 pet 데이터 (이미 캐시에서 로드 완료)
    const petDataMap = new Map(
      pageSlice
        .map((entry) => [entry.petId, allPetDataMap.get(entry.petId)] as const)
        .filter(([, data]) => !!data),
    );

    // owner 배치 조회
    const ownerIds = [
      ...new Set(
        [...petDataMap.values()].map((p) => p!.ownerId).filter(Boolean),
      ),
    ];
    const ownerMap = new Map<
      string,
      {
        userId: string;
        name: string | null;
        role: string | null;
        isBiz: boolean | null;
        status: string | null;
      }
    >();
    if (ownerIds.length) {
      const owners = await this.dataSource
        .createQueryBuilder()
        .select('u.user_id', 'userId')
        .addSelect('u.name', 'name')
        .addSelect('u.role', 'role')
        .addSelect('u.is_biz', 'isBiz')
        .addSelect('u.status', 'status')
        .from('users', 'u')
        .where('u.user_id IN (:...ownerIds)', { ownerIds })
        .getRawMany<{
          userId: string;
          name: string | null;
          role: string | null;
          isBiz: boolean | null;
          status: string | null;
        }>();
      for (const o of owners) {
        ownerMap.set(o.userId, o);
      }
    }

    // 4. DTO 조립 + privacy 마스킹
    const data: (
      | PetSummaryDto
      | { petId: string; hiddenStatus: PET_HIDDEN_STATUS }
    )[] = [];

    for (const entry of pageSlice) {
      const petData = petDataMap.get(entry.petId);
      if (!petData) continue;

      const owner = ownerMap.get(petData.ownerId);
      const sibling = plainToInstance(PetSummaryDto, {
        petId: petData.petId,
        type: petData.type,
        name: petData.name,
        species: petData.species,
        hatchingDate: petData.hatchingDate,
        isPublic: petData.isPublic,
        isDeleted: petData.isDeleted,
        owner: owner
          ? {
              userId: owner.userId,
              name: owner.name,
              role: owner.role,
              isBiz: owner.isBiz,
              status: owner.status,
            }
          : undefined,
        sex: petData.sex,
        morphs: petData.morphs,
        traits: petData.traits,
        weight: petData.weight,
        growth: petData.growth,
      });

      data.push(replaceSiblingPublicSafe(sibling, userId));
    }

    return {
      data,
      meta: new PageMetaDto({ pageOptionsDto: queryDto, totalCount }),
    };
  }

  /**
   * 형제 petId + 정렬/필터용 메타 조회 (관계 캐시 fallback)
   * is_deleted 필터 없이 조회 — 삭제 여부는 pet 캐시에서 처리
   */
  private async findSiblingEntries(
    petId: string,
  ): Promise<{ petId: string; type: string; hatchingDate: string | null }[]> {
    const em = this.dataSource.manager;

    const relation = await em.findOne(PetRelationEntity, {
      where: { petId },
    });

    const fatherId = relation?.fatherId ?? null;
    const motherId = relation?.motherId ?? null;

    if (!fatherId && !motherId) return [];

    const qb = em
      .createQueryBuilder(PetRelationEntity, 'pr')
      .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
      .select('pr.pet_id', 'petId')
      .addSelect('p.type', 'type')
      .addSelect('p.hatching_date', 'hatchingDate');

    if (fatherId) {
      qb.andWhere('pr.father_id = :fatherId', { fatherId });
    } else {
      qb.andWhere('pr.father_id IS NULL');
    }

    if (motherId) {
      qb.andWhere('pr.mother_id = :motherId', { motherId });
    } else {
      qb.andWhere('pr.mother_id IS NULL');
    }

    // 자기 자신 제외
    qb.andWhere('pr.pet_id != :petId', { petId });

    return qb.getRawMany<{
      petId: string;
      type: string;
      hatchingDate: string | null;
    }>();
  }

  /** 캐시 우회 — 트랜잭션 컨텍스트용 기존 JOIN 쿼리 */
  private async getSiblingsDirect(
    petId: string,
    userId: string,
    queryDto: GetSiblingsQueryDto,
    manager?: EntityManager,
  ): Promise<GetSiblingsPageResponseDto> {
    const run = async (em: EntityManager) => {
      const relation = await em.findOne(PetRelationEntity, {
        where: { petId },
      });

      const fatherId = relation?.fatherId ?? null;
      const motherId = relation?.motherId ?? null;

      if (!fatherId && !motherId) {
        return {
          data: [],
          meta: new PageMetaDto({ pageOptionsDto: queryDto, totalCount: 0 }),
        };
      }

      const queryBuilder = em
        .createQueryBuilder(PetRelationEntity, 'pr')
        .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
        .leftJoin('pet_details', 'pd', 'pd.pet_id = pr.pet_id')
        .leftJoin('users', 'u', 'u.user_id = p.owner_id')
        .leftJoin('layings', 'l', 'l.id = p.laying_id')
        .select([
          'pr.pet_id as petId',
          'p.name as name',
          'p.species as species',
          'p.hatching_date as hatchingDate',
          'p.laying_id as layingId',
          'p.type as type',
          'p.owner_id as ownerId',
          'p.is_public as isPublic',
          'p.is_deleted as isDeleted',
          'pd.sex as sex',
          'pd.morphs as morphs',
          'pd.traits as traits',
          'pd.weight as weight',
          'pd.growth as growth',
          'u.user_id as owner_userId',
          'u.name as owner_name',
          'u.role as owner_role',
          'u.is_biz as owner_isBiz',
          'u.status as owner_status',
          'l.id as laying_id',
          'l.laying_date as laying_layingDate',
        ])
        .andWhere('p.is_deleted = :isDeleted', { isDeleted: false });

      if (queryDto.type) {
        queryBuilder.andWhere('p.type = :type', { type: queryDto.type });
      }

      if (fatherId) {
        queryBuilder.andWhere('pr.father_id = :fatherId', { fatherId });
      } else {
        queryBuilder.andWhere('pr.father_id IS NULL');
      }

      if (motherId) {
        queryBuilder.andWhere('pr.mother_id = :motherId', { motherId });
      } else {
        queryBuilder.andWhere('pr.mother_id IS NULL');
      }

      const totalCount = await queryBuilder.getCount();

      queryBuilder
        .orderBy('p.hatching_date', queryDto.order)
        .offset(queryDto.skip)
        .limit(queryDto.itemPerPage);

      const rawSiblings: RawSiblingQueryResult[] =
        await queryBuilder.getRawMany();

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

      return {
        data: siblings,
        meta: new PageMetaDto({ pageOptionsDto: queryDto, totalCount }),
      };
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
    // 트랜잭션 컨텍스트에서는 캐시 우회
    if (manager) {
      return this.getClutchMatesDirect(petId, userId, queryDto, manager);
    }

    // 1. 관계 캐시: 클러치 메이트 petId 목록 (구조적 데이터)
    const clutchMateIds = await this.cacheService.wrap(
      CACHE.clutchMates.key(petId),
      () => this.findClutchMateIds(petId),
      CACHE.clutchMates.ttl,
    );

    if (!clutchMateIds.length) {
      return { data: [] };
    }

    // 2. pet 캐시 + owner 조회 + privacy 마스킹 (N≈1)
    const data: (
      | PetSummaryDto
      | { petId: string; hiddenStatus: PET_HIDDEN_STATUS }
    )[] = [];

    for (const clutchMateId of clutchMateIds) {
      const petData = await this.cacheService.wrap(
        CACHE.pet.key(clutchMateId),
        () => loadPetData(this.dataSource.manager, clutchMateId),
        CACHE.pet.ttl,
      );

      if (!petData || petData.isDeleted) continue;
      if (queryDto?.type && petData.type !== queryDto.type) continue;

      // owner 조회 (N≈1이므로 1회)
      const owner = await this.dataSource
        .createQueryBuilder()
        .select('u.user_id', 'userId')
        .addSelect('u.name', 'name')
        .addSelect('u.role', 'role')
        .addSelect('u.is_biz', 'isBiz')
        .addSelect('u.status', 'status')
        .from('users', 'u')
        .where('u.user_id = :ownerId', { ownerId: petData.ownerId })
        .getRawOne<{
          userId: string;
          name: string | null;
          role: string | null;
          isBiz: boolean | null;
          status: string | null;
        }>();

      const clutchMate = plainToInstance(PetSummaryDto, {
        petId: petData.petId,
        type: petData.type,
        name: petData.name,
        species: petData.species,
        hatchingDate: petData.hatchingDate,
        isPublic: petData.isPublic,
        isDeleted: petData.isDeleted,
        owner: owner
          ? {
              userId: owner.userId,
              name: owner.name,
              role: owner.role,
              isBiz: owner.isBiz,
              status: owner.status,
            }
          : undefined,
        sex: petData.sex,
        morphs: petData.morphs,
        traits: petData.traits,
        weight: petData.weight,
        growth: petData.growth,
      });

      data.push(replaceSiblingPublicSafe(clutchMate, userId));
    }

    return { data };
  }

  /**
   * 클러치 메이트 petId 목록 조회 (관계 캐시 fallback)
   * is_deleted 필터 없이 조회 — 삭제 여부는 pet 캐시에서 처리
   */
  private async findClutchMateIds(petId: string): Promise<string[]> {
    const em = this.dataSource.manager;

    const targetPet = await em
      .createQueryBuilder(PetEntity, 'p')
      .leftJoin('pet_relations', 'pr', 'pr.pet_id = p.pet_id')
      .select('pr.father_id', 'fatherId')
      .addSelect('pr.mother_id', 'motherId')
      .addSelect('p.laying_id', 'layingId')
      .addSelect('p.hatching_date', 'hatchingDate')
      .where('p.pet_id = :petId', { petId })
      .getRawOne<{
        fatherId: string | null;
        motherId: string | null;
        layingId: number | null;
        hatchingDate: Date | null;
      }>();

    if (!targetPet?.fatherId || !targetPet?.motherId) return [];

    const conditions: string[] = [];
    const params: Record<string, string | number | Date> = {
      fatherId: targetPet.fatherId,
      motherId: targetPet.motherId,
      petId,
    };

    if (targetPet.layingId != null) {
      conditions.push('p.laying_id = :layingId');
      params.layingId = targetPet.layingId;
    }
    if (targetPet.hatchingDate != null) {
      conditions.push('p.hatching_date = :hatchingDate');
      params.hatchingDate = targetPet.hatchingDate;
    }

    if (!conditions.length) return [];

    const rawResults = await em
      .createQueryBuilder()
      .select('pr.pet_id', 'petId')
      .from('pet_relations', 'pr')
      .innerJoin('pets', 'p', 'p.pet_id = pr.pet_id')
      .where('pr.father_id = :fatherId')
      .andWhere('pr.mother_id = :motherId')
      .andWhere('pr.pet_id != :petId')
      .andWhere(`(${conditions.join(' OR ')})`)
      .setParameters(params)
      .getRawMany<{ petId: string }>();

    return rawResults.map((r) => r.petId);
  }

  /** 캐시 우회 — 트랜잭션 컨텍스트용 기존 CTE 쿼리 */
  private async getClutchMatesDirect(
    petId: string,
    userId: string,
    queryDto?: GetClutchMatesQueryDto,
    manager?: EntityManager,
  ): Promise<GetClutchMatesResponseDto> {
    const run = async (em: EntityManager) => {
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

      const queryBuilder = em
        .createQueryBuilder()
        .addCommonTableExpression(targetPetCte, 'target_pet')
        .from('target_pet', 'tp')
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
        .where(
          new Brackets((qb) => {
            qb.where(
              'tp.laying_id IS NOT NULL AND p.laying_id = tp.laying_id',
            ).orWhere(
              'tp.hatching_date IS NOT NULL AND p.hatching_date = tp.hatching_date',
            );
          }),
        )
        .andWhere('tp.father_id IS NOT NULL')
        .andWhere('tp.mother_id IS NOT NULL')
        .orderBy('p.hatching_date', 'DESC');

      if (queryDto?.type) {
        queryBuilder.andWhere('p.type = :type', { type: queryDto.type });
      }

      const rawResults: RawSiblingQueryResult[] =
        await queryBuilder.getRawMany();

      const clutchMates = rawResults.map((raw) => {
        const clutchMate = plainToInstance(PetSummaryDto, {
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

        return replaceSiblingPublicSafe(clutchMate, userId);
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

  /**
   * Recursive CTE로 특정 펫의 전체 가계도(후손 + 공동 부모)를 한 번에 조회합니다.
   * @param petId - 중심 개체 ID
   * @param userId - 요청 사용자 ID (privacy 처리용)
   * @param maxDepth - 최대 후손 탐색 깊이 (기본 2)
   * @param maxAncestorDepth - 최대 조상 탐색 깊이 (기본 2: 부모·조부모)
   * @param manager - 선택적 EntityManager
   */
  async getFamilyTree(
    petId: string,
    userId: string | null,
    maxDepth: number = 2,
    maxAncestorDepth: number = 2,
    manager?: EntityManager,
  ): Promise<GetFamilyTreeResponseDto> {
    const run = async (em: EntityManager) => {
      const rootPet = await em.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });
      if (!rootPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      // Recursive CTE: 조상(ancestor) + 후손(descendant) + 공동 부모를 한 번에 조회
      const rawResults: RawFamilyTreeQueryResult[] = await em.query(
        `
        WITH RECURSIVE
        ancestor_cte AS (
          SELECT father_id AS pet_id, 1 AS anc_depth
          FROM pet_relations
          WHERE pet_id = ? AND father_id IS NOT NULL
          UNION ALL
          SELECT mother_id AS pet_id, 1 AS anc_depth
          FROM pet_relations
          WHERE pet_id = ? AND mother_id IS NOT NULL
          UNION ALL
          SELECT pr.father_id, cte.anc_depth + 1
          FROM pet_relations pr
          INNER JOIN ancestor_cte cte ON pr.pet_id = cte.pet_id
          WHERE cte.anc_depth < ? AND pr.father_id IS NOT NULL
          UNION ALL
          SELECT pr.mother_id, cte.anc_depth + 1
          FROM pet_relations pr
          INNER JOIN ancestor_cte cte ON pr.pet_id = cte.pet_id
          WHERE cte.anc_depth < ? AND pr.mother_id IS NOT NULL
        ),

        deduped_ancestors AS (
          SELECT pet_id, MIN(anc_depth) AS anc_depth
          FROM ancestor_cte
          GROUP BY pet_id
        ),

        descendant_cte AS (
          SELECT pet_id, father_id, mother_id, 1 AS depth
          FROM pet_relations
          WHERE (father_id = ? OR mother_id = ?)

          UNION ALL

          SELECT pr.pet_id, pr.father_id, pr.mother_id, cte.depth + 1
          FROM pet_relations pr
          INNER JOIN descendant_cte cte
            ON (pr.father_id = cte.pet_id OR pr.mother_id = cte.pet_id)
          WHERE cte.depth < ?
        ),

        deduped AS (
          SELECT pet_id,
                 MAX(father_id) AS father_id,
                 MAX(mother_id) AS mother_id,
                 MIN(depth)     AS depth
          FROM descendant_cte
          GROUP BY pet_id
        ),

        all_ids AS (
          SELECT ? AS pid, 0 AS node_depth
          UNION
          SELECT pet_id, depth FROM deduped
          UNION
          SELECT DISTINCT father_id, NULL
          FROM deduped
          WHERE father_id IS NOT NULL
            AND father_id != ?
            AND father_id NOT IN (SELECT pet_id FROM deduped)
          UNION
          SELECT DISTINCT mother_id, NULL
          FROM deduped
          WHERE mother_id IS NOT NULL
            AND mother_id != ?
            AND mother_id NOT IN (SELECT pet_id FROM deduped)
          UNION
          SELECT DISTINCT
            CASE WHEN father_id = ? THEN mother_id ELSE father_id END,
            NULL
          FROM pairs
          WHERE (father_id = ? OR mother_id = ?)
            AND is_deleted = false
            AND EXISTS (SELECT 1 FROM matings m WHERE m.pair_id = pairs.id)
          UNION
          SELECT pet_id, -anc_depth
          FROM deduped_ancestors
          WHERE pet_id != ?
        )

        SELECT
          ai.pid            AS petId,
          ai.node_depth     AS depth,
          pr.father_id      AS fatherId,
          pr.mother_id      AS motherId,
          p.name,
          p.species,
          p.hatching_date   AS hatchingDate,
          p.type,
          p.is_public       AS isPublic,
          p.owner_id        AS ownerId,
          pd.sex,
          pd.morphs,
          pd.traits,
          u.name            AS ownerName
        FROM all_ids ai
        INNER JOIN pets p
          ON p.pet_id = ai.pid
          AND p.is_deleted = false
          AND p.type = 'PET'
        LEFT JOIN pet_relations pr ON pr.pet_id = ai.pid
        LEFT JOIN pet_details   pd ON pd.pet_id = ai.pid
        LEFT JOIN users         u  ON u.user_id = p.owner_id
        `,
        [
          petId,
          petId,
          maxAncestorDepth,
          maxAncestorDepth, // ancestor_cte
          petId,
          petId,
          maxDepth, // descendant_cte
          petId,
          petId,
          petId,
          petId,
          petId,
          petId, // all_ids
          petId, // exclude root from ancestors
        ],
      );

      // petId 기준 중복 제거 (조상이 다른 브랜치에 중복 포함될 수 있음)
      const seenPetIds = new Set<string>();
      const uniqueResults = rawResults.filter((raw) => {
        if (seenPetIds.has(raw.petId)) return false;
        seenPetIds.add(raw.petId);
        return true;
      });

      // pairs 테이블에서 중심 개체의 파트너 ID 목록 수집
      const pairPartnerRows: { partnerId: string }[] = await em.query(
        `SELECT CASE WHEN father_id = ? THEN mother_id ELSE father_id END AS partnerId
         FROM pairs
         WHERE (father_id = ? OR mother_id = ?)
           AND is_deleted = false
           AND EXISTS (SELECT 1 FROM matings m WHERE m.pair_id = pairs.id)
           AND (CASE WHEN father_id = ? THEN mother_id ELSE father_id END) IS NOT NULL`,
        [petId, petId, petId, petId],
      );
      const centerPairPartnerIds = [
        ...new Set(pairPartnerRows.map((r) => r.partnerId).filter(Boolean)),
      ];

      const nodes: (FamilyTreeNodeDto | PetHiddenStatusDto)[] =
        uniqueResults.map((raw) => {
          const isOwner = userId && raw.ownerId === userId;
          const isPublic = Boolean(raw.isPublic);

          // 비공개이고 본인 개체가 아니면 petId + hiddenStatus만 반환 (보안)
          if (!isPublic && !isOwner) {
            return {
              petId: raw.petId,
              hiddenStatus: PET_HIDDEN_STATUS.SECRET,
            } as PetHiddenStatusDto;
          }

          return {
            petId: raw.petId,
            fatherId: raw.fatherId ?? null,
            motherId: raw.motherId ?? null,
            depth: raw.depth !== null ? Number(raw.depth) : null,
            name: raw.name ?? undefined,
            sex: raw.sex ?? undefined,
            morphs: raw.morphs
              ? typeof raw.morphs === 'string'
                ? (JSON.parse(raw.morphs) as string[])
                : raw.morphs
              : undefined,
            traits: raw.traits
              ? typeof raw.traits === 'string'
                ? (JSON.parse(raw.traits) as string[])
                : raw.traits
              : undefined,
            species: raw.species,
            hatchingDate: raw.hatchingDate
              ? new Date(raw.hatchingDate).toISOString().split('T')[0]
              : undefined,
            type: raw.type,
            isPublic,
            isOwner: Boolean(isOwner),
            ownerName: raw.ownerName ?? undefined,
          } as FamilyTreeNodeDto;
        });

      return { nodes, centerPairPartnerIds };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
