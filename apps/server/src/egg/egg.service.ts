import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EggEntity } from './egg.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateEggDto,
  CreateEggHatchDto,
  EggDto,
  EggSummaryDto,
  UpdateEggDto,
} from './egg.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ParentService } from 'src/parent/parent.service';
import { PageDto, PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import { PARENT_ROLE } from 'src/parent/parent.constant';
import { PetParentDto } from 'src/pet/pet.dto';
import { ParentDto } from 'src/parent/parent.dto';
import { PetService } from 'src/pet/pet.service';

@Injectable()
export class EggService {
  constructor(
    @InjectRepository(EggEntity)
    private readonly eggRepository: Repository<EggEntity>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
    @Inject(forwardRef(() => PetService))
    private readonly petService: PetService,
  ) {}

  async createEgg(
    inputEggData: { eggId: string; ownerId: string } & CreateEggDto,
  ): Promise<void> {
    const eggData = plainToInstance(EggEntity, inputEggData);
    await this.eggRepository.insert(eggData);

    // TODO: is_egg = true
    if (inputEggData.father) {
      await this.parentService.createParent(
        inputEggData.eggId,
        inputEggData.father,
        {
          isDirectApprove: !!inputEggData.father.isMyPet,
        },
      );
    }
    if (inputEggData.mother) {
      await this.parentService.createParent(
        inputEggData.eggId,
        inputEggData.mother,
        {
          isDirectApprove: !!inputEggData.mother.isMyPet,
        },
      );
    }
  }

  async getEggListFull(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<EggDto>> {
    const { data, pageMeta } = await this.getEggList<EggDto>(
      pageOptionsDto,
      EggDto,
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
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.createEggWithOwnerQueryBuilder();

    queryBuilder
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

  async updateEgg(eggId: string, updateEggDto: UpdateEggDto): Promise<void> {
    const { father, mother, ...updateData } = updateEggDto;

    await this.eggRepository.update({ egg_id: eggId }, updateData);

    if (father) {
      await this.parentService.createParent(eggId, father, {
        isDirectApprove: !!father.isMyPet,
      });
    }
    if (mother) {
      await this.parentService.createParent(eggId, mother, {
        isDirectApprove: !!mother.isMyPet,
      });
    }
  }

  async deleteEgg(eggId: string): Promise<void> {
    await this.eggRepository.update({ egg_id: eggId }, { is_deleted: true });
  }

  async convertEggToPet(
    eggId: string,
    ownerId: string,
    createEggHatchDto: CreateEggHatchDto,
  ): Promise<{ petId: string }> {
    const { father, mother } = await this.parentService.findParents(eggId);

    const { petId } = await this.petService.createPet({
      ...createEggHatchDto,
      growth: '베이비',
      sex: 'N',
      ownerId,
    });

    if (father) {
      await this.parentService.createParent(
        petId,
        {
          parentId: father.parent_id,
          role: PARENT_ROLE.FATHER,
          isMyPet: father.is_my_pet,
        },
        {
          isDirectApprove: true,
        },
      );
    }
    if (mother) {
      await this.parentService.createParent(
        petId,
        {
          parentId: mother.parent_id,
          role: PARENT_ROLE.MOTHER,
          isMyPet: mother.is_my_pet,
        },
        {
          isDirectApprove: true,
        },
      );
    }

    await this.eggRepository.update(
      { egg_id: eggId },
      {
        pet_id: petId,
        hatching_date: createEggHatchDto.birthdate,
        is_deleted: true,
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

  private createEggWithOwnerQueryBuilder() {
    return this.eggRepository
      .createQueryBuilder('eggs')
      .leftJoinAndMapOne(
        'eggs.owner',
        'users',
        'users',
        'users.user_id = eggs.owner_id',
      )
      .where('eggs.is_deleted = :isDeleted', { isDeleted: false });
  }
}
