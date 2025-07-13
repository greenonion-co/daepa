import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdoptionDto,
  CreateAdoptionDto,
  UpdateAdoptionDto,
  AdoptionSummaryDto,
} from './adoption.dto';
import { PetService } from 'src/pet/pet.service';
import { UserService } from 'src/user/user.service';
import { nanoid } from 'nanoid';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';
import { PET_SALE_STATUS } from 'src/pet/pet.constants';
import { PetSummaryDto } from 'src/pet/pet.dto';

@Injectable()
export class AdoptionService {
  constructor(
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly petService: PetService,
    private readonly userService: UserService,
  ) {}

  private generateAdoptionId(): string {
    return `${nanoid(8)}`;
  }

  async createAdoption(
    sellerId: string,
    createAdoptionDto: CreateAdoptionDto,
  ): Promise<AdoptionDto> {
    // 펫 존재 여부 확인
    const pet = await this.petService.getPet(createAdoptionDto.petId);
    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    // 펫 소유자 확인
    // if (pet.owner.userId !== sellerId) {
    //   throw new BadRequestException('펫의 소유자가 아닙니다.');
    // }

    // 이미 분양 정보가 있는지 확인
    const existingAdoption = await this.adoptionRepository.findOne({
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

    const saveAdoptionEntity =
      await this.adoptionRepository.save(adoptionEntity);

    if (createAdoptionDto.saleStatus) {
      await this.petService.updatePet(sellerId, createAdoptionDto.petId, {
        saleStatus: createAdoptionDto.saleStatus,
      });
    } else {
      if (createAdoptionDto.buyerId) {
        await this.petService.updatePet(sellerId, createAdoptionDto.petId, {
          saleStatus: PET_SALE_STATUS.ON_RESERVATION,
        });
      } else {
        await this.petService.updatePet(sellerId, createAdoptionDto.petId, {
          saleStatus: PET_SALE_STATUS.ON_SALE,
        });
      }
    }

    if (createAdoptionDto.saleStatus === PET_SALE_STATUS.SOLD) {
      await this.petService.deletePet(createAdoptionDto.petId);
    }

    const adoption = instanceToPlain(saveAdoptionEntity);

    return plainToInstance(AdoptionDto, adoption);
  }

  async findAll(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdoptionSummaryDto>> {
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
      .orderBy('adoptions.created_at', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const adoptionEntities = await queryBuilder.getMany();

    const adoptions = instanceToPlain(adoptionEntities);
    const adoptionSummaryDtos = adoptions.map((adoption) => {
      if (adoption.price !== undefined && adoption.price !== null) {
        adoption.price = Math.floor(Number(adoption.price));
      }

      // pet 정보를 PetSummaryDto로 변환
      if (adoption.pet) {
        adoption.pet = plainToInstance(PetSummaryDto, adoption.pet);
      }

      return plainToInstance(AdoptionSummaryDto, adoption);
    });

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });

    return new PageDto(adoptionSummaryDtos, pageMetaDto);
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
      const value = where[key];
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

  async findByAdoptionId(adoptionId: string): Promise<AdoptionDto | null> {
    return this.findOne({ adoption_id: adoptionId });
  }

  async updateAdoption(
    adoptionId: string,
    updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<AdoptionDto> {
    const adoptionEntity = await this.adoptionRepository.findOne({
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

    // 기존 Entity에 업데이트할 필드들만 덮어쓰기
    if (updateAdoptionDto.adoptionDate !== undefined) {
      adoptionEntity.adoption_date = new Date(updateAdoptionDto.adoptionDate);
    }
    if (updateAdoptionDto.price !== undefined) {
      adoptionEntity.price = updateAdoptionDto.price;
    }
    if (updateAdoptionDto.buyerId !== undefined) {
      adoptionEntity.buyer_id = updateAdoptionDto.buyerId;
    }
    if (updateAdoptionDto.memo !== undefined) {
      adoptionEntity.memo = updateAdoptionDto.memo;
    }
    if (updateAdoptionDto.location !== undefined) {
      adoptionEntity.location = updateAdoptionDto.location;
    }

    const savedAdoption = await this.adoptionRepository.save(adoptionEntity);

    // saleStatus 로직 추가
    if (updateAdoptionDto.saleStatus) {
      await this.petService.updatePet(
        adoptionEntity.seller_id,
        adoptionEntity.pet_id,
        {
          saleStatus: updateAdoptionDto.saleStatus,
        },
      );
    } else {
      if (updateAdoptionDto.buyerId) {
        await this.petService.updatePet(
          adoptionEntity.seller_id,
          adoptionEntity.pet_id,
          {
            saleStatus: PET_SALE_STATUS.ON_RESERVATION,
          },
        );
      } else {
        await this.petService.updatePet(
          adoptionEntity.seller_id,
          adoptionEntity.pet_id,
          {
            saleStatus: PET_SALE_STATUS.ON_SALE,
          },
        );
      }
    }

    if (updateAdoptionDto.saleStatus === PET_SALE_STATUS.SOLD) {
      await this.petService.deletePet(adoptionEntity.pet_id);
    }

    const adoption = instanceToPlain(savedAdoption);

    return plainToInstance(AdoptionDto, adoption);
  }
}
