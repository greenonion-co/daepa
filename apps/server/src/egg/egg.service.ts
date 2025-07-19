import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EggEntity } from './egg.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEggDto, EggDto, EggSummaryDto, UpdateEggDto } from './egg.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ParentService } from 'src/parent/parent.service';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
  PageOptionsDtoWithDateRange,
} from 'src/common/page.dto';
import { PARENT_ROLE } from 'src/parent/parent.constant';
import { CreatePetDto, PetParentDto } from 'src/pet/pet.dto';
import {
  CreateParentDto,
  ParentBaseDto,
  ParentDto,
} from 'src/parent/parent.dto';
import { PetService } from 'src/pet/pet.service';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';
import { PET_SEX } from 'src/pet/pet.constants';
import { format, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class EggService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(EggEntity)
    private readonly eggRepository: Repository<EggEntity>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
    @Inject(forwardRef(() => PetService))
    private readonly petService: PetService,
  ) {}

  private async generateUniqueEggId(): Promise<string> {
    let attempts = 0;
    while (attempts < this.MAX_RETRIES) {
      const eggId = nanoid(8);
      const existingEgg = await this.eggRepository.findOne({
        where: { eggId },
      });
      if (!existingEgg) {
        return eggId;
      }
      attempts++;
    }
    throw new HttpException(
      {
        statusCode: HttpStatus.CONFLICT,
        message:
          '알 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
      },
      HttpStatus.CONFLICT,
    );
  }

  async createEgg(
    inputEggData: { ownerId: string } & CreateEggDto,
  ): Promise<{ eggId: string }[]> {
    const { clutchCount, ...createEggInput } = inputEggData;
    const { father, mother, clutch, layingDate } = createEggInput;

    const createdEggs = [] as { eggId: string }[];
    for (let index = 1; index <= clutchCount; index++) {
      const eggId = await this.generateUniqueEggId();
      const eggName = await this.createEggName({
        father,
        mother,
        clutch,
        clutchOrder: index,
      });

      const eggEntity = plainToInstance(EggEntity, {
        ...createEggInput,
        name: eggName,
        eggId,
        clutchOrder: index,
      });
      try {
        await this.eggRepository.insert(eggEntity);

        if (father) {
          await this.parentService.createParent(
            inputEggData.ownerId,
            eggId,
            father,
            {
              isEgg: true,
            },
          );
        }
        if (mother) {
          await this.parentService.createParent(
            inputEggData.ownerId,
            eggId,
            mother,
            {
              isEgg: true,
            },
          );
        }

        createdEggs.push({ eggId });
      } catch (error) {
        if (isMySQLError(error) && error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('UNIQUE_CLUTCH')) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message:
                  '중복되는 알 정보가 있습니다.' +
                  `(father: ${father?.parentId}, mother: ${mother?.parentId}, layingDate: ${layingDate}, clutch: ${clutch}, clutchOrder: ${index})`,
              },
              HttpStatus.CONFLICT,
            );
          }
        }
        throw error;
      }
    }

    return createdEggs;
  }

  async getEggListFull(
    eggListPageOptionsDto: PageOptionsDtoWithDateRange,
  ): Promise<PageDto<EggDto>> {
    const { startYmd, endYmd, ...pageOptionsDto } = eggListPageOptionsDto;
    const { data, pageMeta } = await this.getEggList<EggDto>(
      pageOptionsDto as PageOptionsDto,
      EggDto,
      { startYmd, endYmd },
    );

    const eggListFullWithParent = await Promise.all(
      data.map(async (egg) => {
        const father = await this.getParent(egg.eggId, PARENT_ROLE.FATHER);
        if (father) {
          egg.father = plainToInstance(PetParentDto, father);
        }
        const mother = await this.getParent(egg.eggId, PARENT_ROLE.MOTHER);
        if (mother) {
          egg.mother = plainToInstance(PetParentDto, mother);
        }
        return egg;
      }),
    );

    return new PageDto(eggListFullWithParent, pageMeta);
  }

  async getEggList<T extends EggDto>(
    pageOptionsDto: PageOptionsDto,
    dtoClass: new () => T,
    dateRange?: { startYmd?: number; endYmd?: number },
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.createEggWithOwnerQueryBuilder();

    const layingDateFrom =
      dateRange?.startYmd ??
      Number(format(startOfMonth(new Date()), 'yyyyMMdd'));
    const layingDateTo =
      dateRange?.endYmd ?? Number(format(endOfMonth(new Date()), 'yyyyMMdd'));

    queryBuilder
      .andWhere('eggs.laying_date >= :startYmd', {
        startYmd: layingDateFrom,
      })
      .andWhere('eggs.laying_date <= :endYmd', {
        endYmd: layingDateTo,
      })
      .orderBy('eggs.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const eggList = entities.map((entity) => instanceToPlain(entity));
    const eggDtos = eggList.map((egg) => plainToInstance(dtoClass, egg));
    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return {
      data: eggDtos,
      pageMeta: pageMetaDto,
    };
  }

  async getEggListByDate(
    dateRange: { startYmd?: number; endYmd?: number },
    userId?: string,
  ) {
    const queryBuilder = this.createEggWithOwnerAndParentQueryBuilder(userId);

    const layingDateFrom =
      dateRange?.startYmd ??
      Number(format(startOfMonth(new Date()), 'yyyyMMdd'));
    const layingDateTo =
      dateRange?.endYmd ?? Number(format(endOfMonth(new Date()), 'yyyyMMdd'));

    queryBuilder
      .andWhere('eggs.laying_date >= :startYmd', {
        startYmd: layingDateFrom,
      })
      .andWhere('eggs.laying_date <= :endYmd', {
        endYmd: layingDateTo,
      });

    const { entities } = await queryBuilder.getRawAndEntities();
    const eggList = entities.map((entity) => {
      const egg = instanceToPlain(entity);
      const { parents, ...eggData } = egg;
      const father = (parents as ParentBaseDto[])?.find(
        (parent) => parent.role === PARENT_ROLE.FATHER,
      );
      const mother = (parents as ParentBaseDto[])?.find(
        (parent) => parent.role === PARENT_ROLE.MOTHER,
      );
      return plainToInstance(EggDto, {
        ...eggData,
        father, // TODO: dto 타입 수정을 통해 불필요한 필드 제거하기
        mother,
      });
    });
    const eggDtosByDate = eggList.reduce(
      (acc, eggDto) => {
        const layingDate = eggDto.layingDate;
        if (!acc[layingDate]) {
          acc[layingDate] = [];
        }
        acc[layingDate].push(eggDto);
        return acc;
      },
      {} as Record<number, EggDto[]>,
    );

    return eggDtosByDate;
  }

  async getEgg(eggId: string): Promise<EggDto | null> {
    const queryBuilder = this.createEggWithOwnerQueryBuilder();
    const eggEntity = await queryBuilder
      .where('eggs.egg_id = :eggId', { eggId })
      .getOne();

    if (!eggEntity) {
      return null;
    }

    const egg = instanceToPlain(eggEntity);

    if (typeof egg.eggId === 'string') {
      egg.father = await this.getParent(egg.eggId, PARENT_ROLE.FATHER);
    }
    if (typeof egg.eggId === 'string') {
      egg.mother = await this.getParent(egg.eggId, PARENT_ROLE.MOTHER);
    }

    const eggDto = plainToInstance(EggDto, egg);

    return eggDto;
  }

  async getEggSummary(eggId: string): Promise<EggSummaryDto | null> {
    const queryBuilder = this.createEggWithOwnerQueryBuilder();
    const eggEntity = await queryBuilder
      .where('eggs.egg_id = :eggId', { eggId })
      .getOne();

    if (!eggEntity) {
      return null;
    }

    const egg = instanceToPlain(eggEntity);
    const eggSummaryDto = plainToInstance(EggSummaryDto, egg);

    return eggSummaryDto;
  }

  async updateEgg(
    userId: string,
    eggId: string,
    updateEggDto: UpdateEggDto,
  ): Promise<void> {
    const { father, mother, ...updateData } = updateEggDto;

    await this.eggRepository.update(
      { eggId },
      plainToInstance(EggEntity, updateData),
    );

    if (father) {
      await this.parentService.createParent(userId, eggId, father, {
        isEgg: true,
      });
    }
    if (mother) {
      await this.parentService.createParent(userId, eggId, mother, {
        isEgg: true,
      });
    }
  }

  async deleteEgg(eggId: string): Promise<void> {
    await this.eggRepository.update({ eggId }, { isDeleted: true });
  }

  async convertEggToPet(
    eggId: string,
    ownerId: string,
  ): Promise<{ petId: string }> {
    // TODO: 본인 소유 알 여부 검증

    const egg = await this.getEgg(eggId);
    if (!egg) {
      throw new HttpException(
        { statusCode: HttpStatus.NOT_FOUND, message: '알을 찾을 수 없습니다.' },
        HttpStatus.NOT_FOUND,
      );
    }

    const createPetDto: CreatePetDto = {
      name: egg.name,
      species: egg.species,
      sex: PET_SEX.NON,
      growth: '베이비',
    };

    const { father, mother } = await this.parentService.findParents(eggId);
    if (father) {
      createPetDto.father = {
        parentId: father.parentId,
        role: father.role,
      };
    }
    if (mother) {
      createPetDto.mother = {
        parentId: mother.parentId,
        role: mother.role,
      };
    }

    const { petId } = await this.petService.createPet({
      ownerId,
      isHatchingFromEgg: true,
      ...createPetDto,
    });

    await this.eggRepository.update(
      { eggId },
      {
        hatchedPetId: petId,
      },
    );

    return { petId };
  }

  private async getParent(
    eggId: string,
    role: PARENT_ROLE,
  ): Promise<Partial<ParentDto> | null> {
    const parentInfo = await this.parentService.findOne(eggId, {
      role,
    });
    if (!parentInfo) return null;

    const parentPetSummary = await this.petService.getPetSummary(
      parentInfo.parentId,
    );
    return {
      ...parentPetSummary,
      relationId: parentInfo.relationId,
      status: parentInfo.status,
    };
  }

  private async createEggName({
    father,
    mother,
    clutch,
    clutchOrder,
  }: {
    father?: CreateParentDto;
    mother?: CreateParentDto;
    clutch?: number;
    clutchOrder: number;
  }) {
    let fatherName = '@';
    let motherName = '@';
    if (father?.parentId) {
      const petName = await this.petService.getPetName(father.parentId);
      if (petName) {
        fatherName = petName;
      }
    }
    if (mother?.parentId) {
      const petName = await this.petService.getPetName(mother.parentId);
      if (petName) {
        motherName = petName;
      }
    }

    return `${fatherName}x${motherName}(${clutch ?? '@'}-${clutchOrder})`;
  }

  private createEggWithOwnerQueryBuilder() {
    return this.eggRepository
      .createQueryBuilder('eggs')
      .leftJoinAndMapOne(
        'eggs.owner',
        'users',
        'users',
        'users.user_id = eggs.owner_id',
      )
      .where('eggs.is_deleted = :isDeleted', { isDeleted: false })
      .select([
        'eggs',
        'users.user_id',
        'users.name',
        'users.role',
        'users.is_biz',
        'users.status',
      ]);
  }

  private createEggWithOwnerAndParentQueryBuilder(userId?: string) {
    const queryBuilder = this.eggRepository
      .createQueryBuilder('eggs')
      .leftJoinAndMapOne(
        'eggs.owner',
        'users',
        'users',
        'users.user_id = eggs.owner_id',
      )
      .leftJoinAndMapMany(
        'eggs.parents',
        'parents',
        'parents',
        'parents.pet_id = eggs.egg_id',
      )
      .where('eggs.is_deleted = :isDeleted', { isDeleted: false })
      .select([
        'eggs',
        'parents',
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
}
