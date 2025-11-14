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
  PetSingleDto,
  PetParentDto,
} from './pet.dto';
import {
  PET_GROWTH,
  PET_SEX,
  ADOPTION_SALE_STATUS,
  PET_LIST_FILTER_TYPE,
  PET_TYPE,
  PET_HIDDEN_STATUS,
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

  async findPetByPetId(petId: string): Promise<PetSingleDto> {
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

      const { growth, sex, morphs, traits, foods, weight } = petDetail ?? {};
      const { temperature, status: eggStatus } = eggDetail ?? {};

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
        photos: files,
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
        const fatherDisplayable = this.getParentPublicSafe(
          father,
          petRaw.ownerId,
          userId,
        );
        const motherDisplayable = this.getParentPublicSafe(
          mother,
          petRaw.ownerId,
          userId,
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
        const fatherDisplayable = this.getParentPublicSafe(
          father,
          petRaw.ownerId,
          userId,
        );
        const motherDisplayable = this.getParentPublicSafe(
          mother,
          petRaw.ownerId,
          userId,
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

  async getParentsByPetId(petId: string, userId: string) {
    const { father, mother } =
      await this.parentRequestService.getParentsWithRequestStatus(petId);
    const fatherDisplayable = this.getParentPublicSafe(father, userId, userId);
    const motherDisplayable = this.getParentPublicSafe(mother, userId, userId);
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
        const fatherDisplayable = this.getParentPublicSafe(
          father,
          pet.ownerId,
          userId,
        );
        const motherDisplayable = this.getParentPublicSafe(
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

  private getParentPublicSafe(
    parent: PetParentDto | null,
    childOwnerId: string | null,
    userId: string,
  ) {
    if (!parent) return null;

    // 본인 소유 펫
    const isMyPet = childOwnerId === userId;
    if (isMyPet) {
      return parent;
    }

    // 부모 개체 삭제 처리
    if (parent.isDeleted) {
      return { hiddenStatus: PET_HIDDEN_STATUS.DELETED };
    }
    // 비공개 처리
    if (!parent.isPublic) {
      return { hiddenStatus: PET_HIDDEN_STATUS.SECRET };
    }
    // 부모 요청중
    if (parent.status === PARENT_STATUS.PENDING) {
      return { hiddenStatus: PET_HIDDEN_STATUS.PENDING };
    }
  }
}
