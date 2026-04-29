import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE } from './cache-keys';

@Injectable()
export class CacheInvalidation {
  constructor(private cacheService: CacheService) {}

  /** 개체 신규 등록 시 — 목록 캐시만 플러시 */
  async onPetCreated(userId: string) {
    await Promise.all([
      this.cacheService.delByPattern(CACHE.feed.pattern),
      this.cacheService.delByPattern(CACHE.myPets.pattern(userId)),
    ]);
  }

  /**
   * 개체 대량 등록 시 — 목록/부모-자식 관계 캐시 일괄 플러시.
   *
   * 단건 `onPetCreated` 대비 추가로 다루는 것:
   * - DB에 이미 존재하던 부모(`dbParentIds`)의 `children`·`familyTree` 패턴 무효화
   * - 그 부모를 공유하는 기존 자식(`existingSiblingIds`)의 `clutchMates`·`siblings` 무효화
   *   (단건의 경우 `ParentRequestService.invalidateRelationCaches`가 담당했으나,
   *    `bulkCreatePets`는 `linkParent`를 우회하므로 여기서 직접 처리)
   *
   * 알려진 edge case — 본 메서드에서 처리 안 함:
   * - `parents:{newPetId}`, `pet:{newPetId}` 등 새 펫 자체의 NULL_SENTINEL (30초 TTL) 잔존
   * - 조부모 이상 선조의 `familyTree` — 단건 `createPet`도 미처리 (기존 설계 gap)
   */
  async onBulkPetsCreated(params: {
    userId: string;
    hasPublicPet: boolean;
    dbParentIds: string[];
    existingSiblingIds: string[];
  }) {
    const { userId, hasPublicPet, dbParentIds, existingSiblingIds } = params;

    const ops: Promise<void>[] = [
      this.cacheService.delByPattern(CACHE.myPets.pattern(userId)),
    ];

    if (hasPublicPet) {
      ops.push(this.cacheService.delByPattern(CACHE.feed.pattern));
    }

    for (const parentId of dbParentIds) {
      ops.push(
        this.cacheService.delByPattern(CACHE.familyTree.pattern(parentId)),
        this.cacheService.delByPattern(CACHE.children.pattern(parentId)),
      );
    }

    for (const siblingId of existingSiblingIds) {
      ops.push(
        this.cacheService.del(CACHE.clutchMates.key(siblingId)),
        this.cacheService.del(CACHE.siblings.key(siblingId)),
      );
    }

    await Promise.all(ops);
  }

  /** 개체 데이터 변경 시 — 개체 캐시 + 목록 캐시 플러시 */
  async onPetChanged(petId: string, userId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.pet.key(petId)),
      this.cacheService.delByPattern(CACHE.feed.pattern),
      this.cacheService.delByPattern(CACHE.myPets.pattern(userId)),
    ]);
  }

  /** 개체 삭제 시 — 개체/썸네일/분양/가계도/자식 캐시 플러시 */
  async onPetDeleted(
    petId: string,
    userId: string,
    fatherId?: string | null,
    motherId?: string | null,
  ) {
    const promises: Promise<void>[] = [
      this.cacheService.del(CACHE.pet.key(petId)),
      this.cacheService.del(CACHE.petImages.key(petId)),
      this.cacheService.del(CACHE.petAdoption.key(petId)),
      this.cacheService.delByPattern(CACHE.feed.pattern),
      this.cacheService.delByPattern(CACHE.myPets.pattern(userId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(petId)),
    ];
    if (fatherId) {
      promises.push(
        this.cacheService.delByPattern(CACHE.children.pattern(fatherId)),
      );
    }
    if (motherId) {
      promises.push(
        this.cacheService.delByPattern(CACHE.children.pattern(motherId)),
      );
    }
    await Promise.all(promises);
  }

  /** 브리딩 이벤트 (메이팅/산란/해칭) 변경 시 */
  async onBreedingChanged(userId: string) {
    await Promise.all([
      this.cacheService.delByPattern(CACHE.pairList.pattern(userId)),
      this.cacheService.delByPattern(CACHE.pairStats.pattern(userId)),
    ]);
  }

  /** 부모 관계 변경 시 */
  async onParentChanged(petId: string, parentId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.parents.key(petId)),
      this.cacheService.del(CACHE.clutchMates.key(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(parentId)),
      this.cacheService.delByPattern(CACHE.children.pattern(parentId)),
      this.cacheService.del(CACHE.siblings.key(petId)),
    ]);
  }

  /** 사용자 프로필 변경 시 */
  async onUserProfileChanged(slug: string | null) {
    if (slug) {
      await this.cacheService.del(CACHE.profileBySlug.key(slug));
    }
  }
}
