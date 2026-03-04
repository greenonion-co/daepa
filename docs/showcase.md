# 브리더 쇼케이스 (Breeder Showcase)

브리더의 공개 개체를 외부 방문자에게 보여주는 퍼블릭 페이지.
비로그인 사용자도 접근 가능하며, SEO를 지원한다.

**URL**: `/@브리더이름` (예: `daepa.co/@nancy`)

---

## 아키텍처 요약

```
/@nancy  ──middleware rewrite──>  /showcase/nancy
                                       │
                                 page.tsx (Server Component)
                                   │  fetchBreederProfile()
                                   ▼
                             ShowcaseContent (Client Component)
                              ├── BreederHeader
                              ├── 검색바 + 정렬 (ShowcaseMultiSelect)
                              ├── ShowcaseFilterBar (사이드바 / 모바일)
                              └── PetShowcaseGrid (useInfiniteQuery)
                                    └── PetShowcaseCard
```

---

## 서버 변경사항

### 1. 사용자 공개 프로필 API

**엔드포인트**: `GET /api/v1/user/public-profile/:name`
**인증**: 불필요 (`@Public()`)

| 파일 | 변경 |
|------|------|
| `apps/server/src/user/user.controller.ts` | `getPublicProfile()` 엔드포인트 추가 |
| `apps/server/src/user/user.service.ts` | `findPublicProfileByName(name)` 메서드 추가 |
| `apps/server/src/user/user.dto.ts` | `BreederPublicProfileDto`, `BreederPublicProfileResponseDto` 추가 |

**응답 필드**:
```ts
{
  userId: string;
  name: string;
  role: string;
  isBiz: boolean;
  petCount: number;       // 공개 펫 수
  realName?: string;      // isRealNamePublic=true인 경우만
  phone?: string;         // isPhonePublic=true인 경우만
  address?: string;       // isAddressPublic=true인 경우만
}
```

연락처/주소 공개 여부는 `ReporterInfoSection`(설정 페이지)의 `isRealNamePublic`, `isPhonePublic`, `isAddressPublic` 토글로 제어한다. 현재 사업자(`isBiz=true`) 회원만 공개 토글이 활성화된다.

### 2. ownerId 필터

**파일**: `apps/server/src/pet/pet.service.ts` — `buildPetListSearchFilterQuery()`

`PetFilterDto.ownerId`가 전달되면 `pets.ownerId = :filterOwnerId` 조건을 추가한다.
비로그인 사용자가 호출하면 기존 `filterType` 로직에 의해 `isPublic=true` 조건이 자동 결합되어, 특정 브리더의 **공개 펫만** 반환된다.

---

## 클라이언트 구조

### 라우팅

| 파일 | 역할 |
|------|------|
| `apps/client/src/middleware.ts` | `/@username` → `/showcase/username` 리라이트 (URL은 `/@username` 유지) |
| `apps/client/src/app/showcase/[username]/page.tsx` | Server Component. `generateMetadata()` + `fetchBreederProfile()` |
| `apps/client/src/app/showcase/[username]/data.ts` | 서버 사이드 데이터 페칭 함수 |

`(브리더스룸)` 외부에 배치되어 auth 체크가 없다.

### 데이터 페칭

**`data.ts`**:
- `fetchBreederProfile(username)` — `GET /api/v1/user/public-profile/:name`
- `React.cache()`로 같은 요청 중복 방지 (page.tsx에서 metadata + 렌더 2회 호출)

**`PetShowcaseGrid.tsx`**:
- `petControllerFindAll()` (orval 생성) + `useInfiniteQuery`
- 서버 사이드 필터링: `keyword`, `sex`, `status`, `morphs`, `traits`, `ownerId`, `order`
- 쿼리 키: `["showcase-pets", userId, sex, status, morphs, traits, search, sort]`

### SEO

`page.tsx`의 `generateMetadata()`:
```
title: "{name}의 브리더스룸 | 대파"
description: "{name}의 개체 {petCount}마리"
```

