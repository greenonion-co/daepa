import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePetDto,
  PetParentDto,
  PetSummaryDto,
  ParentWithChildrenDto,
  UpdatePetDto,
  PetFilterDto,
} from './pet.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PageOptionsDto, PageDto, PageMetaDto } from 'src/common/page.dto';
import { PetDto } from './pet.dto';
import { ParentService } from 'src/parent/parent.service';
import { ParentDto } from 'src/parent/parent.dto';
import { PARENT_ROLE } from 'src/parent/parent.constant';
import { HttpException, HttpStatus } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';
import { AdoptionEntity } from 'src/adoption/adoption.entity';

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
  ) {}

  private async generateUniquePetId(): Promise<string> {
    let attempts = 0;
    while (attempts < this.MAX_RETRIES) {
      const petId = nanoid(8);
      const existingPet = await this.petRepository.findOne({
        where: { petId },
      });
      if (!existingPet) {
        return petId;
      }
      attempts++;
    }
    throw new HttpException(
      {
        statusCode: HttpStatus.CONFLICT,
        message:
          '펫 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
      },
      HttpStatus.CONFLICT,
    );
  }

  async createPet(
    inputPetData: {
      ownerId: string;
      isHatchingFromEgg?: boolean;
    } & CreatePetDto,
  ): Promise<{ petId: string }> {
    const petId = await this.generateUniquePetId();
    const petData = plainToInstance(PetEntity, { ...inputPetData, petId });

    try {
      await this.petRepository.insert(petData);

      if (inputPetData.father) {
        await this.parentService.createParent(
          inputPetData.ownerId,
          petId,
          inputPetData.father,
          {
            isDirectApprove: inputPetData.isHatchingFromEgg,
          },
        );
      }
      if (inputPetData.mother) {
        await this.parentService.createParent(
          inputPetData.ownerId,
          petId,
          inputPetData.mother,
          {
            isDirectApprove: inputPetData.isHatchingFromEgg,
          },
        );
      }

      return { petId };
    } catch (error) {
      if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message: '이미 존재하는 펫 이름입니다.',
            },
            HttpStatus.CONFLICT,
          );
        }
      }
      throw error;
    }
  }

  async getPetList<T extends PetDto | PetSummaryDto>(
    pageOptionsDto: PageOptionsDto,
    dtoClass: new () => T,
    userId?: string,
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder(userId);

    queryBuilder
      .orderBy('pets.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const petList = entities.map((entity) => {
      const plainEntity = instanceToPlain(entity);
      plainEntity.weight = plainEntity.weight
        ? Number(plainEntity.weight)
        : undefined;
      return plainEntity;
    });
    const petDtos = petList.map((pet) => plainToInstance(dtoClass, pet));
    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return {
      data: petDtos,
      pageMeta: pageMetaDto,
    };
  }

  async getPetListFull(
    searchDto: PetFilterDto,
    userId: string,
  ): Promise<PageDto<PetDto>> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder(
      userId,
      searchDto.includeOthers,
    );

    // adoption 테이블을 LEFT JOIN으로 연결
    queryBuilder.leftJoin(
      'adoptions',
      'adoption',
      'adoption.petId = pets.petId AND adoption.isDeleted = :isDeleted',
      { isDeleted: false },
    );

    // 키워드 검색 (이름)
    if (searchDto.keyword) {
      queryBuilder.andWhere('pets.name LIKE :keyword', {
        keyword: `%${searchDto.keyword}%`,
      });
    }

    // 종별 필터
    if (searchDto.species) {
      queryBuilder.andWhere('pets.species = :species', {
        species: searchDto.species,
      });
    }

    // 성별 필터
    if (searchDto.sex) {
      queryBuilder.andWhere('pets.sex = :sex', { sex: searchDto.sex });
    }

    // 소유자별 필터
    if (searchDto.ownerId) {
      queryBuilder.andWhere('pets.ownerId = :ownerId', {
        ownerId: searchDto.ownerId,
      });
    }

    // 공개 여부 필터
    if (searchDto.isPublic !== undefined) {
      queryBuilder.andWhere('pets.isPublic = :isPublic', {
        isPublic: searchDto.isPublic,
      });
    }

    // 몸무게 범위 필터
    if (searchDto.minWeight !== undefined) {
      queryBuilder.andWhere('pets.weight >= :minWeight', {
        minWeight: searchDto.minWeight,
      });
    }
    if (searchDto.maxWeight !== undefined) {
      queryBuilder.andWhere('pets.weight <= :maxWeight', {
        maxWeight: searchDto.maxWeight,
      });
    }

    // 생년월일 범위 필터
    if (searchDto.minBirthdate !== undefined) {
      queryBuilder.andWhere('pets.birthdate >= :minBirthdate', {
        minBirthdate: searchDto.minBirthdate,
      });
    }
    if (searchDto.maxBirthdate !== undefined) {
      queryBuilder.andWhere('pets.birthdate <= :maxBirthdate', {
        maxBirthdate: searchDto.maxBirthdate,
      });
    }

    // 모프 검색 (JSON 배열에서 포함 여부 확인)
    if (searchDto.morphs && searchDto.morphs.length > 0) {
      searchDto.morphs.forEach((morph, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.morphs, :morph${index})`, {
          [`morph${index}`]: JSON.stringify(morph),
        });
      });
    }

    // 형질 검색
    if (searchDto.traits && searchDto.traits.length > 0) {
      searchDto.traits.forEach((trait, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.traits, :trait${index})`, {
          [`trait${index}`]: JSON.stringify(trait),
        });
      });
    }

    // 먹이 검색
    if (searchDto.foods) {
      queryBuilder.andWhere(`JSON_CONTAINS(pets.foods, :food)`, {
        food: JSON.stringify(searchDto.foods),
      });
    }

    // 판매 상태 검색
    if (searchDto.status) {
      queryBuilder.andWhere('adoption.status = :status', {
        status: searchDto.status,
      });
    }

    if (searchDto.growth) {
      queryBuilder.andWhere('pets.growth = :growth', {
        growth: searchDto.growth,
      });
    }

    // 정렬 및 페이징
    queryBuilder
      .orderBy('pets.createdAt', searchDto.order)
      .skip(searchDto.skip)
      .take(searchDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const petDtos = entities.map((pet) => plainToInstance(PetDto, pet));

    if (petDtos.length === 0) {
      const pageMetaDto = new PageMetaDto({
        totalCount,
        pageOptionsDto: searchDto,
      });
      return new PageDto([], pageMetaDto);
    }

    const petIds = petDtos.map((pet) => pet.petId);

    // 배치로 부모 정보 조회
    const [fathers, mothers] = await Promise.all([
      this.getParentsBatch(petIds, PARENT_ROLE.FATHER),
      this.getParentsBatch(petIds, PARENT_ROLE.MOTHER),
    ]);

    // 배치로 분양 정보 조회
    const adoptions = await this.getAdoptionsBatch(petIds);

    const petListFullWithParent = petDtos.map((pet) => {
      // 부모 정보 매핑
      const father = fathers.find((f) => f.petId === pet.petId);
      if (father) {
        pet.father = plainToInstance(PetParentDto, father);
      }

      const mother = mothers.find((m) => m.petId === pet.petId);
      if (mother) {
        pet.mother = plainToInstance(PetParentDto, mother);
      }

      // 분양 정보 매핑
      const adoption = adoptions.find((a) => a.petId === pet.petId);
      if (adoption) {
        pet.adoption = {
          adoptionId: adoption.adoptionId,
          price: adoption.price
            ? Math.floor(Number(adoption.price))
            : undefined,
          adoptionDate: adoption.adoptionDate,
          memo: adoption.memo,
          buyerId: adoption.buyerId,
          status: adoption.status,
        };
      }

      return pet;
    });

    const pageMetaDto = new PageMetaDto({
      totalCount,
      pageOptionsDto: searchDto,
    });
    return new PageDto(petListFullWithParent, pageMetaDto);
  }

  async getPetListSummary(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetSummaryDto>> {
    const { data, pageMeta } = await this.getPetList<PetSummaryDto>(
      pageOptionsDto,
      PetSummaryDto,
    );
    return new PageDto(data, pageMeta);
  }

  async getPet(petId: string): Promise<PetDto | null> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder();
    const petEntity = await queryBuilder
      .where('pets.petId = :petId', { petId })
      .getOne();

    if (!petEntity) {
      return null;
    }

    const pet = instanceToPlain(petEntity);

    if (typeof pet.petId === 'string') {
      pet.father = await this.getParent(pet.petId, PARENT_ROLE.FATHER);
    }
    if (typeof pet.petId === 'string') {
      pet.mother = await this.getParent(pet.petId, PARENT_ROLE.MOTHER);
    }

    if (typeof pet.petId === 'string') {
      const adoptionEntity = await this.adoptionRepository.findOne({
        where: {
          petId: pet.petId,
          isDeleted: false,
        },
      });
      if (adoptionEntity) {
        pet.adoption = {
          adoptionId: adoptionEntity.adoptionId,
          price: adoptionEntity.price
            ? Math.floor(Number(adoptionEntity.price))
            : undefined,
          adoptionDate: adoptionEntity.adoptionDate,
          memo: adoptionEntity.memo,
          buyerId: adoptionEntity.buyerId,
          status: adoptionEntity.status,
        };
      }
    }

    const petDto = plainToInstance(PetDto, pet);
    return petDto;
  }

  async getPetName(petId: string): Promise<string | null> {
    // TODO: hidden 펫 제외
    const result = await this.petRepository
      .createQueryBuilder('pets')
      .select('pets.name')
      .where('pets.petId = :petId', { petId })
      .getOne();

    return result?.name ?? null;
  }

  async updatePet(
    userId: string,
    petId: string,
    updatePetDto: UpdatePetDto,
  ): Promise<void> {
    const { father, mother, ...updateData } = updatePetDto;

    const updatePet = instanceToPlain(updateData);
    const updatePetEntity = plainToInstance(PetEntity, updatePet);
    await this.petRepository.update({ petId }, updatePetEntity);

    if (father) {
      await this.parentService.createParent(userId, petId, father, {});
    }
    if (mother) {
      await this.parentService.createParent(userId, petId, mother, {});
    }
  }

  async deletePet(petId: string): Promise<DeleteResult> {
    return await this.petRepository.update({ petId }, { isDeleted: true });
  }

  async getPetSummary(petId: string): Promise<PetSummaryDto | null> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder();
    const petEntity = await queryBuilder
      .where('pets.petId = :petId', { petId })
      .getOne();

    if (!petEntity) {
      return null;
    }

    const pet = instanceToPlain(petEntity);

    return plainToInstance(PetSummaryDto, pet);
  }

  private async getParent(
    petId: string,
    role: PARENT_ROLE,
  ): Promise<Partial<ParentDto> | null> {
    const parentInfo = await this.parentService.findOne(petId, {
      role,
    });
    if (!parentInfo) return null;

    const parentPetSummary = await this.getPetSummary(parentInfo.parentId);
    return {
      ...parentPetSummary,
      relationId: parentInfo.relationId,
      status: parentInfo.status,
    };
  }

  async getPetsWithChildren(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ParentWithChildrenDto>> {
    // 자식이 있는 개체들을 찾기 위한 쿼리
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .innerJoin('parents', 'parents', 'parents.parentId = pets.petId')
      .where('pets.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('parents.status = :status', { status: 'approved' })
      .groupBy('pets.id')
      .addGroupBy('users.userId')
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
      ])
      .orderBy('pets.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();

    // 데이터가 없는 경우 빈 배열과 메타 정보만 반환
    if (totalCount === 0) {
      const pageMetaDto = new PageMetaDto({ totalCount: 0, pageOptionsDto });
      return new PageDto([], pageMetaDto);
    }

    const { entities } = await queryBuilder.getRawAndEntities();

    // 각 부모 펫의 자식들을 가져오기
    const parentsWithChildrenPromises = entities.map(async (entity) => {
      const pet = instanceToPlain(entity) as PetDto;
      const children = await this.getChildren(pet.petId);
      const childrenCount = children.length;

      // 자식이 있는 경우에만 반환
      if (childrenCount > 0) {
        return plainToInstance(ParentWithChildrenDto, {
          parent: plainToInstance(PetSummaryDto, pet),
          children,
          childrenCount,
        });
      }
      return null;
    });

    const parentsWithChildren = (
      await Promise.all(parentsWithChildrenPromises)
    ).filter((item) => item !== null);

    const pageMetaDto = new PageMetaDto({
      totalCount: parentsWithChildren.length,
      pageOptionsDto,
    });
    return new PageDto(parentsWithChildren, pageMetaDto);
  }

  private async getChildren(parentId: string): Promise<PetSummaryDto[]> {
    // 부모 ID로 자식들을 찾기
    // parents 테이블에서 parent_id가 현재 펫 ID와 일치하는 레코드들의 pet_id를 찾음
    const childrenQueryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      // parents 테이블에서 현재 펫이 부모인 자식들을 찾음
      .leftJoin('parents', 'parents', 'parents.petId = pets.petId')
      .where('parents.parentId = :parentId', { parentId })
      .andWhere('parents.status = :status', { status: 'approved' })
      .andWhere('pets.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
      ]);

    const { entities } = await childrenQueryBuilder.getRawAndEntities();
    return entities.map((entity) =>
      plainToInstance(PetSummaryDto, instanceToPlain(entity)),
    );
  }

  private createPetWithOwnerQueryBuilder(
    userId?: string,
    includeOthers?: boolean,
  ) {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .where('pets.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
      ]);

    if (userId) {
      if (!includeOthers) {
        queryBuilder.andWhere('pets.ownerId = :userId', { userId });
      }
    }

    return queryBuilder;
  }

  async getPetOwnerId(petId: string): Promise<string | null> {
    const result = await this.petRepository
      .createQueryBuilder('pets')
      .select('pets.ownerId')
      .where('pets.petId = :petId', { petId })
      .getOne();

    return result?.ownerId || null;
  }

  // 배치로 부모 정보 조회하는 새로운 메서드
  private async getParentsBatch(
    petIds: string[],
    role: PARENT_ROLE,
  ): Promise<Array<Partial<ParentDto> & { petId: string }>> {
    if (petIds.length === 0) return [];

    const parents = await this.parentService.findByPetIdsAndRole(petIds, role);

    if (parents.length === 0) return [];

    const parentPetIds = parents.map((p) => p.parentId);
    const parentPetSummaries = await this.getPetSummariesBatch(parentPetIds);

    return parents.map((parent) => {
      const parentPetSummary = parentPetSummaries.find(
        (summary) => summary.petId === parent.parentId,
      );

      return {
        ...parentPetSummary,
        relationId: parent.id,
        status: parent.status,
        petId: parent.petId,
      };
    });
  }

  // 배치로 분양 정보 조회하는 새로운 메서드
  private async getAdoptionsBatch(petIds: string[]): Promise<AdoptionEntity[]> {
    if (petIds.length === 0) return [];

    return await this.adoptionRepository
      .createQueryBuilder('adoption')
      .where('adoption.petId IN (:...petIds)', { petIds })
      .andWhere('adoption.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();
  }

  // 배치로 펫 요약 정보 조회하는 새로운 메서드
  private async getPetSummariesBatch(
    petIds: string[],
  ): Promise<PetSummaryDto[]> {
    if (petIds.length === 0) return [];

    const queryBuilder = this.createPetWithOwnerQueryBuilder();
    const { entities } = await queryBuilder
      .andWhere('pets.petId IN (:...petIds)', { petIds })
      .getRawAndEntities();

    return entities.map((entity) =>
      plainToInstance(PetSummaryDto, instanceToPlain(entity)),
    );
  }
}
