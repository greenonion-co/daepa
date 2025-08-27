import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager, DataSource } from 'typeorm';
import { nanoid } from 'nanoid';
import { plainToInstance } from 'class-transformer';
import { CreatePetDto, PetDto } from './pet.dto';
import {
  PET_GROWTH,
  PET_SEX,
  ADOPTION_SALE_STATUS,
  PET_LIST_FILTER_TYPE,
} from './pet.constants';
import { ParentRequestService } from '../parent_request/parent_request.service';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from '../parent_request/parent_request.constants';
import { UserService } from '../user/user.service';
import { PetFilterDto } from './pet.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { UpdatePetDto } from './pet.dto';
import { AdoptionEntity } from '../adoption/adoption.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PairService } from 'src/pair/pair.service';
import { CreateParentDto } from 'src/parent_request/parent_request.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { isMySQLError } from 'src/common/error';
import { UserProfilePublicDto } from 'src/user/user.dto';
import { ParentRequestEntity } from 'src/parent_request/parent_request.entity';
import { UserNotificationService } from 'src/user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from 'src/user_notification/user_notification.constant';
import { UserNotificationEntity } from 'src/user_notification/user_notification.entity';

const NOTIFICATION_MESSAGES = {
  PARENT_REQUEST_CANCEL: '부모 요청이 취소되었습니다.',
};

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly parentRequestService: ParentRequestService,
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    private readonly userService: UserService,
    private readonly pairService: PairService,
    private readonly userNotificationService: UserNotificationService,
    private readonly dataSource: DataSource,
  ) {}

  async createPet(createPetDto: CreatePetDto, ownerId: string) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const petId = await this.generateUniquePetId(entityManager);
      const { father, mother, ...petData } = createPetDto;

      // 펫 데이터 준비
      const petEntityData = plainToInstance(PetEntity, {
        ...petData,
        petId,
        ownerId,
      });

      try {
        // 펫 생성
        await entityManager.insert(PetEntity, petEntityData);

        // 부모 연동 요청 처리
        if (father) {
          await this.handleParentRequest(entityManager, petId, ownerId, father);
        }

        if (mother) {
          await this.handleParentRequest(entityManager, petId, ownerId, mother);
        }

        // 부모 모두 있는 경우, 둘 다 내 펫인지 확인 후 pair 생성
        if (father && mother) {
          // pair에 해당 쌍이 없는 경우에만 아래 로직 수행
          const pair = await entityManager.findOne(PairEntity, {
            where: {
              ownerId,
              fatherId: father.parentId,
              motherId: mother.parentId,
            },
          });

          // 둘 다 현재 사용자의 펫인 경우에만 pair 생성
          if (!pair) {
            const newPair = await this.pairService.createPair({
              ownerId,
              fatherId: father.parentId,
              motherId: mother.parentId,
            });

            await entityManager.update(
              PetEntity,
              { petId },
              { pairId: newPair.id },
            );
          } else {
            await entityManager.update(
              PetEntity,
              { petId },
              { pairId: pair.id },
            );
          }
        }
      } catch (error: unknown) {
        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new ConflictException('이미 존재하는 펫 이름입니다.');
          }
        }

        throw new InternalServerErrorException(
          '펫 생성 중 오류가 발생했습니다.',
        );
      }
    });
  }

  async findPetByPetId(petId: string): Promise<PetDto> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      // adoption 정보를 petId로 조회
      const adoption = await entityManager.findOne(AdoptionEntity, {
        where: { petId, isDeleted: false },
      });

      if (!pet.ownerId) {
        throw new NotFoundException('펫의 소유자를 찾을 수 없습니다.');
      }

      // 소유자 정보 조회
      const owner = await this.userService.findOneProfile(pet.ownerId);

      const { father, mother } =
        await this.parentRequestService.getParentsWithRequestStatus(petId);

      return plainToInstance(PetDto, {
        ...pet,
        owner,
        father,
        mother,
        adoption,
      });
    });
  }

  async updatePet(
    petId: string,
    updatePetDto: UpdatePetDto,
    userId: string,
  ): Promise<{ petId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 및 소유권 확인
      const existingPet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!existingPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (existingPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      const { father, mother, ...petData } = updatePetDto;

      try {
        // 펫 정보 업데이트
        await entityManager.update(PetEntity, { petId }, petData);

        // 부모 연동 요청 처리
        if (father) {
          await this.handleParentRequest(entityManager, petId, userId, father);
        }

        if (mother) {
          await this.handleParentRequest(entityManager, petId, userId, mother);
        }

        return { petId };
      } catch (error: unknown) {
        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new ConflictException('이미 존재하는 펫 이름입니다.');
          }
        }
        throw new InternalServerErrorException(
          '펫 수정 중 오류가 발생했습니다.',
        );
      }
    });
  }

  // 내 펫 -> 즉시 연동
  // 타인 펫 -> parent_request 테이블에 요청 생성
  private async handleParentRequest(
    entityManager: EntityManager,
    childPetId: string,
    requesterId: string,
    parentInfo: CreateParentDto,
  ): Promise<void> {
    // 부모 펫 정보 조회
    const parentPet = await this.petRepository.findOne({
      where: { petId: parentInfo.parentId },
      select: ['petId', 'sex', 'ownerId', 'name'],
    });

    if (!parentPet?.petId) {
      throw new NotFoundException('부모로 지정된 펫을 찾을 수 없습니다.');
    }

    // 성별 검증
    if (
      parentInfo.role === PARENT_ROLE.FATHER &&
      parentPet.sex !== PET_SEX.MALE
    ) {
      throw new BadRequestException('아버지로 지정된 펫은 수컷이어야 합니다.');
    }

    if (
      parentInfo.role === PARENT_ROLE.MOTHER &&
      parentPet.sex !== PET_SEX.FEMALE
    ) {
      throw new BadRequestException('어머니로 지정된 펫은 암컷이어야 합니다.');
    }

    await this.createParentRequest(
      entityManager,
      childPetId,
      requesterId,
      parentPet,
      parentInfo,
    );
  }

  private async createParentRequest(
    entityManager: EntityManager,
    childPetId: string,
    requesterId: string,
    parentPet: PetEntity,
    parentInfo: CreateParentDto,
  ): Promise<void> {
    // 기존 대기 중인 요청이 있는지 확인
    const existingRequest =
      await this.parentRequestService.findPendingRequestByChildAndParent(
        entityManager,
        childPetId,
        parentPet.petId,
      );

    if (existingRequest) {
      throw new ConflictException('이미 대기 중인 부모 연동 요청이 있습니다.');
    }

    // parent_request 테이블에 요청 생성 및 알림 발송
    await this.parentRequestService.createParentRequestWithNotification(
      entityManager,
      {
        childPetId,
        parentPetId: parentPet.petId,
        role: parentInfo.role,
        message: parentInfo.message,
        status:
          requesterId === parentPet.ownerId
            ? PARENT_STATUS.APPROVED
            : PARENT_STATUS.PENDING,
      },
    );
  }

  async getPetListFull(
    pageOptionsDto: PetFilterDto,
    userId: string,
  ): Promise<PageDto<PetDto>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'adoptions',
        'adoptions',
        'adoptions.petId = pets.petId AND adoptions.isDeleted = false AND adoptions.status != :soldStatus',
      )
      .where(' pets.isDeleted = :isDeleted AND pets.growth != :eggGrowth', {
        isDeleted: false,
        eggGrowth: PET_GROWTH.EGG,
      })
      .setParameter('soldStatus', ADOPTION_SALE_STATUS.SOLD)
      .leftJoin(
        'adoptions',
        'soldAd',
        'soldAd.petId = pets.petId AND soldAd.isDeleted = false AND soldAd.status = :soldStatus',
      )
      .andWhere('soldAd.id IS NULL');

    if (pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.ALL) {
      // 기본적으로 모든 공개된 펫과 자신의 펫을 조회
      queryBuilder.andWhere(
        '(pets.isPublic = :isPublic OR pets.ownerId = :userId)',
        { isPublic: true, userId },
      );
    } else if (pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.MY) {
      // 자신의 펫만 조회
      queryBuilder.andWhere('pets.ownerId = :userId', { userId });
    }

    // 키워드 검색
    if (pageOptionsDto.keyword) {
      queryBuilder.andWhere(
        '(pets.name LIKE :keyword OR pets.desc LIKE :keyword)',
        { keyword: `%${pageOptionsDto.keyword}%` },
      );
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere('pets.species = :species', {
        species: pageOptionsDto.species,
      });
    }

    // 성별 필터링
    if (pageOptionsDto.sex) {
      queryBuilder.andWhere('pets.sex = :sex', { sex: pageOptionsDto.sex });
    }

    // 소유자 필터링
    if (pageOptionsDto.ownerId) {
      queryBuilder.andWhere('pets.ownerId = :ownerId', {
        ownerId: pageOptionsDto.ownerId,
      });
    }

    // 공개 여부 필터링
    if (pageOptionsDto.isPublic !== undefined) {
      queryBuilder.andWhere('pets.isPublic = :isPublic', {
        isPublic: pageOptionsDto.isPublic,
      });
    }

    // 몸무게 범위 필터링
    if (pageOptionsDto.minWeight !== undefined) {
      queryBuilder.andWhere('pets.weight >= :minWeight', {
        minWeight: pageOptionsDto.minWeight,
      });
    }

    if (pageOptionsDto.maxWeight !== undefined) {
      queryBuilder.andWhere('pets.weight <= :maxWeight', {
        maxWeight: pageOptionsDto.maxWeight,
      });
    }

    // 생년월일 범위 필터링
    if (pageOptionsDto.startYmd !== undefined) {
      queryBuilder.andWhere('pets.hatchingDate >= :startYmd', {
        startYmd: pageOptionsDto.startYmd,
      });
    }

    if (pageOptionsDto.endYmd !== undefined) {
      queryBuilder.andWhere('pets.hatchingDate <= :endYmd', {
        endYmd: pageOptionsDto.endYmd,
      });
    }

    // 모프 필터링
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      pageOptionsDto.morphs.forEach((morph, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.morphs, :morph${index})`, {
          [`morph${index}`]: JSON.stringify(morph),
        });
      });
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      pageOptionsDto.traits.forEach((trait, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.traits, :trait${index})`, {
          [`trait${index}`]: JSON.stringify(trait),
        });
      });
    }

    // 먹이 필터링
    if (pageOptionsDto.foods) {
      queryBuilder.andWhere(`JSON_CONTAINS(pets.foods, :food)`, {
        food: JSON.stringify(pageOptionsDto.foods),
      });
    }

    // 판매 상태 필터링
    if (pageOptionsDto.status) {
      queryBuilder.andWhere('adoptions.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth) {
      queryBuilder.andWhere('pets.growth = :growth', {
        growth: pageOptionsDto.growth,
      });
    }

    // 정렬 및 페이지네이션
    queryBuilder
      .orderBy('pets.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const petEntities = await queryBuilder.getMany();

    // PetDto로 변환하면서 parent_request 상태 정보 포함
    const petDtos = await Promise.all(
      petEntities.map(async (pet) => {
        if (!pet.ownerId) {
          throw new NotFoundException('펫의 소유자를 찾을 수 없습니다.');
        }

        const owner = await this.userService.findOneProfile(pet.ownerId);

        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(
            pet.petId,
          );

        return plainToInstance(PetDto, {
          ...pet,
          owner,
          father,
          mother,
        });
      }),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async deletePet(petId: string, userId: string): Promise<{ petId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 및 소유권 확인
      const existingPet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!existingPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (existingPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 연관된 데이터 확인 (분양 정보 등)
      const hasAdoption = await entityManager.findOne(AdoptionEntity, {
        where: { petId, isDeleted: false },
      });

      if (hasAdoption) {
        throw new BadRequestException('분양 정보가 있어 삭제할 수 없습니다.');
      }

      // 자식 펫이 있는지 확인 (이 펫을 부모로 하는 펫들)
      const childrenPets = await entityManager.existsBy(ParentRequestEntity, {
        parentPetId: petId,
        status: In([PARENT_STATUS.APPROVED, PARENT_STATUS.PENDING]),
      });

      if (childrenPets) {
        throw new BadRequestException('자식 펫이 있어 삭제할 수 없습니다.');
      }

      try {
        await entityManager.update(PetEntity, { petId }, { isDeleted: true });

        // 연관된 parent_request들을 모두 삭제 상태로 변경
        await this.parentRequestService.deleteAllParentRequestsByPet(petId);

        // layingId가 있고, 해당 laying에 연동된 다른 펫이 없으면 laying도 삭제
        if (existingPet.layingId) {
          const remainingPets = await entityManager.existsBy(PetEntity, {
            layingId: existingPet.layingId,
            isDeleted: false,
          });

          if (!remainingPets) {
            await entityManager.delete(LayingEntity, {
              id: existingPet.layingId,
            });
          }
        }

        return { petId };
      } catch {
        throw new InternalServerErrorException(
          '펫 삭제 중 오류가 발생했습니다.',
        );
      }
    });
  }

  async completeHatching(
    petId: string,
    userId: string,
    hatchingDate?: number | Date,
  ): Promise<{ petId: string }> {
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    if (existingPet.ownerId !== userId) {
      throw new ForbiddenException('펫의 소유자가 아닙니다.');
    }

    // hatchingDate가 있으면 사용하고, 없으면 현재 시간으로 설정
    const finalHatchingDate = hatchingDate
      ? hatchingDate instanceof Date
        ? Number(hatchingDate.toISOString().slice(0, 10).replace(/-/g, ''))
        : hatchingDate
      : Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

    await this.petRepository.update(
      { petId },
      {
        hatchingDate: finalHatchingDate,
        growth: PET_GROWTH.BABY,
      },
    );

    return { petId };
  }

  async getPetListByHatchingDate(
    dateRange: { startDate?: Date; endDate?: Date },
    userId?: string,
  ): Promise<Record<string, PetDto[]>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.laying',
        'layings',
        'layings',
        'layings.id = pets.layingId',
      )
      .where('pets.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
        'layings.layingDate',
      ]);

    const startDate = dateRange?.startDate ?? startOfMonth(new Date());
    const endDate = dateRange?.endDate ?? endOfMonth(new Date());

    queryBuilder.andWhere(
      '(pets.hatchingDate >= :startDate AND pets.hatchingDate <= :endDate) OR (layings.layingDate >= :startDate AND layings.layingDate <= :endDate)',
      {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
    );

    if (userId) {
      queryBuilder.andWhere('users.userId = :userId', { userId });
    }

    const petEntities = await queryBuilder.getMany();
    const petDtos = await Promise.all(
      petEntities.map(async (pet) => {
        let owner: UserProfilePublicDto | null = null;
        if (pet.ownerId) {
          owner = await this.userService.findOneProfile(pet.ownerId);
        }

        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(
            pet.petId,
          );

        return plainToInstance(PetDto, {
          ...pet,
          owner,
          father,
          mother,
        });
      }),
    );

    // EGG인 펫들의 layingDate 정보 가져오기
    const eggPetIds = petEntities
      .filter((pet) => pet.growth === PET_GROWTH.EGG && pet.layingId)
      .map((pet) => pet.layingId);

    const layings =
      eggPetIds.length > 0
        ? await this.layingRepository.find({
            where: { id: In(eggPetIds) },
            select: ['id', 'layingDate'],
          })
        : [];

    const layingMap = new Map(
      layings.map((laying) => [laying.id, laying.layingDate]),
    );

    // 날짜별로 그룹화 (EGG는 layingDate 기준, 나머지는 hatchingDate 기준)
    const petsByDate = petDtos.reduce(
      (acc, petDto) => {
        let dateToUse: Date | undefined;

        if (petDto.growth === PET_GROWTH.EGG) {
          // EGG인 경우 layingDate 사용
          const petEntity = petEntities.find((p) => p.petId === petDto.petId);
          if (petEntity?.layingId) {
            const layingDate = layingMap.get(petEntity.layingId);
            if (layingDate) {
              dateToUse = new Date(layingDate);
            }
          }
        } else {
          // EGG가 아닌 경우 hatchingDate 사용
          if (petDto.hatchingDate) {
            dateToUse = petDto.hatchingDate;
          }
        }

        if (!dateToUse) return acc;

        const dateStr = format(dateToUse, 'yyyy-MM-dd');
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(petDto);
        return acc;
      },
      {} as Record<string, PetDto[]>,
    );

    return petsByDate;
  }

  async getPetListByYear(
    year: number,
    userId?: string,
  ): Promise<Record<string, PetDto[]>> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.getPetListByHatchingDate({ startDate, endDate }, userId);
  }

  async getPetListByMonth(
    month: Date,
    userId?: string,
  ): Promise<Record<string, PetDto[]>> {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return this.getPetListByHatchingDate({ startDate, endDate }, userId);
  }

  async linkParent(
    petId: string,
    parentId: string,
    role: PARENT_ROLE,
    userId: string,
    message?: string,
  ) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 자식 펫 존재 여부 및 소유권 확인
      const childPet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!childPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (childPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 부모 펫 존재 여부 확인
      const parentPet = await entityManager.findOne(PetEntity, {
        where: { petId: parentId, isDeleted: false },
      });

      if (!parentPet) {
        throw new NotFoundException('부모로 지정된 펫을 찾을 수 없습니다.');
      }

      // 성별 검증
      if (role === PARENT_ROLE.FATHER && parentPet.sex !== PET_SEX.MALE) {
        throw new BadRequestException(
          '아버지로 지정된 펫은 수컷이어야 합니다.',
        );
      }

      if (role === PARENT_ROLE.MOTHER && parentPet.sex !== PET_SEX.FEMALE) {
        throw new BadRequestException(
          '어머니로 지정된 펫은 암컷이어야 합니다.',
        );
      }

      // 기존 부모 관계 확인
      const existingRequest = await entityManager.findOne(ParentRequestEntity, {
        where: {
          childPetId: petId,
          role,
          status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
        },
      });

      if (existingRequest) {
        throw new ConflictException(
          '이미 해당 역할의 부모가 연동되어 있습니다.',
        );
      }

      // 부모 관계 생성
      const status =
        userId === parentPet.ownerId
          ? PARENT_STATUS.APPROVED
          : PARENT_STATUS.PENDING;

      if (userId === parentPet.ownerId) {
        await entityManager.insert(ParentRequestEntity, {
          childPetId: petId,
          parentPetId: parentId,
          role,
          message,
          status,
        });
      } else {
        // 내 펫이 아닌 경우 알림 발송
        await this.parentRequestService.createParentRequestWithNotification(
          entityManager,
          {
            childPetId: petId,
            parentPetId: parentId,
            role,
            message,
            status: PARENT_STATUS.PENDING,
          },
        );
      }
    });
  }

  async unlinkParent(petId: string, role: PARENT_ROLE, userId: string) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 및 소유권 확인
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (pet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      // 해당 role의 부모 관계 찾기
      const parentRequest = await entityManager.findOne(ParentRequestEntity, {
        where: {
          childPetId: petId,
          role,
          status: In([PARENT_STATUS.PENDING, PARENT_STATUS.APPROVED]),
        },
      });

      if (!parentRequest) {
        throw new NotFoundException('해당 부모 관계를 찾을 수 없습니다.');
      }

      if (parentRequest.status === PARENT_STATUS.PENDING) {
        const { childPet, parentPet } =
          await this.parentRequestService.getPetInfo(
            entityManager,
            parentRequest.childPetId,
            parentRequest.parentPetId,
          );

        if (!childPet?.ownerId || !parentPet?.ownerId) {
          throw new NotFoundException('주인 정보를 찾을 수 없습니다.');
        }

        await entityManager
          .createQueryBuilder()
          .update(UserNotificationEntity)
          .set({
            detailJson: () => `JSON_SET(detailJson, '$.status', :status)`,
          })
          .setParameter('status', PARENT_STATUS.CANCELLED)
          .where({
            senderId: childPet.ownerId,
            receiverId: parentPet.ownerId,
            type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
            targetId: parentRequest.id,
          })
          .execute();

        try {
          await this.userNotificationService.createUserNotification(
            entityManager,
            childPet.ownerId,
            {
              receiverId: parentPet.ownerId,
              type: USER_NOTIFICATION_TYPE.PARENT_CANCEL,
              targetId: parentRequest.id,
              detailJson: {
                childPet: {
                  id: parentRequest.childPetId,
                  name: childPet?.name,
                },
                parentPet: {
                  id: parentRequest.parentPetId,
                  name: parentPet?.name,
                },
                role: parentRequest.role,
                message: NOTIFICATION_MESSAGES.PARENT_REQUEST_CANCEL,
              },
            },
          );
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err?.code === 'ER_DUP_ENTRY') {
            throw new ConflictException('동일한 취소 알림이 이미 존재합니다.');
          }
          throw new InternalServerErrorException(
            '취소 알림 생성에 실패했습니다.',
          );
        }
      }

      await entityManager.update(
        ParentRequestEntity,
        { id: parentRequest.id },
        {
          status: PARENT_STATUS.CANCELLED,
        },
      );
    });
  }

  // 펫 아이디 생성
  private async generateUniquePetId(
    entityManager: EntityManager,
  ): Promise<string> {
    let attempts = 0;
    while (attempts < this.MAX_RETRIES) {
      const petId = nanoid(8);
      const existingPet = await entityManager.existsBy(PetEntity, { petId });
      if (!existingPet) {
        return petId;
      }
      attempts++;
    }
    throw new InternalServerErrorException(
      '펫 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
    );
  }
}
