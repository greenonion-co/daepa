import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsWhere,
  Repository,
  EntityManager,
  DataSource,
} from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdoptionDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
} from './adoption.dto';
import { PetService } from 'src/pet/pet.service';
import { UserService } from 'src/user/user.service';
import { nanoid } from 'nanoid';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import { ADOPTION_SALE_STATUS } from 'src/pet/pet.constants';
import { PetSummaryDto } from 'src/pet/pet.dto';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly petService: PetService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  private generateAdoptionId(): string {
    return nanoid(8);
  }

  private toAdoptionDto(entity: AdoptionEntity): AdoptionDto {
    const plain = instanceToPlain(entity);
    return plainToInstance(AdoptionDto, {
      ...plain,
      price: plain.price ? Math.floor(Number(plain.price)) : undefined,
      pet: plain.pet ? plainToInstance(PetSummaryDto, plain.pet) : undefined,
    });
  }

  private async updatePetStatus(
    entityManager: EntityManager,
    petId: string,
    newAdoptionDto: UpdateAdoptionDto,
  ) {
    const status =
      newAdoptionDto.status ||
      (newAdoptionDto.buyerId
        ? ADOPTION_SALE_STATUS.ON_RESERVATION
        : ADOPTION_SALE_STATUS.ON_SALE);

    if (status === ADOPTION_SALE_STATUS.SOLD) {
      if (newAdoptionDto.buyerId) {
        await entityManager.update(
          'pets',
          { pet_id: petId },
          {
            owner_id: newAdoptionDto.buyerId,
          },
        );
      } else {
        await entityManager.update(
          'pets',
          { pet_id: petId },
          { owner_id: null },
        );
      }
    }
  }

  private updateEntityFields<T extends object, U extends object>(
    entity: T,
    updateDto: U,
    fieldMappings: Partial<Record<keyof U, (value: any) => Partial<T>>>,
  ): void {
    Object.entries(fieldMappings).forEach(([key, mapper]) => {
      const value = updateDto[key as keyof U];
      if (value !== undefined && mapper) {
        Object.assign(entity, (mapper as (value: any) => Partial<T>)(value));
      }
    });
  }
  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 펫 존재 여부 확인
      const pet = await this.petService.getPet(createAdoptionDto.petId);
      if (!pet) {
        throw new NotFoundException('펫을 찾을 수 없습니다.');
      }

      if (pet.owner?.userId !== sellerId) {
        throw new BadRequestException('펫의 소유자가 아닙니다.');
      }

      // 이미 분양 정보가 있는지 확인
      const existingAdoption = await entityManager.findOne(AdoptionEntity, {
        where: {
          pet_id: createAdoptionDto.petId,
          is_deleted: false,
        },
      });

      if (existingAdoption) {
        throw new BadRequestException('이미 분양 정보가 있습니다.');
      }

      if (createAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          user_id: createAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const adoptionId = this.generateAdoptionId();

      const adoptionEntity = plainToInstance(AdoptionEntity, {
        ...createAdoptionDto,
        adoptionId,
        sellerId,
        buyerId: createAdoptionDto.buyerId,
      });

      await entityManager.save(AdoptionEntity, adoptionEntity);

      await this.updatePetStatus(
        entityManager,
        createAdoptionDto.petId,
        createAdoptionDto,
      );

      return { adoptionId };
    });
  }

  async findAll(
    pageOptionsDto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<AdoptionDto>> {
    const queryBuilder = this.adoptionRepository
      .createQueryBuilder('adoptions')
      .leftJoinAndMapOne(
        'adoptions.pet',
        'pets',
        'pets',
        'pets.pet_id = adoptions.pet_id',
      )
      .leftJoinAndMapOne(
        'adoptions.seller',
        'users',
        'seller',
        'seller.user_id = adoptions.seller_id',
      )
      .leftJoinAndMapOne(
        'adoptions.buyer',
        'users',
        'buyer',
        'buyer.user_id = adoptions.buyer_id',
      )
      .where('adoptions.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('adoptions.seller_id = :userId', { userId })
      .orderBy('adoptions.created_at', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const adoptionEntities = await queryBuilder.getMany();

    const adoptionDtos = adoptionEntities.map((adoption) =>
      this.toAdoptionDto(adoption),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return new PageDto(adoptionDtos, pageMetaDto);
  }

  async findOne(
    where: FindOptionsWhere<AdoptionEntity>,
  ): Promise<AdoptionDto | null> {
    const queryBuilder = this.adoptionRepository
      .createQueryBuilder('adoptions')
      .leftJoinAndMapOne(
        'adoptions.pet',
        'pets',
        'pets',
        'pets.pet_id = adoptions.pet_id',
      )
      .leftJoinAndMapOne(
        'adoptions.seller',
        'users',
        'seller',
        'seller.user_id = adoptions.seller_id',
      )
      .leftJoinAndMapOne(
        'adoptions.buyer',
        'users',
        'buyer',
        'buyer.user_id = adoptions.buyer_id',
      )
      .where('adoptions.is_deleted = :isDeleted', { isDeleted: false });

    // where 조건 추가
    Object.keys(where).forEach((key) => {
      const value = where[key as keyof typeof where];
      if (value !== undefined) {
        queryBuilder.andWhere(`adoptions.${key} = :${key}`, { [key]: value });
      }
    });

    const adoptionEntity = await queryBuilder.getOne();

    if (!adoptionEntity) {
      return null;
    }

    const adoption = instanceToPlain(adoptionEntity);

    if (adoption.price !== undefined && adoption.price !== null) {
      adoption.price = Math.floor(Number(adoption.price));
    }

    return plainToInstance(AdoptionDto, adoption);
  }

  async findByAdoptionId(adoptionId: string): Promise<AdoptionDto> {
    const adoption = await this.findOne({ adoption_id: adoptionId });

    if (!adoption) {
      throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
    }

    return adoption;
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<{ adoptionId: string }> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const adoptionEntity = await entityManager.findOne(AdoptionEntity, {
        where: { adoption_id: adoptionId, is_deleted: false },
      });

      if (!adoptionEntity) {
        throw new NotFoundException('분양 정보를 찾을 수 없습니다.');
      }

      if (updateAdoptionDto.buyerId) {
        const buyer = await this.userService.findOne({
          user_id: updateAdoptionDto.buyerId,
        });
        if (!buyer) {
          throw new NotFoundException('입양자를 찾을 수 없습니다.');
        }
      }

      const fieldMappings: Partial<
        Record<keyof UpdateAdoptionDto, (value: any) => Partial<AdoptionEntity>>
      > = {
        adoptionDate: (value: Date) => ({ adoption_date: new Date(value) }),
        price: (value: number) => ({ price: value }),
        buyerId: (value: string) => ({ buyer_id: value }),
        memo: (value: string) => ({ memo: value }),
        location: (value: string) => ({ location: value }),
        status: (value: ADOPTION_SALE_STATUS) => ({ status: value }),
      };

      this.updateEntityFields(adoptionEntity, updateAdoptionDto, fieldMappings);

      await entityManager.save(AdoptionEntity, adoptionEntity);

      await this.updatePetStatus(
        entityManager,
        adoptionEntity.pet_id,
        updateAdoptionDto,
      );

      return { adoptionId };
    });
  }
}