---

## 컴포넌트 상세

### ShowcaseContent

**경로**: `showcase/[username]/components/ShowcaseContent.tsx`

메인 클라이언트 컴포넌트. 필터 상태를 관리하고 하위 컴포넌트를 조합한다.

**필터 상태** (`ShowcaseFilters`):
```ts
{
  sex: string[];       // ["M", "F", "N"]
  status: string[];    // ["ON_SALE", "ON_RESERVATION", "NFS"]
  morphs: string[];    // 브리더 개체의 모프 목록에서 선택
  traits: string[];    // 브리더 개체의 형질 목록에서 선택
  search: string;      // 이름 검색어
  sort: string;        // "DESC" | "ASC"
}
```

**모프/형질 옵션 수집**: `PetShowcaseGrid`의 `onOptionsUpdate` 콜백으로 로드된 데이터에서 고유 모프/형질을 수집하여 필터 드롭다운 옵션에 반영한다.

**모바일 미니 헤더**: `IntersectionObserver`로 `BreederHeader`가 뷰포트 밖으로 나가면 상단에 고정 미니 헤더(이름 + 사업자 배지) 표시.

**레이아웃**:
- 데스크톱: 좌측 사이드바(`w-65`) 필터 + 우측 그리드
- 모바일: 상단 가로 필터 칩 + 그리드

### BreederHeader

**경로**: `showcase/[username]/components/BreederHeader.tsx`

- 표시명: `realName || name`
- 닉네임: `realName`과 `name`이 다르면 `@{name}` 표시
- 사업자 배지: `isBiz=true`일 때
- 연락처: 파란색 텍스트, 전화번호 탭 → `tel:` 링크
- 주소: 파란색 텍스트, 탭 → 네이버 지도 검색

### ShowcaseFilterBar

**경로**: `showcase/[username]/components/ShowcaseFilterBar.tsx`

| prop | 설명 |
|------|------|
| `filters` | 현재 필터 상태 |
| `onChange` | 필터 변경 콜백 |
| `availableMorphs` | `Record<string, string>` — 모프 옵션 |
| `availableTraits` | `Record<string, string>` — 형질 옵션 |
| `mobile` | `true`이면 가로 칩 레이아웃, `false`면 세로 사이드바 |

**필터 항목**:
| 필터 | 옵션 |
|------|------|
| 성별 | 수컷 / 암컷 / 미구분 |
| 분양상태 | 판매중 / 예약중 / NFS |
| 모프 | 해당 브리더 개체의 모프 (동적) |
| 형질 | 해당 브리더 개체의 형질 (동적) |

**모바일 레이아웃**: `flex-wrap gap-2`, `variant="light"`, 모프/형질은 `dropdownPosition="right"`
**데스크톱 레이아웃**: `divide-y` 섹션, 각 섹션 위에 `<h3>` 라벨

### ShowcaseMultiSelect

**경로**: `showcase/[username]/components/ShowcaseMultiSelect.tsx`

`(브리더스룸)/components/selector/MultiSelect.tsx` 기반의 독립 컴포넌트. Zustand 스토어 의존 없이 `selected`/`onChange` props로 동작.

| prop | 타입 | 설명 |
|------|------|------|
| `title` | `string` | 버튼 라벨 |
| `displayMap` | `Record<string, string>` | 값 → 표시명 매핑 |
| `selected` | `string[]` | 선택된 값들 |
| `onChange` | `(selected: string[]) => void` | 변경 콜백 |
| `single` | `boolean` | `true`: 단일 선택 (선택 즉시 닫힘, 칩 미표시) |
| `dropdownPosition` | `"left" \| "right"` | 드롭다운 수평 정렬 |
| `variant` | `"default" \| "light"` | `light`: 흰 배경 + 그림자 (모바일용) |

**동작**: 멀티 선택 시 드롭다운 내 선택 칩 표시 → 닫으면 `onChange` 호출. 싱글 선택 시 클릭 즉시 `onChange` + 닫힘.

