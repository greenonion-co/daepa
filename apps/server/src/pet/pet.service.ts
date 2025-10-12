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
  Repository,
  In,
  EntityManager,
  DataSource,
  SelectQueryBuilder,
} from 'typeorm';
import { nanoid } from 'nanoid';
import { plainToInstance } from 'class-transformer';
import {
  CompleteHatchingDto,
  CreatePetDto,
  PetDto,
  PetParentDto,
} from './pet.dto';
import {
  PET_GROWTH,
  PET_SEX,
  ADOPTION_SALE_STATUS,
  PET_LIST_FILTER_TYPE,
  PET_TYPE,
} from './pet.constants';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { PARENT_STATUS } from '../parent_request/parent_request.constants';
import { UserService } from '../user/user.service';
import { PetFilterDto } from './pet.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { UpdatePetDto } from './pet.dto';
import { AdoptionEntity } from '../adoption/adoption.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { LayingEntity } from 'src/laying/laying.entity';
import { isMySQLError } from 'src/common/error';
import { UserProfilePublicDto } from 'src/user/user.dto';
import { ParentRequestEntity } from 'src/parent_request/parent_request.entity';
import { PetImageService } from 'src/pet_image/pet_image.service';
import { PetImageEntity } from 'src/pet_image/pet_image.entity';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';

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
    private readonly petImageService: PetImageService,
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

      if (photos) {
        await this.petImageService.saveAndUploadConfirmedImages(
          em,
          petId,
          photos,
        );

        const newPhotoOrder = photos.map((photo) =>
          photo.fileName.replace('PENDING/', `${petId}/`),
        );
        petData.photoOrder = newPhotoOrder;
      }

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
          '펫 생성 중 오류가 발생했습니다.',
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

  async findPetByPetId(petId: string, userId: string): Promise<PetDto> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const pet = await entityManager.findOne(PetEntity, {
        where: { petId, isDeleted: false },
      });

      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
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

      // adoption 정보를 petId로 조회
      const adoption = await entityManager.findOne(AdoptionEntity, {
        where: { petId, isDeleted: false },
      });

      let buyer: UserProfilePublicDto | null = null;
      if (adoption?.buyerId) {
        try {
          buyer = await this.userService.findOneProfile(
            adoption.buyerId,
            entityManager,
          );
        } catch {
          buyer = null;
        }
      }

      if (!pet.ownerId) {
        throw new NotFoundException('펫의 소유자를 찾을 수 없습니다.');
      }

      const { files } =
        (await entityManager.findOne(PetImageEntity, {
          where: { petId },
        })) ?? {};

      // 소유자 정보 조회
      const owner = await this.userService.findOneProfile(
        pet.ownerId,
        entityManager,
      );

      const { father, mother } =
        await this.parentRequestService.getParentsWithRequestStatus(
          petId,
          entityManager,
        );

      // father, mother pet이 isPublic이 아닌 경우, ownerId가 자신인 경우에만 펫 정보 반환
      const fatherDisplayable = this.getParentPublicSafe(father, userId);
      const motherDisplayable = this.getParentPublicSafe(mother, userId);

      const { growth, sex, morphs, traits, foods, weight } = petDetail ?? {};
      const { temperature, status: eggStatus } = eggDetail ?? {};

      return plainToInstance(PetDto, {
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
        father: fatherDisplayable,
        mother: motherDisplayable,
        photos: files,
        adoption: adoption
          ? {
              ...adoption,
              buyer,
            }
          : null,
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
        photos,
        ...petData
      } = updatePetDto;

      try {
        if (photos) {
          await this.petImageService.saveAndUploadConfirmedImages(
            entityManager,
            petId,
            photos,
          );

          const newPhotoOrder = photos.map((photo) =>
            photo.fileName.replace('PENDING/', `${petId}/`),
          );
          petData.photoOrder = newPhotoOrder;
        }

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
          if (sex) updateData.sex = sex;
          if (morphs) updateData.morphs = morphs;
          if (traits) updateData.traits = traits;
          if (foods) updateData.foods = foods;
          if (weight) updateData.weight = weight;
          if (growth) updateData.growth = growth;

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
    userId: string,
  ): Promise<PageDto<PetDto>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .where('pets.isDeleted = :isDeleted AND pets.type = :type', {
        isDeleted: false,
        type: PET_TYPE.PET,
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
      .leftJoinAndMapOne(
        'pets.eggDetail',
        'egg_details',
        'eggDetail',
        'eggDetail.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'adoptions',
        'adoptions',
        'adoptions.petId = pets.petId AND adoptions.isDeleted = false AND adoptions.status != :soldStatus',
        { soldStatus: ADOPTION_SALE_STATUS.SOLD },
      )
      .leftJoinAndMapOne(
        'pets.photos',
        'pet_images',
        'pet_images',
        'pet_images.petId = pets.petId',
      );

    if (pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.MY) {
      // 자신의 모든 펫 조회 가능
      queryBuilder.andWhere('pets.ownerId = :userId', { userId });
    } else if (pageOptionsDto.filterType === PET_LIST_FILTER_TYPE.NOT_MY) {
      // 자신의 펫을 제외한 모든 펫 조회 가능
      queryBuilder.andWhere(
        'pets.isPublic = :isPublic AND pets.ownerId != :userId',
        { isPublic: true, userId },
      );
    } else {
      // 기본적으로 공개된 펫만 조회 가능
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
        const { petId, photos, ...pet } = petRaw;

        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(petId);
        const fatherDisplayable = this.getParentPublicSafe(father, userId);
        const motherDisplayable = this.getParentPublicSafe(mother, userId);

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
          photos: photos?.files,
        });

        return petDto;
      }),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async getBrPetListFull(
    pageOptionsDto: PetFilterDto,
    userId: string,
  ): Promise<PageDto<PetDto>> {
    // BR api는 자신의 펫 조회
    pageOptionsDto.filterType = PET_LIST_FILTER_TYPE.MY;

    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .where(
        'pets.ownerId = :userId AND pets.isDeleted = :isDeleted AND pets.type = :type',
        {
          userId,
          isDeleted: false,
          type: PET_TYPE.PET,
        },
      )
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
      .leftJoinAndMapOne(
        'pets.eggDetail',
        'egg_details',
        'eggDetail',
        'eggDetail.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'adoptions',
        'adoptions',
        'adoptions.petId = pets.petId AND adoptions.isDeleted = false AND adoptions.status != :soldStatus',
        { soldStatus: ADOPTION_SALE_STATUS.SOLD },
      )
      .leftJoinAndMapOne(
        'pets.photos',
        'pet_images',
        'pet_images',
        'pet_images.petId = pets.petId',
      );

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
        const { petId, photos, ...pet } = petRaw;

        const { father, mother } =
          await this.parentRequestService.getParentsWithRequestStatus(petId);
        const fatherDisplayable = this.getParentPublicSafe(father, userId);
        const motherDisplayable = this.getParentPublicSafe(mother, userId);

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
          photos: photos?.files,
        });

        return petDto;
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

      try {
        await entityManager.update(
          PetEntity,
          { petId },
          {
            name: `DELETED_${existingPet.name}_${Date.now()}`,
            isDeleted: true,
          },
        );

        if (existingPet.type === PET_TYPE.PET) {
          // 자식 펫이 있는지 확인 (이 펫을 부모로 하는 펫들)
          const childrenPets = await entityManager.existsBy(
            ParentRequestEntity,
            {
              parentPetId: petId,
              status: In([PARENT_STATUS.APPROVED, PARENT_STATUS.PENDING]),
            },
          );

          if (childrenPets) {
            throw new BadRequestException('자식 펫이 있어 삭제할 수 없습니다.');
          }

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

        // 연관된 parent_request들을 모두 삭제 상태로 변경
        await this.parentRequestService.deleteAllParentRequestsByPet(
          petId,
          entityManager,
        );

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
      .leftJoinAndMapOne(
        'pets.petDetail',
        'pet_details',
        'petDetail',
        'petDetail.petId = pets.petId',
      )
      .leftJoinAndMapOne(
        'pets.eggDetail',
        'egg_details',
        'eggDetail',
        'eggDetail.petId = pets.petId',
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
        'petDetail.sex',
        'petDetail.morphs',
        'petDetail.traits',
        'petDetail.foods',
        'petDetail.weight',
        'eggDetail.temperature',
        'eggDetail.status',
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
        const fatherDisplayable = this.getParentPublicSafe(father, userId);
        const motherDisplayable = this.getParentPublicSafe(mother, userId);

        return plainToInstance(PetDto, {
          ...pet,
          owner,
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

    // EGG인 펫들의 layingDate 정보 가져오기
    const eggPetIds = petEntities
      .filter((pet) => pet.type === PET_TYPE.EGG && pet.layingId)
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

        if (petDto.type === PET_TYPE.EGG) {
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
      queryBuilder.andWhere(
        'pets.name LIKE :keyword OR pets.desc LIKE :keyword',
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
      queryBuilder.andWhere('petDetail.sex = :sex', {
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
      const morphsJson = JSON.stringify(pageOptionsDto.morphs);
      queryBuilder.andWhere(`JSON_CONTAINS(petDetail.morphs, :morphs)`, {
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
    if (pageOptionsDto.status) {
      queryBuilder.andWhere('adoptions.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth) {
      queryBuilder.andWhere('petDetail.growth = :growth', {
        growth: pageOptionsDto.growth,
      });
    }
  }

  private getParentPublicSafe(parent: PetParentDto | null, userId: string) {
    if (!parent) return null;

    if (
      parent.isDeleted ||
      (!parent.isPublic && parent.owner?.userId !== userId)
    ) {
      return { isHidden: true };
    }

    return parent;
  }
}
