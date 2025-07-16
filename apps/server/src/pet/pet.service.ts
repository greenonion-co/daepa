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
        where: { pet_id: petId },
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
    pageOptionsDto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<PetDto>> {
    const { data, pageMeta } = await this.getPetList<PetDto>(
      pageOptionsDto,
      PetDto,
      userId,
    );

    if (data.length === 0) {
      return new PageDto([], pageMeta);
    }

    const petIds = data.map((pet) => pet.petId);

    // 배치로 부모 정보 조회
    const [fathers, mothers] = await Promise.all([
      this.getParentsBatch(petIds, PARENT_ROLE.FATHER),
      this.getParentsBatch(petIds, PARENT_ROLE.MOTHER),
    ]);

    // 배치로 분양 정보 조회
    const adoptions = await this.getAdoptionsBatch(petIds);

    const petListFullWithParent = data.map((pet) => {
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
      const adoption = adoptions.find((a) => a.pet_id === pet.petId);
      if (adoption) {
        pet.adoption = {
          adoptionId: adoption.adoption_id,
          price: adoption.price
            ? Math.floor(Number(adoption.price))
            : undefined,
          adoptionDate: adoption.adoption_date,
          status: adoption.status,
        };
      }

      return pet;
    });

    return new PageDto(petListFullWithParent, pageMeta);
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
      .where('pets.pet_id = :petId', { petId })
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
          pet_id: pet.petId,
          is_deleted: false,
        },
      });
      if (adoptionEntity) {
        pet.adoption = {
          adoptionId: adoptionEntity.adoption_id,
          price: adoptionEntity.price
            ? Math.floor(Number(adoptionEntity.price))
            : undefined,
          adoptionDate: adoptionEntity.adoption_date,
          memo: adoptionEntity.memo,
          buyerId: adoptionEntity.buyer_id,
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
      .where('pets.pet_id = :petId', { petId })
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
    await this.petRepository.update({ pet_id: petId }, updatePetEntity);

    if (father) {
      await this.parentService.createParent(userId, petId, father, {});
    }
    if (mother) {
      await this.parentService.createParent(userId, petId, mother, {});
    }
  }

  async deletePet(petId: string): Promise<DeleteResult> {
    return await this.petRepository.update(
      { pet_id: petId },
      { is_deleted: true },
    );
  }

  async getPetSummary(petId: string): Promise<PetSummaryDto | null> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder();
    const petEntity = await queryBuilder
      .where('pets.pet_id = :petId', { petId })
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
        'users.user_id = pets.owner_id',
      )
      .innerJoin('parents', 'parents', 'parents.parent_id = pets.pet_id')
      .where('pets.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('parents.status = :status', { status: 'approved' })
      .groupBy('pets.id')
      .addGroupBy('users.user_id')
      .select([
        'pets',
        'users.user_id',
        'users.name',
        'users.role',
        'users.is_biz',
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
        'users.user_id = pets.owner_id',
      )
      // parents 테이블에서 현재 펫이 부모인 자식들을 찾음
      .leftJoin('parents', 'parents', 'parents.pet_id = pets.pet_id')
      .where('parents.parent_id = :parentId', { parentId })
      .andWhere('parents.status = :status', { status: 'approved' })
      .andWhere('pets.is_deleted = :isDeleted', { isDeleted: false })
      .select([
        'pets',
        'users.user_id',
        'users.name',
        'users.role',
        'users.is_biz',
        'users.status',
      ]);

    const { entities } = await childrenQueryBuilder.getRawAndEntities();
    return entities.map((entity) =>
      plainToInstance(PetSummaryDto, instanceToPlain(entity)),
    );
  }

  private createPetWithOwnerQueryBuilder(userId?: string) {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.user_id = pets.owner_id',
      )
      .where('pets.is_deleted = :isDeleted', { isDeleted: false })
      .select([
        'pets',
        'users.user_id',
        'users.name',
        'users.role',
        'users.is_biz',
        'users.status',
      ]);

    if (userId) {
      queryBuilder.andWhere('users.user_id = :userId', { userId });
    }

    return queryBuilder;
  }

  async getPetOwnerId(petId: string): Promise<string | null> {
    const result = await this.petRepository
      .createQueryBuilder('pets')
      .select('pets.owner_id')
      .where('pets.pet_id = :petId', { petId })
      .getOne();

    return result?.owner_id || null;
  }

  // 배치로 부모 정보 조회하는 새로운 메서드
  private async getParentsBatch(
    petIds: string[],
    role: PARENT_ROLE,
  ): Promise<Array<Partial<ParentDto> & { petId: string }>> {
    if (petIds.length === 0) return [];

    const parents = await this.parentService.findByPetIdsAndRole(petIds, role);
    console.log('🚀 ~ PetService ~ parents:', parents);

    if (parents.length === 0) return [];

    const parentPetIds = parents.map((p) => p.parent_id);
    const parentPetSummaries = await this.getPetSummariesBatch(parentPetIds);

    return parents.map((parent) => {
      const parentPetSummary = parentPetSummaries.find(
        (summary) => summary.petId === parent.parent_id,
      );

      return {
        ...parentPetSummary,
        relationId: parent.id,
        status: parent.status,
        petId: parent.pet_id,
      };
    });
  }

  // 배치로 분양 정보 조회하는 새로운 메서드
  private async getAdoptionsBatch(petIds: string[]): Promise<AdoptionEntity[]> {
    if (petIds.length === 0) return [];

    return await this.adoptionRepository
      .createQueryBuilder('adoption')
      .where('adoption.pet_id IN (:...petIds)', { petIds })
      .andWhere('adoption.is_deleted = :isDeleted', { isDeleted: false })
      .getMany();
  }

  // 배치로 펫 요약 정보 조회하는 새로운 메서드
  private async getPetSummariesBatch(
    petIds: string[],
  ): Promise<PetSummaryDto[]> {
    if (petIds.length === 0) return [];

    const queryBuilder = this.createPetWithOwnerQueryBuilder();
    const { entities } = await queryBuilder
      .andWhere('pets.pet_id IN (:...petIds)', { petIds })
      .getRawAndEntities();

    return entities.map((entity) =>
      plainToInstance(PetSummaryDto, instanceToPlain(entity)),
    );
  }
}
