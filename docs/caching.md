# Redis 캐시 목록

> 소스: `apps/server/src/common/cache-keys.ts`, `cache-invalidation.ts`

## 캐시 인프라

- **Redis** + `cache-manager v7` + `cache-manager-redis-yet`
- **CacheService** (`cache.service.ts`): `wrap`, `get`, `set`, `del`, `delByPattern`
- **CacheInvalidation** (`cache-invalidation.ts`): 도메인 이벤트별 무효화 메서드
- **Singleflight**: 동일 키 동시 요청 시 DB 1회만 호출 (cache stampede 방지)
- **NULL_SENTINEL**: null 결과도 30초 TTL로 캐싱 (cache penetration 방지)

## TTL 정책

| 구분 | TTL | 설명 |
|------|-----|------|
| `DEFAULT_TTL` | 30일 | 1:1 매핑 데이터. 수동 무효화가 주 전략 |
| `LIST_TTL` | 3분 | 목록/조합 데이터. 패턴 무효화 누락 대비 안전망 |

---

## 적용된 캐시 (wrap 사용 중)

### pet — 개체 상세

| 항목 | 값 |
|------|---|
| **키** | `pet:{petId}` |
| **TTL** | 30일 |
| **API** | `GET /v1/pet/:petId` |
| **서비스** | `PetService.findPetByPetId`, `getParentsByPetId` |
| **fallback** | `loadPetData()` (`pet.loader.ts`) — pet + pet_detail/egg_detail 조회 |
| **공유** | `ParentRequestService.getParentsWithRequestStatus`, `PetRelationService.getClutchMatesByPetId`, `getSiblingsWithDetails`에서도 동일 캐시 키 + fallback 사용 |
| **제외** | owner 정보 (매 요청마다 별도 조회) |
| **무효화** | `updatePet`, `softDeletePet`, `restorePet`, `completeHatching` 시 `del` |
| | `CacheInvalidation.onPetChanged`, `onPetDeleted` 시 `del` |

### petImages — 개체 이미지

| 항목 | 값 |
|------|---|
| **키** | `pet-img:{petId}` |
| **TTL** | 30일 |
| **API** | `GET /v1/pet-image/:petId` (thumbnail도 재사용) |
| **서비스** | `PetImageService.findOneByPetId` |
| **무효화** | `invalidateImageCache` 시 `del` |
| | `CacheInvalidation.onPetDeleted` 시 `del` |

### petAdoption — 분양 정보

| 항목 | 값 |
|------|---|
| **키** | `pet-adopt:{petId}` |
| **TTL** | 30일 |
| **API** | `GET /v1/pet-adoption/:petId` |
| **서비스** | `PetAdoptionService.findOne` |
| **제외** | reservedUser 정보 (매 요청마다 별도 조회) |
| **무효화** | `createAdoption` — 자체 트랜잭션일 때 `del` |
| | `updateAdoption` — 자체 트랜잭션일 때 `del` |
| | `CacheInvalidation.onPetDeleted` 시 `del` |
| **참고** | 외부 트랜잭션(`entityManager` 주입) 시 호출자가 캐시 무효화 책임 |

### feeding — 피딩 기록 (월별)

| 항목 | 값 |
|------|---|
| **키** | `feeding:{petId}:{yyyy-MM}` |
| **TTL** | 30일 |
| **API** | `GET /v1/feedings` |
| **서비스** | `FeedingService.getFeedingList` |
| **특징** | 월 단위 캐싱. startDate에서 yyyy-MM 추출 |
| **무효화** | `createFeeding` — 해당 월 `del` |
| | `updateFeeding` — 기존 월 + 날짜 변경 시 새 월 `del` |
| | `deleteFeeding` — 해당 월 `del` |

### clutchMates — 클러치 메이트 관계 (petId 목록)

