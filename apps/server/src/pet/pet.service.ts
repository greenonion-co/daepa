import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePetDto,
  PetParentDto,
  PetSummaryDto,
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

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
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
  ): Promise<{ data: T[]; pageMeta: PageMetaDto }> {
    const queryBuilder = this.createPetWithOwnerQueryBuilder();

    queryBuilder
      .orderBy('pets.id', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const petList = entities.map((entity) => instanceToPlain(entity));
    const petDtos = petList.map((pet) => plainToInstance(dtoClass, pet));
    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return {
      data: petDtos,
      pageMeta: pageMetaDto,
    };
  }

  async getPetListFull(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetDto>> {
    const { data, pageMeta } = await this.getPetList<PetDto>(
      pageOptionsDto,
      PetDto,
    );

    const petListFullWithParent = await Promise.all(
      data.map(async (pet) => {
        const father = await this.getParent(pet.petId, PARENT_ROLE.FATHER);
        if (father) {
          pet.father = plainToInstance(PetParentDto, father);
        }
        const mother = await this.getParent(pet.petId, PARENT_ROLE.MOTHER);
        if (mother) {
          pet.mother = plainToInstance(PetParentDto, mother);
        }
        return pet;
      }),
    );

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

    await this.petRepository.update({ pet_id: petId }, updateData);

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

  private createPetWithOwnerQueryBuilder() {
    return this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.user_id = pets.owner_id',
      )
      .where('pets.is_deleted = :isDeleted', { isDeleted: false });
  }

  async getPetOwnerId(petId: string): Promise<string | null> {
    const result = await this.petRepository
      .createQueryBuilder('pets')
      .select('pets.owner_id')
      .where('pets.pet_id = :petId', { petId })
      .getOne();

    return result?.owner_id || null;
  }
}
