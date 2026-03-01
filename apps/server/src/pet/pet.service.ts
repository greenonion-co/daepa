import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { nanoid } from 'nanoid';
import { plainToInstance } from 'class-transformer';
import {
  CompleteHatchingDto,
  CreatePetDto,
  DeletedPetDto,
  PetDto,
  PetFilterDto,
  PetSingleDto,
  UpdatePetDto,
} from './pet.dto';
import { UserProfilePublicDto } from 'src/user/user.dto';
import {
  PET_GROWTH,
  PET_LIST_FILTER_TYPE,
  PET_SEX,
  PET_TYPE,
} from './pet.constants';
import { ParentRequestService } from '../parent_request/parent_request.service';
import {
  PARENT_ROLE,
  PARENT_STATUS,
} from '../parent_request/parent_request.constants';
import { BulkCreatePetDto } from './bulk-create-pet.dto';
import { UserService } from '../user/user.service';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { isMySQLError } from 'src/common/error';
import { ParentRequestEntity } from 'src/parent_request/parent_request.entity';
import { PetImageService } from 'src/pet_image/pet_image.service';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { isUndefined } from 'es-toolkit';
import { PairEntity } from 'src/pair/pair.entity';
import { DateTime } from 'luxon';
import { PetAdoptionService } from 'src/pet_adoption/pet_adoption.service';
import { PetAdoptionEntity } from 'src/pet_adoption/pet_adoption.entity';
import { PetRelationEntity } from 'src/pet_relation/pet_relation.entity';
import { replaceParentPublicSafe } from '../common/utils/pet-parent.helper';
import { extractOriginalPetName } from '../common/utils/pet-name.helper';
import { LayingEntity } from 'src/laying/laying.entity';

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly userService: UserService,
    private readonly petImageService: PetImageService,
    private readonly adoptionService: PetAdoptionService,
    private readonly dataSource: DataSource,
  ) {}

  async createPet(
    createPetDto: CreatePetDto,
    ownerId: string,
    manager?: EntityManager,
  ) {
    const run = async (em: EntityManager) => {
      const petId = await this.generateUniquePetId(em);
      const {
        father,
        mother,
        sex,
        morphs,
        traits,
        foods,
        weight,
        growth,
        temperature,
        eggStatus,
        photos,
        ...petData
      } = createPetDto;

      try {
        // 공통 펫 데이터 준비
        const petEntityData = plainToInstance(PetEntity, {
          ...petData,
          petId,
          ownerId,
        });
        // 펫 생성
        await em.insert(PetEntity, petEntityData);

        // type에 따라 적절한 details 테이블에 데이터 저장
        if (petData.type === PET_TYPE.EGG) {
          await em.insert(EggDetailEntity, {
            petId,
            temperature,
            status: eggStatus,
          });
        } else {
          await em.insert(PetDetailEntity, {
            petId,
            sex,
            morphs,
            traits,
            foods,
            weight,
            growth,
          });
        }

        // 부모 연동 요청 처리
        if (father) {
          await this.parentRequestService.linkParent(
            petId,
            ownerId,
            father,
            em,
          );
        }
        if (mother) {
          await this.parentRequestService.linkParent(
            petId,
            ownerId,
            mother,
            em,
          );
        }

        // 이미지 저장 (모든 펫 관련 정보 생성 후)
        if (photos) {
          await this.petImageService.saveAndUploadConfirmedImages(
            petId,
            photos,
            ownerId,
            'create',
            em,
          );
        }

        // 분양 정보 초기화 (필수 필드만 포함)
        await this.adoptionService.createAdoption(ownerId, { petId }, em);
      } catch (error: unknown) {
        if (error instanceof HttpException) {
          throw error; // 도메인/권한/검증 에러는 원본 유지
        }

        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new ConflictException('이미 존재하는 펫 이름입니다.');
          }
        }

        throw new InternalServerErrorException(
          '펫 생성 중 오류가 발생했습니다.' +
            (error instanceof Error ? error.message : ''),
        );
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

  async bulkCreatePets(
    dto: BulkCreatePetDto,
    ownerId: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (em: EntityManager) => {
      const { pets } = dto;
      if (pets.length === 0) {
        throw new BadRequestException('최소 1개 이상의 개체가 필요합니다.');
      }

      // === 1단계: 사전 검증 ===

      // CSV 내 이름 중복 체크
      const names = pets.map((p) => p.name);
      const nameSet = new Set<string>();
      const duplicateNames: string[] = [];
      for (const name of names) {
        if (nameSet.has(name)) {
          duplicateNames.push(name);
        }
        nameSet.add(name);
      }
      if (duplicateNames.length > 0) {
        const unique = [...new Set(duplicateNames)];
        const display = unique.slice(0, 10).join(', ');
        const suffix = unique.length > 10 ? ` 외 ${unique.length - 10}개` : '';
        throw new BadRequestException(
          `CSV 내 중복된 이름이 있습니다: ${display}${suffix}`,
        );
      }

      // DB 내 기존 이름 중복 체크
      const existingPets = await em.find(PetEntity, {
        where: { ownerId, name: In(names), isDeleted: false },
        select: ['name'],
      });
      if (existingPets.length > 0) {
        const existingNames = existingPets.map((p) => p.name);
        const display = existingNames.slice(0, 10).join(', ');
        const suffix =
          existingNames.length > 10 ? ` 외 ${existingNames.length - 10}개` : '';
        throw new ConflictException(
          `이미 존재하는 펫 이름입니다: ${display}${suffix}`,
        );
      }

      // 부모 이름 수집 및 검증
      const csvNameToRow = new Map(pets.map((p) => [p.name, p]));
      const parentNamesToResolve = new Set<string>();

      for (const row of pets) {
        if (row.fatherName) parentNamesToResolve.add(row.fatherName);
        if (row.motherName) parentNamesToResolve.add(row.motherName);
      }

      // DB에서 부모 후보 조회 (같은 소유자의 기존 펫)
      const dbParentNames = [...parentNamesToResolve].filter(
        (n) => !csvNameToRow.has(n),
      );
      const dbParentMap = new Map<
        string,
        { petId: string; sex: PET_SEX | null }
      >();

      if (dbParentNames.length > 0) {
        const dbParents = await em
          .createQueryBuilder(PetEntity, 'pet')
          .leftJoinAndMapOne(
            'pet.petDetail',
            PetDetailEntity,
            'pd',
            'pd.petId = pet.petId',
          )
          .where('pet.ownerId = :ownerId', { ownerId })
          .andWhere('pet.name IN (:...names)', { names: dbParentNames })
          .andWhere('pet.isDeleted = false')
          .select(['pet.petId', 'pet.name', 'pd.sex'])
          .getMany();

        for (const p of dbParents) {
          dbParentMap.set(p.name!, {
            petId: p.petId,
            sex: p.petDetail?.sex ?? null,
          });
        }
      }

      // 부모 이름 존재 및 성별 검증
      for (let i = 0; i < pets.length; i++) {
        const row = pets[i];
        const rowNum = i + 2; // CSV 헤더 제외, 1-based

        if (row.fatherName) {
          if (row.fatherName === row.name) {
            throw new BadRequestException(
              `${rowNum}행: "${row.name}"은(는) 자기 자신을 부개체로 지정할 수 없습니다.`,
            );
          }

          const csvParent = csvNameToRow.get(row.fatherName);
          const dbParent = dbParentMap.get(row.fatherName);

          if (!csvParent && !dbParent) {
            throw new BadRequestException(
              `${rowNum}행: "${row.name}"의 부개체 "${row.fatherName}"을(를) 찾을 수 없습니다.`,
            );
          }

          const parentSex = csvParent?.sex ?? dbParent?.sex;
          if (parentSex && parentSex !== PET_SEX.MALE) {
            throw new BadRequestException(
              `${rowNum}행: "${row.fatherName}"은(는) 수컷이 아니므로 부개체로 지정할 수 없습니다.`,
            );
          }
        }

        if (row.motherName) {
          if (row.motherName === row.name) {
            throw new BadRequestException(
              `${rowNum}행: "${row.name}"은(는) 자기 자신을 모개체로 지정할 수 없습니다.`,
            );
          }

          const csvParent = csvNameToRow.get(row.motherName);
          const dbParent = dbParentMap.get(row.motherName);

          if (!csvParent && !dbParent) {
            throw new BadRequestException(
              `${rowNum}행: "${row.name}"의 모개체 "${row.motherName}"을(를) 찾을 수 없습니다.`,
            );
          }

          const parentSex = csvParent?.sex ?? dbParent?.sex;
          if (parentSex && parentSex !== PET_SEX.FEMALE) {
            throw new BadRequestException(
              `${rowNum}행: "${row.motherName}"은(는) 암컷이 아니므로 모개체로 지정할 수 없습니다.`,
            );
          }
        }
      }

      // === 2단계: petId 일괄 생성 ===
      const petIdSet = new Set<string>();
      while (petIdSet.size < pets.length) {
        petIdSet.add(nanoid(8));
      }
      const petIds = [...petIdSet];

      // DB 충돌 확인 (1 query)
      const conflicting = await em.find(PetEntity, {
        where: { petId: In(petIds) },
        select: ['petId'],
      });
      if (conflicting.length > 0) {
        const conflictSet = new Set(conflicting.map((p) => p.petId));
        for (let i = 0; i < petIds.length; i++) {
          while (conflictSet.has(petIds[i])) {
            petIds[i] = nanoid(8);
          }
        }
      }

      // name → petId 매핑
      const nameToId = new Map<string, string>();
      pets.forEach((row, i) => nameToId.set(row.name, petIds[i]));
      for (const [name, info] of dbParentMap) {
        if (!nameToId.has(name)) {
          nameToId.set(name, info.petId);
        }
      }

      // === 3단계: 테이블별 일괄 INSERT ===
      // pets (1 query)
      await em.insert(
        PetEntity,
        pets.map((row, i) =>
          plainToInstance(PetEntity, {
            petId: petIds[i],
            ownerId,
            type: PET_TYPE.PET,
            name: row.name,
            species: row.species,
            hatchingDate: row.hatchingDate ? new Date(row.hatchingDate) : null,
            isPublic: row.isPublic ?? false,
          }),
        ),
      );

      // pet_details (1 query)
      await em.insert(
        PetDetailEntity,
        pets.map((row, i) => ({
          petId: petIds[i],
          sex: row.sex ?? null,
          growth: row.growth ?? null,
          morphs: row.morphs?.length ? row.morphs : null,
          traits: row.traits?.length ? row.traits : null,
          foods: row.foods?.length ? row.foods : null,
          weight: row.weight ?? null,
        })),
      );

      // pet_adoptions (1 query)
      await em.insert(
        PetAdoptionEntity,
        pets.map((row, i) => ({
          petId: petIds[i],
          status: row.adoptionStatus ?? null,
        })),
      );

      // === 4단계: 부모 연결 (일괄) ===
      // 모두 같은 소유자이므로 즉시 APPROVED, 알림 불필요
      const parentRequests: Array<{
        childPetId: string;
        parentPetId: string;
        role: PARENT_ROLE;
        status: PARENT_STATUS;
      }> = [];
      const petRelationMap = new Map<
        string,
        { fatherId: string | null; motherId: string | null }
      >();

      for (const row of pets) {
        const childPetId = nameToId.get(row.name)!;

        if (row.fatherName) {
          const fatherId = nameToId.get(row.fatherName);
          if (fatherId) {
            parentRequests.push({
              childPetId,
              parentPetId: fatherId,
              role: PARENT_ROLE.FATHER,
              status: PARENT_STATUS.APPROVED,
            });
            const rel = petRelationMap.get(childPetId) ?? {
              fatherId: null,
              motherId: null,
            };
            rel.fatherId = fatherId;
            petRelationMap.set(childPetId, rel);
          }
        }

        if (row.motherName) {
          const motherId = nameToId.get(row.motherName);
          if (motherId) {
            parentRequests.push({
              childPetId,
              parentPetId: motherId,
              role: PARENT_ROLE.MOTHER,
              status: PARENT_STATUS.APPROVED,
            });
            const rel = petRelationMap.get(childPetId) ?? {
              fatherId: null,
              motherId: null,
            };
            rel.motherId = motherId;
            petRelationMap.set(childPetId, rel);
          }
        }
      }

      // parent_requests 일괄 INSERT (1 query)
      if (parentRequests.length > 0) {
        await em.insert(ParentRequestEntity, parentRequests);
      }

      // pet_relations 일괄 INSERT (1 query)
      if (petRelationMap.size > 0) {
        await em.insert(
          PetRelationEntity,
          [...petRelationMap.entries()].map(
            ([petId, { fatherId, motherId }]) => ({
              petId,
              fatherId,
              motherId,
            }),
          ),
        );
      }

      return pets.length;
    });
  }

  async findPetByPetId(
    petId: string,
    viewerId?: string,
  ): Promise<PetSingleDto> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      // 비공개 펫인 경우 소유자만 접근 가능
      if (!pet.isPublic) {
        // 인증되지 않았거나 소유자가 아닌 경우
        if (!viewerId || pet.ownerId !== viewerId) {
          // 404를 반환하여 펫의 존재 여부를 숨김 (보안)
          throw new NotFoundException('펫을 찾을 수 없습니다.');
        }
      }

      let petDetail: PetDetailEntity | null = null;
      let eggDetail: EggDetailEntity | null = null;

      if (pet.type === PET_TYPE.EGG) {
        eggDetail = await entityManager.findOne(EggDetailEntity, {
          where: { petId },
        });
      } else {
        petDetail = await entityManager.findOne(PetDetailEntity, {
          where: { petId },
        });
      }

      if (!pet.ownerId) {
        throw new NotFoundException('펫의 소유자를 찾을 수 없습니다.');
      }

      // 소유자 정보 조회
      const ownerData = await this.userService.findOneProfile(
        pet.ownerId,
        entityManager,
      );

      // 공개용 owner 정보로 변환 (민감한 정보 제거)
      const owner = plainToInstance(UserProfilePublicDto, {
        userId: ownerData.userId,
        name: ownerData.name,
        role: ownerData.role,
        isBiz: ownerData.isBiz,
        status: ownerData.status,
      });

      const { growth, sex, morphs, traits, foods, weight } = petDetail ?? {};
      const { temperature, status: eggStatus } = eggDetail ?? {};

      if (pet.isDeleted) {
        return plainToInstance(PetSingleDto, {
          petId: pet.petId,
          species: pet.species,
          name: pet.name,
          isDeleted: pet.isDeleted,
          deletedAt: pet.deletedAt,
          deleteReason: pet.deleteReason,
        });
      }

      return plainToInstance(PetSingleDto, {
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
        owner,
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

      const {
        sex,
        morphs,
        traits,
        foods,
        weight,
        growth,
        temperature,
        eggStatus,
        ...petData
      } = updatePetDto;

      const isSexChanged =
        !isUndefined(sex) && sex !== existingPet.petDetail?.sex;

      if (isSexChanged) {
        const pairExists = await entityManager.exists(PairEntity, {
          where: [
            { ownerId: existingPet.ownerId, fatherId: petId, isDeleted: false },
            { ownerId: existingPet.ownerId, motherId: petId, isDeleted: false },
          ],
        });
        if (pairExists) {
          throw new BadRequestException(
            '페어가 존재하는 펫의 성별을 변경할 수 없습니다. 페어를 먼저 삭제해주세요.',
          );
        }

        const childExists = await entityManager.exists(ParentRequestEntity, {
          where: {
            parentPetId: petId,
            status: In([PARENT_STATUS.APPROVED, PARENT_STATUS.PENDING]),
          },
        });
        if (childExists) {
          throw new BadRequestException(
            '누군가의 부모로 연결된 펫입니다. 성별을 변경하기 전에 이를 먼저 처리해주세요.',
          );
        }
      }

      try {
        // 펫 기본 정보 업데이트
        await entityManager.update(PetEntity, { petId }, petData);

        if (existingPet.type === PET_TYPE.EGG) {
          await entityManager.update(
            EggDetailEntity,
            { petId },
            {
              ...(temperature && { temperature }),
              ...(eggStatus && { status: eggStatus }),
            },
          );
        } else {
          const updateData: Partial<PetDetailEntity> = {};
          if (!isUndefined(sex)) updateData.sex = sex;
          if (!isUndefined(morphs)) updateData.morphs = morphs;
          if (!isUndefined(traits)) updateData.traits = traits;
          if (!isUndefined(foods)) updateData.foods = foods;
          if (!isUndefined(weight)) updateData.weight = weight;
          if (!isUndefined(growth)) updateData.growth = growth;

          if (Object.keys(updateData).length > 0) {
            await entityManager.update(PetDetailEntity, { petId }, updateData);
          }
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

  async getPetListFull(
    pageOptionsDto: PetFilterDto,
    userId: string | null,
  ): Promise<PageDto<PetDto>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .where('pets.isDeleted = :isDeleted AND pets.type = :type', {
        isDeleted: false,
        type: PET_TYPE.PET,
      })
      .innerJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.petDetail',
        'pet_details',
        'petDetail',
        'petDetail.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'pet_adoptions',
        'pet_adoptions',
        'pet_adoptions.petId = pets.petId',
      )
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
        'petDetail',
        'pet_adoptions',
      ]);

    if (pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.MY && userId) {
      // 자신의 모든 펫 조회 가능 (로그인 필요)
      queryBuilder.andWhere('pets.ownerId = :userId', { userId });
    } else if (
      pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.NOT_MY &&
      userId
    ) {
      // 자신의 펫을 제외한 모든 펫 조회 가능 (로그인 필요)
      queryBuilder.andWhere(
        'pets.isPublic = :isPublic AND pets.ownerId != :userId',
        { isPublic: true, userId },
      );
    } else {
      // 기본적으로 공개된 펫만 조회 가능 (비로그인 포함)
      queryBuilder.andWhere('pets.isPublic = :isPublic', { isPublic: true });
    }

    this.buildPetListSearchFilterQuery(queryBuilder, pageOptionsDto);

    // 정렬 및 페이지네이션
    queryBuilder
      .orderBy('pets.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const petEntities = await queryBuilder.getMany();

    // PetDto로 변환하면서 parent_request 상태 정보 포함
    const petDtos = await Promise.all(
      petEntities.map(async (petRaw) => {
        const { petId, ...pet } = petRaw;

        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(petId);
        const fatherDisplayable = replaceParentPublicSafe(
          father,
          petRaw.ownerId,
          userId ?? undefined,
        );
        const motherDisplayable = replaceParentPublicSafe(
          mother,
          petRaw.ownerId,
          userId ?? undefined,
        );

        const petDto = plainToInstance(PetDto, {
          ...pet,
          petId,
          ...(pet.petDetail && {
            sex: pet.petDetail.sex,
            morphs: pet.petDetail.morphs,
            traits: pet.petDetail.traits,
            foods: pet.petDetail.foods,
            weight: pet.petDetail.weight,
            growth: pet.petDetail.growth,
          }),
          ...(pet.eggDetail && {
            temperature: pet.eggDetail.temperature,
            eggStatus: pet.eggDetail.status,
          }),
          father: fatherDisplayable,
          mother: motherDisplayable,
        });

        return petDto;
      }),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async deletePet(
    petId: string,
    userId: string,
    deleteReason?: string,
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

      try {
        const now = DateTime.now().setZone('Asia/Seoul').toJSDate();

        // 펫 soft delete
        await entityManager.update(
          PetEntity,
          { petId },
          {
            name: `DELETED_${existingPet.name}_${Date.now()}`,
            isDeleted: true,
            deletedAt: now,
            deleteReason: deleteReason || null,
          },
        );

        // 펫 상세 정보 soft delete
        if (existingPet.type === PET_TYPE.PET) {
          await entityManager.update(
            PetDetailEntity,
            { petId },
            { isDeleted: true },
          );
        } else {
          await entityManager.update(
            EggDetailEntity,
            { petId },
            { isDeleted: true },
          );
        }

        // layingId가 있는 경우, 해당 laying에 남은 펫이 없으면 laying 삭제
        if (existingPet.layingId) {
          const remainingPets = await entityManager.count(PetEntity, {
            where: {
              layingId: existingPet.layingId,
              isDeleted: false,
            },
          });

          if (remainingPets === 0) {
            await entityManager.delete(LayingEntity, {
              id: existingPet.layingId,
            });
          }
        }

        return { petId };
      } catch (error: unknown) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException(
          '펫 삭제 중 오류가 발생했습니다.',
        );
      }
    });
  }

  async restorePet(petId: string, userId: string): Promise<{ petId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 삭제된 펫 존재 여부 및 소유권 확인
      const existingPet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: true },
      });

      if (!existingPet) {
        throw new NotFoundException('삭제된 펫을 찾을 수 없습니다.');
      }

      if (existingPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      try {
        const originalName = extractOriginalPetName(existingPet.name);

        // 펫 복구
        await entityManager.update(
          PetEntity,
          { petId },
          {
            name: originalName || existingPet.name,
            isDeleted: false,
            deletedAt: null,
            deleteReason: null,
          },
        );

        // 펫 상세 정보 복구
        if (existingPet.type === PET_TYPE.PET) {
          await entityManager.update(
            PetDetailEntity,
            { petId },
            { isDeleted: false },
          );
        } else {
          await entityManager.update(
            EggDetailEntity,
            { petId },
            { isDeleted: false },
          );
        }

        return { petId };
      } catch (error: unknown) {
        if (error instanceof HttpException) {
          throw error;
        }
        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new ConflictException('이미 존재하는 펫 이름입니다.');
          }
        }
        throw new InternalServerErrorException(
          '펫 복구 중 오류가 발생했습니다.',
        );
      }
    });
  }

  async getDeletedPets(
    pageOptionsDto: PetFilterDto,
    userId: string,
  ): Promise<PageDto<DeletedPetDto>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .where('pets.ownerId = :userId AND pets.isDeleted = :isDeleted', {
        userId,
        isDeleted: true,
      })
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.petDetail',
        'pet_details',
        'petDetail',
        'petDetail.petId = pets.petId',
      )
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
        'petDetail',
      ]);

    // 검색 및 필터링 (키워드, 종, 성별 등)
    this.buildPetListSearchFilterQuery(queryBuilder, pageOptionsDto);

    // 정렬: 삭제 날짜 기준 내림차순
    queryBuilder
      .orderBy('pets.deletedAt', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const petEntities = await queryBuilder.getMany();

    // PetSummaryDto로 변환
    const petDtos = petEntities.map((petRaw) => {
      const petDto = plainToInstance(DeletedPetDto, {
        name: petRaw.name,
        species: petRaw.species,
        deletedAt: petRaw.deletedAt,
        deleteReason: petRaw.deleteReason,
        petId: petRaw.petId,
        hatchingDate: petRaw.hatchingDate,
      });

      return petDto;
    });

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async getParentsByPetId(
    petId: string,
    userId?: string,
    options?: { statuses?: PARENT_STATUS[] },
  ) {
    const { father, mother } =
      await this.parentRequestService.getParentsWithRequestStatus(
        petId,
        options,
      );
    // petId로 owner 정보
    const pet = await this.petRepository.findOne({
      where: { petId },
    });
    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    const fatherDisplayable = replaceParentPublicSafe(
      father,
      pet.ownerId,
      userId,
    );
    const motherDisplayable = replaceParentPublicSafe(
      mother,
      pet.ownerId,
      userId,
    );
    return {
      father: fatherDisplayable ?? undefined,
      mother: motherDisplayable ?? undefined,
    };
  }

  async completeHatching(
    petId: string,
    userId: string,
    hatchingData: CompleteHatchingDto,
  ): Promise<{ petId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const existingPet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!existingPet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (existingPet.ownerId !== userId) {
        throw new ForbiddenException('펫의 소유자가 아닙니다.');
      }

      if (existingPet.type !== PET_TYPE.EGG) {
        throw new BadRequestException('이미 부화한 펫입니다.');
      }

      const { hatchingDate, name, desc } = hatchingData;

      try {
        await entityManager.update(
          PetEntity,
          { petId },
          {
            type: PET_TYPE.PET,
            hatchingDate,
            name,
            desc,
          },
        );

        await entityManager.update(
          EggDetailEntity,
          { petId },
          { status: EGG_STATUS.HATCHED },
        );

        await entityManager.insert(PetDetailEntity, {
          petId,
          growth: PET_GROWTH.BABY,
          sex: PET_SEX.NON,
        });

        return { petId };
      } catch (error: unknown) {
        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          throw new ConflictException('이미 존재하는 펫 이름입니다.');
        }
        throw new InternalServerErrorException(
          '펫 부화 중 오류가 발생했습니다.',
        );
      }
    });
  }

  async getPetListByHatchingDate(
    dateRange: { startDate?: Date; endDate?: Date },
    userId: string,
  ): Promise<Record<string, PetDto[]>> {
    const startDate = format(
      dateRange?.startDate ?? startOfMonth(new Date()),
      'yyyy-MM-dd',
    );
    const endDate = format(
      dateRange?.endDate ?? endOfMonth(new Date()),
      'yyyy-MM-dd',
    );

    const petQueryBuilder = this.dataSource
      .createQueryBuilder(PetEntity, 'pets')
      .innerJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.petDetail',
        'pet_details',
        'petDetail',
        'petDetail.petId = pets.petId',
      )
      .where(
        'pets.ownerId = :userId AND pets.type = :petType AND pets.isDeleted = :isDeleted',
        {
          userId,
          petType: PET_TYPE.PET,
          isDeleted: false,
        },
      )
      .andWhere('pets.hatchingDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
        'petDetail.sex',
        'petDetail.morphs',
        'petDetail.traits',
        'petDetail.foods',
        'petDetail.weight',
      ]);

    const eggQueryBuilder = this.dataSource
      .createQueryBuilder(PetEntity, 'pets')
      .innerJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.eggDetail',
        'egg_details',
        'eggDetail',
        'eggDetail.petId = pets.petId',
      )
      .innerJoinAndMapOne(
        'pets.laying',
        'layings',
        'layings',
        'layings.id = pets.layingId',
      )
      .where(
        'pets.ownerId = :userId AND pets.type = :petType AND pets.isDeleted = :isDeleted',
        {
          userId,
          petType: PET_TYPE.EGG,
          isDeleted: false,
        },
      )
      .andWhere('layings.layingDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select([
        'pets',
        'users.userId',
        'users.name',
        'users.role',
        'users.isBiz',
        'users.status',
        'layings.id',
        'layings.layingDate',
        'eggDetail.temperature',
        'eggDetail.status',
      ]);

    const [petEntities, eggEntities] = await Promise.all([
      petQueryBuilder.getMany(),
      eggQueryBuilder.getMany(),
    ]);

    const petDtos = await Promise.all(
      [...petEntities, ...eggEntities].map(async (pet) => {
        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(
            pet.petId,
          );
        const fatherDisplayable = replaceParentPublicSafe(
          father,
          pet.ownerId,
          userId,
        );
        const motherDisplayable = replaceParentPublicSafe(
          mother,
          pet.ownerId,
          userId,
        );

        return plainToInstance(PetDto, {
          ...pet,
          father: fatherDisplayable,
          mother: motherDisplayable,
          ...(pet.petDetail && {
            sex: pet.petDetail.sex,
            morphs: pet.petDetail.morphs,
            traits: pet.petDetail.traits,
            foods: pet.petDetail.foods,
            weight: pet.petDetail.weight,
            growth: pet.petDetail.growth,
          }),
          ...(pet.eggDetail && {
            temperature: pet.eggDetail.temperature,
            eggStatus: pet.eggDetail.status,
          }),
        });
      }),
    );

    // 날짜별로 그룹화 (EGG는 layingDate 기준, PET은 hatchingDate 기준)
    const petsByDate = petDtos.reduce(
      (acc, petDto) => {
        let dateToUse: Date | undefined;

        if (petDto.type === PET_TYPE.EGG && petDto.laying?.layingDate) {
          dateToUse = petDto.laying.layingDate;
        } else if (petDto.type === PET_TYPE.PET && petDto.hatchingDate) {
          dateToUse = petDto.hatchingDate;
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
    userId: string,
  ): Promise<Record<string, PetDto[]>> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.getPetListByHatchingDate({ startDate, endDate }, userId);
  }

  async getPetListByMonth(
    month: Date,
    userId: string,
  ): Promise<Record<string, PetDto[]>> {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return this.getPetListByHatchingDate({ startDate, endDate }, userId);
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

  async isPetNameExist(name: string, ownerId: string) {
    const isExist = await this.petRepository.exists({
      where: {
        name,
        ownerId,
        isDeleted: false,
      },
    });
    return isExist;
  }

  private buildPetListSearchFilterQuery(
    queryBuilder: SelectQueryBuilder<PetEntity>,
    pageOptionsDto: PetFilterDto,
  ) {
    // 키워드 검색
    if (pageOptionsDto.keyword) {
      queryBuilder.andWhere('pets.name LIKE :keyword', {
        keyword: `%${pageOptionsDto.keyword}%`,
      });
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere('pets.species = :species', {
        species: pageOptionsDto.species,
      });
    }

    // 성별 필터링
    if (pageOptionsDto.sex && pageOptionsDto.sex.length > 0) {
      queryBuilder.andWhere('petDetail.sex IN (:...sex)', {
        sex: pageOptionsDto.sex,
      });
    }

    // 공개 여부 필터링 (자신의 펫인 경우에만 공개 여부 필터링 적용)
    if (
      pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.MY &&
      pageOptionsDto.isPublic !== undefined
    ) {
      queryBuilder.andWhere('pets.isPublic = :isPublic', {
        isPublic: pageOptionsDto.isPublic,
      });
    }

    // 몸무게 범위 필터링
    if (pageOptionsDto.minWeight !== undefined) {
      queryBuilder.andWhere('petDetail.weight >= :minWeight', {
        minWeight: pageOptionsDto.minWeight,
      });
    }

    if (pageOptionsDto.maxWeight !== undefined) {
      queryBuilder.andWhere('petDetail.weight <= :maxWeight', {
        maxWeight: pageOptionsDto.maxWeight,
      });
    }

    // 해칭일 범위 필터링
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

    // 모프 필터링 (OR 조건: 선택한 모프 중 하나라도 포함되면 매칭)
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      const morphsJson = JSON.stringify(pageOptionsDto.morphs);
      queryBuilder.andWhere(`JSON_OVERLAPS(petDetail.morphs, :morphs)`, {
        morphs: morphsJson,
      });
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      // 모든 trait를 하나의 JSON 배열로 만들어서 한 번에 검색
      const traitsJson = JSON.stringify(pageOptionsDto.traits);
      queryBuilder.andWhere(`JSON_CONTAINS(petDetail.traits, :traits)`, {
        traits: traitsJson,
      });
    }

    // 먹이 필터링
    if (pageOptionsDto.foods) {
      queryBuilder.andWhere(`JSON_CONTAINS(petDetail.foods, :food)`, {
        food: JSON.stringify(pageOptionsDto.foods),
      });
    }

    // 판매 상태 필터링
    if (pageOptionsDto.status && pageOptionsDto.status.length > 0) {
      queryBuilder.andWhere('pet_adoptions.status IN (:...status)', {
        status: pageOptionsDto.status,
      });
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth && pageOptionsDto.growth.length > 0) {
      queryBuilder.andWhere('petDetail.growth IN (:...growth)', {
        growth: pageOptionsDto.growth,
      });
    }
  }
}
