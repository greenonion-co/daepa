import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { PetImageItem, UpsertPetImageDto } from './pet_image.dto';
import { R2Service } from 'src/common/cloudflare/r2.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PetEntity } from '../pet/pet.entity';
import { CacheService } from 'src/common/cache.service';
import { CACHE } from 'src/common/cache-keys';

@Injectable()
export class PetImageService {
  constructor(
    private readonly r2Service: R2Service,
    @InjectRepository(PetImageEntity)
    private readonly petImageRepository: Repository<PetImageEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async findOneByPetId(petId: string): Promise<PetImageItem[]> {
    return this.cacheService.wrap(
      CACHE.petImages.key(petId),
      async () => {
        const petImage = await this.petImageRepository.findOne({
          where: { petId },
        });
        return petImage?.files ?? [];
      },
      CACHE.petImages.ttl,
    );
  }

  async findThumbnailByPetId(petId: string): Promise<PetImageItem | null> {
    const files = await this.findOneByPetId(petId);
    return files.length > 0 ? files[0] : null;
  }

  /**
   * 펫 이미지를 R2에 업로드하고 DB에 저장
   * 1. 펫 존재 및 소유자 검증 (bulk-create는 직전 INSERT 보장으로 스킵)
   * 2. R2에 PENDING 이미지 업로드 (트랜잭션 외부)
   * 3. DB에 이미지 정보 저장 (트랜잭션 내부)
   */
  async saveAndUploadConfirmedImages(
    petId: string,
    imageList: UpsertPetImageDto[],
    userId: string,
    type: 'create' | 'update' | 'bulk-create',
    manager?: EntityManager,
  ) {
    // 타입 검증
    if (!['create', 'update', 'bulk-create'].includes(type)) {
      throw new ForbiddenException('잘못된 요청입니다.');
    }

    // 1. 펫 존재 및 소유자 검증 (트랜잭션 외부에서 먼저 확인)
    // bulk-create는 호출 직전 트랜잭션에서 펫을 INSERT한 후 호출되므로 검증 SELECT를 스킵
    if (type !== 'bulk-create') {
      const em = manager || this.dataSource.manager;
      await this.validatePetOwnership(em, petId, userId, type);
    }

    // 2. R2 업로드 (트랜잭션 외부에서 수행하여 트랜잭션 시간 최소화)
    const savedImageList = await this.uploadPendingImages(imageList, petId);

    // 3. DB 저장 (트랜잭션 내부)
    const run = async (entityManager: EntityManager) => {
      return this.saveToDatabase(petId, savedImageList, entityManager);
    };

    if (manager) {
      const result = await run(manager);
      await this.invalidateImageCache(petId);
      return result;
    }

    const result = await this.dataSource.transaction(
      async (entityManager: EntityManager) => {
        return run(entityManager);
      },
    );
    await this.invalidateImageCache(petId);
    return result;
  }

  /**
   * 펫 존재 여부 및 소유자 검증
   * @private
   */
  private async validatePetOwnership(
    em: EntityManager,
    petId: string,
    userId: string,
    type: 'create' | 'update' | 'bulk-create',
  ): Promise<PetEntity> {
    const pet = await em.findOne(PetEntity, {
      where: { petId, isDeleted: false },
    });

    if (!pet) {
      throw new NotFoundException('펫을 찾을 수 없습니다.');
    }

    // update일 때만 소유자 검증 (create는 새로 만드는 것이므로 소유자 검증 불필요)
    if (type === 'update' && pet.ownerId !== userId) {
      throw new ForbiddenException('펫의 소유자가 아닙니다.');
    }

    return pet;
  }

  /**
   * PENDING 이미지를 R2에 업로드하고 최종 이미지 리스트 반환
   * @private
   */
  private async uploadPendingImages(
    imageList: UpsertPetImageDto[],
    petId: string,
  ): Promise<PetImageItem[]> {
    // 원본 순서를 유지하면서 인덱스와 상태를 추적
    const imageWithIndexAndStatus = imageList.map((image, index) => ({
      index,
      originalImage: image,
      isPending: image.fileName.startsWith('PENDING/'),
    }));

    // pending 이미지만 필터링하여 병렬 처리
    const pendingImages = imageWithIndexAndStatus.filter(
      (item) => item.isPending,
    );

    // PENDING 이미지가 없으면 바로 반환
    if (pendingImages.length === 0) {
      return imageList.map((image) => ({
        fileName: image.fileName,
        url: image.url,
        mimeType: image.mimeType,
        size: image.size,
      }));
    }

    try {
      // 병렬로 R2 업로드 처리
      const uploadResults = await Promise.allSettled(
        pendingImages.map(async (item) => ({
          index: item.index,
          result: await this.r2Service.updateFileKey(
            item.originalImage.fileName,
            item.originalImage.fileName.replace('PENDING/', `${petId}/`),
          ),
        })),
      );

      // 실패한 업로드 확인
      const failed = uploadResults.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        const errorMessages = failed
          .map((r) => {
            if (r.status === 'rejected') {
              const error = r.reason as Error;
              return error?.message || '알 수 없는 오류';
            }
            return '';
          })
          .filter(Boolean)
          .join(', ');

        throw new Error(
          `${failed.length}개 이미지 업로드 실패: ${errorMessages}`,
        );
      }

      // 성공한 결과만 추출
      const successResults = uploadResults
        .filter(
          (
            r,
          ): r is PromiseFulfilledResult<{
            index: number;
            result: { fileName: string; url: string };
          }> => r.status === 'fulfilled',
        )
        .map((r) => r.value);

      // 업로드 결과를 Map으로 변환 (빠른 조회)
      const uploadResultMap = new Map(
        successResults.map((ur) => [ur.index, ur.result]),
      );

      // 원본 순서대로 최종 배열 구성 및 반환
      return imageWithIndexAndStatus.map((item) => {
        if (item.isPending) {
          const uploadResult = uploadResultMap.get(item.index);
          return {
            fileName: uploadResult!.fileName,
            url: uploadResult!.url,
            mimeType: item.originalImage.mimeType,
            size: item.originalImage.size,
          };
        } else {
          return {
            fileName: item.originalImage.fileName,
            url: item.originalImage.url,
            mimeType: item.originalImage.mimeType,
            size: item.originalImage.size,
          };
        }
      });
    } catch (error) {
      // 업로드 실패 시 에러 로깅 및 재throw
      console.error(
        `[PetImageService] R2 업로드 실패 (petId: ${petId}):`,
        error,
      );
      throw new Error(
        `이미지 업로드 중 오류가 발생했습니다: ${(error as Error).message}`,
      );
    }
  }

  private async invalidateImageCache(petId: string): Promise<void> {
    await this.cacheService.del(CACHE.petImages.key(petId));
  }

  /**
   * DB에 이미지 정보 저장
   * @private
   */
  private async saveToDatabase(
    petId: string,
    savedImageList: PetImageItem[],
    em: EntityManager,
  ) {
    if (savedImageList.length === 0) {
      return em.delete(PetImageEntity, { petId });
    }

    return em.upsert(
      PetImageEntity,
      {
        petId,
        files: savedImageList,
      },
      {
        conflictPaths: {
          petId: true,
        },
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }
}