| 항목 | 값 |
|------|---|
| **키** | `clutch:{petId}` |
| **TTL** | 30일 |
| **API** | `GET /v1/pet/clutch-mates/:petId` |
| **서비스** | `PetRelationService.getClutchMatesByPetId` |
| **특징** | 관계 데이터(petId 배열)만 캐시. 펫 상세는 `pet:{petId}` 캐시 재활용 |
| **설계** | 비공개/삭제 처리를 pet 캐시 무효화에 편승 — 별도 역방향 인덱스 불필요 |
| **제외** | owner 정보 (매 요청마다 별도 조회) |
| **무효화** | `ParentRequestService.invalidateRelationCaches` — 본인 + 같은 부모의 모든 자식 `del` |

### siblings — 형제 관계 (petId + 정렬/필터용 메타)

| 항목 | 값 |
|------|---|
| **키** | `siblings:{petId}` |
| **TTL** | 30일 |
| **API** | `GET /v1/pet/siblings/:petId` |
| **서비스** | `PetRelationService.getSiblingsWithDetails` |
| **특징** | 관계 데이터(`{petId, type, hatchingDate}[]`)만 캐시. 메모리에서 필터/정렬/페이징 후, 페이지 항목만 pet 캐시 재활용 |
| **설계** | 비공개/삭제 처리를 pet 캐시 무효화에 편승. COUNT 쿼리 제거. owner 배치 조회(`WHERE IN`) |
| **무효화** | `ParentRequestService.invalidateRelationCaches` — 본인 + 같은 부모의 모든 자식 `del` |

### profileBySlug — 브리더 공개 프로필 (slug 기반)

| 항목 | 값 |
|------|---|
| **키** | `profile:slug:{slug}` |
| **TTL** | 30일 |
| **API** | `GET /v1/user/public-profile/:slug` |
| **서비스** | `UserService.findPublicProfileBySlug` |
| **무효화** | `CacheInvalidation.onUserProfileChanged(slug)` 시 `del` |

---

## 무효화

### 서비스 내 직접 무효화

| 서비스 | 시점 | 삭제 대상 |
|--------|------|----------|
| `PetService.updatePet` | 수정 후 | `pet:{petId}` |
| `PetService.softDeletePet` | 삭제 후 | `pet:{petId}` |
| `PetService.restorePet` | 복구 후 | `pet:{petId}` |
| `PetService.completeHatching` | 해칭 후 | `pet:{petId}` |
| `PetImageService.invalidateImageCache` | 이미지 변경 후 | `pet-img:{petId}` |
| `PetAdoptionService.createAdoption` | 생성 후 | `pet-adopt:{petId}` |
| `PetAdoptionService.updateAdoption` | 수정 후 | `pet-adopt:{petId}` |
| `AdoptionHistoryService.completeAdoption` | 분양 완료 후 | `pet:{petId}`, `pet-adopt:{petId}` |
| `ParentRequestService.linkParent` | 부모 연결 후 (즉시 확정) | 본인 + 같은 부모의 모든 자식의 `clutch:*`, `siblings:*` |
| `ParentRequestService.unlinkParent` | 부모 해제 후 (APPROVED) | 본인 + 같은 부모의 모든 자식의 `clutch:*`, `siblings:*` |
| `ParentRequestService.updateParentRequestByNotificationId` | 부모 승인 후 | 본인 + 같은 부모의 모든 자식의 `clutch:*`, `siblings:*` |
| `PetService.bulkCreatePets` | 대량 등록 commit 후 | `my-pets:{ownerId}:*` · 공개 펫 있으면 `feed:*` · DB 부모별로 `children:{parentId}:*`, `ftree:{parentId}:*` · 기존 형제(같은 부모 공유)별 `clutch:{siblingId}`, `siblings:{siblingId}` — `CacheInvalidation.onBulkPetsCreated`. 이미지를 함께 등록한 경우 각 petId에 대해 `pet-img:{petId}` `del` (`PetImageService.saveAndUploadConfirmedImages` 내부 호출) |
| `FeedingService.createFeeding` | 생성 후 | `feeding:{petId}:{yyyy-MM}` |
| `FeedingService.updateFeeding` | 수정 후 | `feeding:{petId}:{yyyy-MM}` (+ 날짜 변경 시 새 월) |
| `FeedingService.deleteFeeding` | 삭제 후 | `feeding:{petId}:{yyyy-MM}` |
| `UserService.updatePrivateInfo` | 수정 후 | `profile:slug:{slug}` |
