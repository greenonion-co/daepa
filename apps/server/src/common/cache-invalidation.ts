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
      this.cacheService.del(CACHE.thumbnail.key(petId)),
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
  async onBreedingChanged(userId: string, pairId: string) {
    await Promise.all([
      this.cacheService.delByPattern(CACHE.pairList.pattern(userId)),
      this.cacheService.del(CACHE.pairDetail.key(pairId)),
      this.cacheService.delByPattern(CACHE.pairStats.pattern(userId)),
    ]);
  }

  /** 부모 관계 변경 시 */
  async onParentChanged(petId: string, parentId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.parents.key(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(petId)),
      this.cacheService.delByPattern(CACHE.familyTree.pattern(parentId)),
      this.cacheService.delByPattern(CACHE.children.pattern(parentId)),
      this.cacheService.delByPattern(CACHE.siblings.pattern(petId)),
    ]);
  }

  /** 분양 완료 시 */
  async onAdoptionCompleted(petId: string, userId: string) {
    await Promise.all([
      this.cacheService.del(CACHE.petAdoption.key(petId)),
      this.cacheService.delByPattern(CACHE.adoptionStats.pattern(userId)),
      this.cacheService.delByPattern(CACHE.feed.pattern),
    ]);
  }
}