### PetShowcaseGrid

**경로**: `showcase/[username]/components/PetShowcaseGrid.tsx`

- `useInfiniteQuery` + `IntersectionObserver` 무한 스크롤
- 페이지당 20개
- 반응형 그리드: `grid-cols-2` → `md:3` → `lg:4` → `xl:5` → `2xl:6` → `1800px:7` → `2100px:8`
- 빈 상태: 필터 있으면 "조건에 맞는 개체가 없습니다", 없으면 "등록된 개체가 없습니다"

### PetShowcaseCard

**경로**: `showcase/[username]/components/PetShowcaseCard.tsx`

카드 구성 (위→아래):
1. **썸네일**: `PetThumbnail` (aspect-square, hover scale)
2. **분양 상태 배지**: 썸네일 좌상단 오버레이
   - `ON_SALE`: 파란 배지 + 가격 (`#D3E5EF / #28638D`)
   - `ON_RESERVATION`: 노란 배지 (`#FDECC8 / #9F6B15`)
   - `NFS`: 빨간 배지 (`#FFE2DD / #93312E`)
3. **이름 + 성별 dot**: 파란(수컷) / 빨간(암컷) / 회색(미구분)
4. **해칭일 · 성장단계**
5. **모프 배지**: `BadgeList` (maxDisplay=2)
6. **형질 배지**: `BadgeList` (maxDisplay=2)

클릭 → `/pet/{petId}` (기존 공개 펫 상세 페이지)

---

## 재사용 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|---------|------|------|
| `PetThumbnail` | `components/common/PetThumbnail.tsx` | 펫 썸네일 이미지 |
| `BadgeList` | `(브리더스룸)/components/BadgeList.tsx` | 모프/형질 배지 목록 |
| `Loading` | `components/common/Loading.tsx` | 로딩 스피너 |
| `useIsMobile` | `hooks/useMobile.ts` | 모바일 감지 (드롭다운 크기 조절) |

---

## 파일 목록

### 서버
| 파일 | 변경 |
|------|------|
| `apps/server/src/user/user.controller.ts` | `GET /v1/user/public-profile/:name` 추가 |
| `apps/server/src/user/user.service.ts` | `findPublicProfileByName()` 추가 |
| `apps/server/src/user/user.dto.ts` | `BreederPublicProfileDto` 추가 |
| `apps/server/src/pet/pet.service.ts` | `buildPetListSearchFilterQuery`에 ownerId 필터 추가 |

### 클라이언트
| 파일 | 신규/수정 |
|------|----------|
| `apps/client/src/middleware.ts` | 수정 — `/@username` 리라이트 추가 |
| `apps/client/src/app/showcase/[username]/page.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/data.ts` | 신규 |
| `apps/client/src/app/showcase/[username]/components/ShowcaseContent.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/components/BreederHeader.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/components/ShowcaseFilterBar.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/components/ShowcaseMultiSelect.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/components/PetShowcaseGrid.tsx` | 신규 |
| `apps/client/src/app/showcase/[username]/components/PetShowcaseCard.tsx` | 신규 |

---

## 검증 체크리스트

1. `/@nancy` 접속 → 리라이트 동작, 프로필 + 그리드 렌더링
2. 비로그인 상태에서 접근 가능
3. 필터 변경 시 서버 재요청 + 목록 갱신
4. 검색어 입력 시 `keyword` 파라미터로 서버 검색
5. 무한 스크롤 (20개씩 페이지네이션)
6. 카드 클릭 → `/pet/{petId}`로 이동
7. SEO: OG 태그 정상 생성
8. 존재하지 않는 사용자 → 404 페이지
9. 모바일 반응형 (2열 그리드, 가로 필터 칩)
10. 분양 상태 배지: ON_SALE(가격 포함), ON_RESERVATION, NFS 모두 표시
11. 사업자 회원의 연락처/주소 공개 설정 반영
