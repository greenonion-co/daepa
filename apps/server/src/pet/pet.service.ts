import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { nanoid } from 'nanoid';
import { plainToInstance } from 'class-transformer';
import {
  CreatePetDto,
  LinkParentDto,
  PetAdoptionDto,
  PetDto,
  PetFamilyParentDto,
  PetParentDto,
  PetFamilyPairGroupDto,
} from './pet.dto';
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
import { ParentRequestEntity } from 'src/parent_request/parent_request.entity';
import { CreateParentDto } from 'src/parent_request/parent_request.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { LayingEntity } from 'src/laying/laying.entity';

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly userService: UserService,
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly pairService: PairService,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
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
    createPetDto: CreatePetDto,
    ownerId: string,
  ): Promise<{ petId: string }> {
    const petId = await this.generateUniquePetId();
    const { father, mother, ...petData } = createPetDto;

    // 펫 데이터 준비
    const petEntityData = plainToInstance(PetEntity, {
      ...petData,
      petId,
      ownerId,
    });

    try {
      // 펫 생성
      await this.petRepository.insert(petEntityData);

      // 부모 연동 요청 처리
      if (father) {
        await this.handleParentRequest(petId, ownerId, father);
      }

      if (mother) {
        await this.handleParentRequest(petId, ownerId, mother);
      }

      // 부모 모두 있는 경우, 둘 다 내 펫인지 확인 후 pair 생성
      if (father && mother) {
        // pair에 해당 쌍이 없는 경우에만 아래 로직 수행
        const pair = await this.pairRepository.findOne({
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

          await this.petRepository.update({ petId }, { pairId: newPair.id });
        } else {
          await this.petRepository.update({ petId }, { pairId: pair.id });
        }
      }

      return { petId };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
      ) {
        const dbError = error as { code: string; message: string };
        if (dbError.code === 'ER_DUP_ENTRY') {
          if (dbError.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message: '이미 존재하는 펫 이름입니다.',
              },
              HttpStatus.CONFLICT,
            );
          }
        }
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 생성 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getParentWithRequestStatus(
    petId: string,
    parentId: string | null,
    role: PARENT_ROLE,
  ): Promise<{
    parent: PetEntity | null;
    parentRequest: ParentRequestEntity | null;
  }> {
    let parent: PetEntity | null = null;
    let parentRequest: ParentRequestEntity | null = null;

    if (parentId) {
      // 기존 부모 ID가 있는 경우
      parent = await this.petRepository.findOne({
        where: { petId: parentId, isDeleted: false },
        select: ['petId', 'name', 'species', 'morphs', 'sex', 'hatchingDate'],
      });

      if (parent) {
        parentRequest =
          await this.parentRequestService.findPendingRequestByChildAndParent(
            petId,
            parentId,
            role,
          );
      }
    } else {
      // 부모 ID가 없어도 parent_request에서 요청 조회
      parentRequest =
        await this.parentRequestService.findPendingRequestByChildAndRole(
          petId,
          role,
        );

      if (parentRequest) {
        parent = await this.petRepository.findOne({
          where: {
            petId: parentRequest.parentPetId,
            isDeleted: false,
          },
          select: ['petId', 'name', 'species', 'morphs', 'sex', 'hatchingDate'],
        });
      }
    }

    return { parent, parentRequest };
  }

  async findPetByPetId(petId: string): Promise<PetDto> {
    const pet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
      relations: ['father', 'mother', 'adoption'],
    });

    if (!pet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // adoption 정보를 별도로 조회해보기
    const adoption = await this.adoptionRepository.findOne({
      where: { petId, isDeleted: false },
    });

    // 소유자 정보 조회
    const owner = await this.userService.findOneProfile(pet.ownerId);

    // 부모 정보와 요청 상태 조회
    const { parent: father, parentRequest: fatherParentRequest } =
      await this.getParentWithRequestStatus(
        petId,
        pet.fatherId,
        PARENT_ROLE.FATHER,
      );

    const { parent: mother, parentRequest: motherParentRequest } =
      await this.getParentWithRequestStatus(
        petId,
        pet.motherId,
        PARENT_ROLE.MOTHER,
      );

    return plainToInstance(PetDto, {
      ...pet,
      owner,
      father: father
        ? {
            ...plainToInstance(PetParentDto, father),
            status: fatherParentRequest?.status ?? PARENT_STATUS.APPROVED,
          }
        : undefined,
      mother: mother
        ? {
            ...plainToInstance(PetParentDto, mother),
            status: motherParentRequest?.status ?? PARENT_STATUS.APPROVED,
          }
        : undefined,
      adoption: adoption
        ? plainToInstance(PetAdoptionDto, adoption)
        : undefined,
    });
  }

  async updatePet(
    petId: string,
    updatePetDto: UpdatePetDto,
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const { father, mother, ...petData } = updatePetDto;

    try {
      // 펫 정보 업데이트
      await this.petRepository.update({ petId }, petData);

      // 부모 연동 요청 처리
      if (father) {
        await this.handleParentRequest(petId, userId, father);
      }

      if (mother) {
        await this.handleParentRequest(petId, userId, mother);
      }

      return { petId };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
      ) {
        const dbError = error as { code: string; message: string };
        if (dbError.code === 'ER_DUP_ENTRY') {
          if (dbError.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message: '이미 존재하는 펫 이름입니다.',
              },
              HttpStatus.CONFLICT,
            );
          }
        }
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 수정 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 내 펫 -> 즉시 연동
  // 타인 펫 -> parent_request 테이블에 요청 생성

  private async handleParentRequest(
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
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '부모로 지정된 펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 성별 검증
    if (
      parentInfo.role === PARENT_ROLE.FATHER &&
      parentPet.sex !== PET_SEX.MALE
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '아버지로 지정된 펫은 수컷이어야 합니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      parentInfo.role === PARENT_ROLE.MOTHER &&
      parentPet.sex !== PET_SEX.FEMALE
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '어머니로 지정된 펫은 암컷이어야 합니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 자신의 펫인 경우 즉시 연동
    if (parentPet.ownerId === requesterId) {
      await this.linkParentDirectly(
        childPetId,
        parentPet.petId,
        parentInfo.role,
      );
    } else {
      // 다른 사람의 펫인 경우 parent_request 테이블에 요청 생성
      await this.createParentRequest(
        childPetId,
        requesterId,
        parentPet,
        parentInfo,
      );
    }
  }

  private async linkParentDirectly(
    childPetId: string,
    parentPetId: string,
    role: PARENT_ROLE,
  ): Promise<void> {
    // 펫 엔티티에 부모 정보 업데이트
    const updateData =
      role === PARENT_ROLE.FATHER
        ? { fatherId: parentPetId }
        : { motherId: parentPetId };

    await this.petRepository.update({ petId: childPetId }, updateData);
  }

  private async createParentRequest(
    childPetId: string,
    requesterId: string,
    parentPet: PetEntity,
    parentInfo: CreateParentDto,
  ): Promise<void> {
    // 기존 대기 중인 요청이 있는지 확인
    const existingRequest =
      await this.parentRequestService.findPendingRequestByChildAndParent(
        childPetId,
        parentPet.petId,
        parentInfo.role,
      );

    if (existingRequest) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 대기 중인 부모 연동 요청이 있습니다.',
        },
        HttpStatus.CONFLICT,
      );
    }

    // parent_request 테이블에 요청 생성 및 알림 발송
    await this.parentRequestService.createParentRequestWithNotification({
      requesterId,
      childPetId,
      parentPetId: parentPet.petId,
      role: parentInfo.role,
      message: parentInfo.message,
    });
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
        'pets.father',
        'pets',
        'father',
        'father.petId = pets.fatherId',
      )
      .leftJoinAndMapOne(
        'pets.mother',
        'pets',
        'mother',
        'mother.petId = pets.motherId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'adoptions',
        'adoptions',
        'adoptions.petId = pets.petId AND adoptions.isDeleted = false AND adoptions.status != :soldStatus',
      )
      // parent_request 정보 추가
      .leftJoinAndMapMany(
        'pets.parentRequests',
        'parent_requests',
        'parent_requests',
        'parent_requests.childPetId = pets.petId',
      )
      .where(' pets.isDeleted = :isDeleted AND pets.growth != :eggGrowth', {
        isDeleted: false,
        eggGrowth: PET_GROWTH.EGG,
      })
      .setParameter('soldStatus', ADOPTION_SALE_STATUS.SOLD);

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
        const owner = await this.userService.findOneProfile(pet.ownerId);

        // 부모 정보와 요청 상태 조회
        const { parent: father, parentRequest: fatherParentRequest } =
          await this.getParentWithRequestStatus(
            pet.petId,
            pet.fatherId,
            PARENT_ROLE.FATHER,
          );

        const { parent: mother, parentRequest: motherParentRequest } =
          await this.getParentWithRequestStatus(
            pet.petId,
            pet.motherId,
            PARENT_ROLE.MOTHER,
          );

        return plainToInstance(PetDto, {
          ...pet,
          owner,
          father: father
            ? {
                ...plainToInstance(PetParentDto, father),
                status: fatherParentRequest?.status ?? PARENT_STATUS.APPROVED,
              }
            : undefined,
          mother: mother
            ? {
                ...plainToInstance(PetParentDto, mother),
                status: motherParentRequest?.status ?? PARENT_STATUS.APPROVED,
              }
            : undefined,
        });
      }),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async unlinkParent(
    petId: string,
    parentRole: PARENT_ROLE,
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 연동된 부모인지 확인
    const parentId =
      parentRole === PARENT_ROLE.FATHER
        ? existingPet.fatherId
        : existingPet.motherId;

    // 요청 중인 경우
    const parentRequest =
      await this.parentRequestService.findPendingRequestByChildAndParent(
        petId,
        parentId,
        parentRole,
      );

    if (!parentId && parentRequest) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '연동된 부모가 없거나 요청 중입니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 펫에서 부모 연동 제거
      const updateData = {
        ...(parentRole === PARENT_ROLE.FATHER ? { fatherId: null } : {}),
        ...(parentRole === PARENT_ROLE.MOTHER ? { motherId: null } : {}),
      } as Partial<PetEntity>;

      await this.petRepository.update({ petId }, updateData);

      // 내 펫이 아닌경우만 parent_request 삭제
      if (existingPet.ownerId !== userId) {
        await this.parentRequestService.deleteParentRequest(
          petId,
          parentId,
          parentRole,
        );
      }

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '부모 연동 해제 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async linkParent(
    petId: string,
    linkParentDto: LinkParentDto,
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 이미 연동된 부모가 있는지 확인
    const existingParentId =
      linkParentDto.role === PARENT_ROLE.FATHER
        ? existingPet.fatherId
        : existingPet.motherId;

    if (existingParentId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 연동된 부모가 있습니다.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      // 부모 연동 요청 처리
      await this.handleParentRequest(petId, userId, linkParentDto);

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '부모 연동 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePet(petId: string, userId: string): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 연관된 데이터 확인 (분양 정보 등)
    const hasAdoption = await this.adoptionRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (hasAdoption) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '분양 정보가 있어 삭제할 수 없습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 자식 펫이 있는지 확인 (이 펫을 부모로 하는 펫들)
    const childrenPets = await this.petRepository.find({
      where: [
        { fatherId: petId, isDeleted: false },
        { motherId: petId, isDeleted: false },
      ],
    });

    if (childrenPets.length > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '자식 펫이 있어 삭제할 수 없습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 펫 삭제 전에 layingId 확인
      const petToDelete = await this.petRepository.findOne({
        where: { petId, isDeleted: false },
        select: ['layingId'],
      });

      await this.petRepository.update({ petId }, { isDeleted: true });

      // 연관된 parent_request들을 모두 삭제 상태로 변경
      await this.parentRequestService.deleteAllParentRequestsByPet(petId);

      // layingId가 있고, 해당 laying에 연동된 다른 펫이 없으면 laying도 삭제
      if (petToDelete?.layingId) {
        const remainingPets = await this.petRepository.count({
          where: {
            layingId: petToDelete.layingId,
            isDeleted: false,
          },
        });

        if (remainingPets === 0) {
          await this.layingRepository.delete(petToDelete.layingId);
        }
      }

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 삭제 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
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
        'pets.father',
        'pets',
        'father',
        'father.petId = pets.fatherId',
      )
      .leftJoinAndMapOne(
        'pets.mother',
        'pets',
        'mother',
        'mother.petId = pets.motherId',
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
        'father.petId',
        'father.name',
        'father.species',
        'father.morphs',
        'father.sex',
        'father.hatchingDate',
        'mother.petId',
        'mother.name',
        'mother.species',
        'mother.morphs',
        'mother.sex',
        'mother.hatchingDate',
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
        const owner = await this.userService.findOneProfile(pet.ownerId);
        return plainToInstance(PetDto, {
          ...pet,
          owner,
          father: pet.father
            ? plainToInstance(PetParentDto, pet.father)
            : undefined,
          mother: pet.mother
            ? plainToInstance(PetParentDto, pet.mother)
            : undefined,
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

  async getFamilyTree(): Promise<Record<string, PetFamilyPairGroupDto>> {
    const petList = await this.petRepository.find({
      where: {
        isDeleted: false,
        pairId: Not(IsNull()),
        growth: Not(PET_GROWTH.EGG),
      },
    });

    // pairId를 key로. 펫리스트와 해당 pairId의 부,모 id를 value로 가진다.
    const petListByPairId: Record<
      string,
      {
        petList: PetEntity[];
        father: PetFamilyParentDto | null;
        mother: PetFamilyParentDto | null;
      }
    > = {};

    for (const pet of petList) {
      if (!petListByPairId[pet.pairId]) {
        // 부모 펫 정보 조회
        const father = pet.fatherId
          ? await this.petRepository.findOne({
              where: { petId: pet.fatherId },
              select: ['petId', 'name'],
            })
          : null;

        const mother = pet.motherId
          ? await this.petRepository.findOne({
              where: { petId: pet.motherId },
              select: ['petId', 'name'],
            })
          : null;

        petListByPairId[pet.pairId] = {
          petList: [],
          father: father
            ? { petId: father.petId, name: father.name || '이름 없음' }
            : null,
          mother: mother
            ? { petId: mother.petId, name: mother.name || '이름 없음' }
            : null,
        };
      }
      petListByPairId[pet.pairId].petList.push(pet);
    }

    return petListByPairId;
  }
}
