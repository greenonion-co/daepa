# 펫 대량 업로드 내재화 — 구현 계획

## 배경

현재 펫 대량 등록은 `apps/server/scripts/upsert-pets.ts` + `link-pet-parents.ts` CSV 스크립트로만 가능하다. 운영자 전용이며 일반 사업자 유저는 사용할 수 없다. 이를 서비스에 내재화하여 **사업자(isBiz) 유저**가 브라우저에서 스프레드시트처럼 직접 입력하거나 CSV/XLSX 파일을 업로드하여 대량 등록할 수 있게 한다.

## 확정된 스펙 (의사결정 완료)

| 항목 | 결정 |
|---|---|
| 범위 | **Option C** — 완전한 인라인 스프레드시트 + 파일 업로드 병행 |
| 파일 업로드 | **유지** (기존 `AddPetBulkButton` 동작 보존, 페이지로 승격) |
| 트랜잭션 | **선제 검증 → 통과 시 전체 원자 저장** (부분 성공 불허) |
| 최대 행수 | **200행** — 업로드 성공 시 행 초기화되어 재사용 |
| 권한 | **`isBiz === true`** 유저만 |
| 플랫폼 | **데스크톱 웹 전용** (네이티브 WebView는 자연 지원되나 모바일 폭은 별도 안내) |

## 기존 자산 (재사용)

### 서버
| 위치 | 내용 |
|---|---|
| `apps/server/src/pet/pet.service.ts:325-626` | `bulkCreatePets()` — 핵심 로직 완성. 5개 테이블 일괄 INSERT. |
| `apps/server/src/pet/bulk-create-pet.dto.ts` | `BulkCreatePetDto` + `BulkCreatePetRowDto` |
| `apps/server/src/pet/pet.controller.ts` | `POST /v1/pet/bulk` 엔드포인트 |
| `apps/server/src/parent_request/parent_request.service.ts` | 부모 관계 로직 |
| `apps/server/src/common/cache-keys.ts` | 캐시 키 정의 |

### 클라이언트
| 위치 | 내용 |
|---|---|
| `apps/client/src/app/(브리더스룸)/components/AddPetBulkButton.tsx` | 파일 업로드 UI (현재 툴팁으로 가림 → 페이지로 승격) |
| `apps/client/src/app/(브리더스룸)/lib/parsePetCsv.ts` | CSV/XLSX 파서 + 한글↔영문 매핑 테이블 |
| `apps/client/src/app/(브리더스룸)/components/selector/MultiSelectList.tsx` | 모프/형질/먹이 선택 컴포넌트 |
| `apps/client/src/app/(브리더스룸)/components/BizGuard.tsx` | isBiz 가드 — 페이지 래핑 시 재사용 |
| `apps/client/src/hooks/usePetLimitDialog.ts` | 공개 슬롯 초과 다이얼로그 |

### 스크립트 (deprecation 대상)
| 위치 | 처리 |
|---|---|
| `apps/server/scripts/upsert-pets.ts` | @deprecated 주석 추가, 비상 복구용으로 유지 |
| `apps/server/scripts/link-pet-parents.ts` | 동일 |

## 도입 라이브러리

### 신규
- **`@silevis/reactgrid`** (MIT) — 스프레드시트 UI
  - 200행 규모에서 성능 충분
  - 커스텀 셀 템플릿으로 MultiSelect / ParentCell 등 복잡 셀 구현 가능
  - 키보드 네비게이션, 클립보드(Excel 복붙) 내장

### 기존 재사용
`@tanstack/react-table`(읽기 전용 미리보기), `xlsx`, `react-hook-form`, `zod`, shadcn/ui 컴포넌트.

---

## 아키텍처 개요

```
  [페이지 진입]
       │
       ▼
  BizGuard (isBiz 체크)
       │
       ▼
  /pet/bulk (신규 페이지)
  ┌─────────────────────────────────────────────┐
  │ Toolbar                                      │
  │  [행 추가] [선택 삭제] [전체 삭제]           │
  │  [CSV/XLSX 불러오기] [템플릿 다운로드]       │
  │  [검증] [업로드] — 통과 시 활성              │
  └─────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────┐
  │ BulkPetGrid (@silevis/reactgrid)             │
  │  컬럼: 종/이름/공개/해칭일/성별/모프/형질/    │
  │        크기/몸무게/먹이/브리더/분양상태/     │
  │        부개체/모개체/에러배지                 │
  │  행: 최대 200 (초과 시 추가 버튼 비활성)     │
  └─────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────┐
  │ Summary                                      │
  │  행수: N/200 · 오류: M개 · 경고: K개         │
  └─────────────────────────────────────────────┘

  [업로드 클릭]
       │
       ▼
  1) 클라이언트 zod 검증 (offline)
       │   실패 → 셀 하이라이트 + 토스트
       ▼
  2) petControllerBulkCreate() 호출
       │   서버 사전 검증 (dry 구간)
       │     ├─ 실패: errors[] 받아 셀 표시
       │     └─ 성공: DB 트랜잭션 실행
       ▼
  3) 응답 처리
       ├─ 성공: 행 초기화 + 개체룸 캐시 무효화 + 토스트 + 남기 여부 선택
       └─ 실패: 서버 에러 매핑 → 셀 하이라이트
```

---

## Phase 1 — 서버 보강 (0.5일)

### 1.1 캐시 무효화 누락 버그 수정 (🐞 핫픽스 필요)

**파일**: `apps/server/src/pet/pet.service.ts` — `bulkCreatePets()` 메서드 말미

```ts
// return 직전에 추가
const hasPublic = rows.some((r) => r.isPublic);
await this.cacheService.del(CACHE.myPets.pattern(ownerId));
if (hasPublic) {
  await this.cacheService.del(CACHE.feed.pattern);
}
```

**근거**: `CLAUDE.md` 서버 캐시 정합성 규칙 — 생성 작업이 `myPets:{userId}:*`와 공개 피드 `feed:*` 영향.
**추가**: `docs/caching.md` 에 `petControllerBulkCreate` 엔트리 문서화.

### 1.2 행수 제한 가드

**파일**: `apps/server/src/pet/bulk-create-pet.dto.ts`

```ts
import { ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class BulkCreatePetDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkCreatePetRowDto)
  rows: BulkCreatePetRowDto[];
}
```

초과 시 NestJS `ValidationPipe`가 `BadRequestException` 자동 발생.

### 1.3 isBiz 권한 체크 (서버측 방어)

**파일**: `apps/server/src/pet/pet.controller.ts` — `bulkCreate` 핸들러

```ts
const user = await this.userService.findById(token.userId);
if (!user?.isBiz) {
  throw new ForbiddenException('사업자 계정만 사용할 수 있습니다.');
}
```

클라이언트 가드가 뚫려도 서버가 거부하도록 **이중 방어**.

### 1.4 dry-run 구조화 응답

현재 `bulkCreatePets()`의 사전검증 단계(라인 335~480)가 오류를 모아뒀다가 `BadRequestException(first-error)`로 던지는 구조. UI가 모든 오류를 한꺼번에 표시하려면 구조화된 응답이 필요.

**새 응답 DTO**:
```ts
export class BulkCreatePetResultDto {
  successCount: number;
  createdPetIds: string[];
  errors: BulkCreatePetErrorItem[];
}

export class BulkCreatePetErrorItem {
  rowIndex: number;           // 0-based
  field?: string;             // 'name', 'hatchingDate', 'fatherName' 등
  code: string;               // 'DUPLICATE_NAME', 'PARENT_NOT_FOUND', 'INVALID_SEX' ...
  message: string;            // 한국어 메시지
}
```

**동작**:
1. 사전 검증에서 오류 수집 → 1건이라도 있으면 `200 OK + errors[]` 응답하고 DB 미변경
2. 오류 없음 → INSERT 실행 → `200 OK + createdPetIds`

**장점**: 트랜잭션 원자성 유지 + UI에서 전체 오류 시각화.

### 1.5 OpenAPI 재생성

- 서버 swagger 어노테이션 갱신
- `cd packages/api-client && npm run generate` 실행
- 생성된 `petControllerBulkCreate`의 응답 타입이 `BulkCreatePetResultDto` 임을 확인

---

## Phase 2 — 클라이언트: 스프레드시트 페이지 (3.5일)

### 2.1 라우팅 및 진입점

**신규 페이지**: `apps/client/src/app/(브리더스룸)/pet/bulk/page.tsx`

```tsx
"use client";
export default function BulkPetPage() {
  return (
    <BizGuard>
      <BulkPetPageContent />
    </BizGuard>
  );
}
```

**진입 버튼**:
- `apps/client/src/app/(브리더스룸)/components/Menubar.tsx:124` 근처에 "대량 등록" 메뉴 추가
- 기존 `AddPetBulkButton`은 **페이지 내부 툴바의 "파일 불러오기"** 버튼으로 흡수 (별도 버튼 제거)

### 2.2 페이지 파일 구조

```
apps/client/src/app/(브리더스룸)/pet/bulk/
├── page.tsx                              BizGuard + 전체 컨테이너
├── components/
│   ├── BulkPetPageContent.tsx            상태 조율자
│   ├── BulkPetToolbar.tsx                상단 툴바
│   ├── BulkPetGrid.tsx                   @silevis/reactgrid 래퍼
│   ├── BulkPetSummary.tsx                하단 요약
│   ├── cells/
│   │   ├── TextCellTemplate.tsx          이름, 설명 등 자유 텍스트
│   │   ├── EnumSelectCellTemplate.tsx    종/성별/크기/분양상태 드롭다운
│   │   ├── BooleanCellTemplate.tsx       공개, 브리더 체크박스
│   │   ├── DateCellTemplate.tsx          해칭일 (YYYY-MM-DD)
│   │   ├── NumberCellTemplate.tsx        몸무게
│   │   ├── MultiSelectCellTemplate.tsx   모프/형질/먹이 (Popover + MultiSelectList)
│   │   └── ParentCellTemplate.tsx        부/모 (배치 내 이름 + 기존 펫 Combobox)
│   ├── ImportFileButton.tsx              파일 업로드 (기존 AddPetBulkButton 로직 흡수)
│   ├── TemplateDownloadButton.tsx        CSV 템플릿 다운로드
│   └── ErrorBadgeCell.tsx                행 끝에 붙는 오류 배지
├── hooks/
│   ├── useBulkPetForm.ts                 행 배열 상태 관리 (행 추가/삭제/복제)
│   ├── useBulkPetValidation.ts           zod 클라이언트 검증
│   └── useBulkPetUpload.ts               업로드 mutation + 서버 에러 매핑
└── lib/
    ├── bulkPetSchema.ts                  공용 zod 스키마
    ├── columns.ts                        컬럼 정의 (key, label, type, options)
    └── parentResolver.ts                 부모 이름 → petId 해석 유틸
```

### 2.3 상태 관리 설계

```ts
type BulkPetRow = {
  _clientId: string;                       // UI용 고유 ID (nanoid)
  species?: string;
  name?: string;
  isPublic?: boolean;
  hatchingDate?: string;
  sex?: 'M' | 'F' | 'N';
  morphs?: string[];
  traits?: string[];
  growth?: 'BABY' | 'JUVENILE' | 'PRE_ADULT' | 'ADULT';
  weight?: number | null;
  foods?: string[];
  isBreeder?: boolean;
  adoptionStatus?: 'NFS' | 'ON_SALE' | 'ON_RESERVATION' | 'NONE';
  fatherName?: string | null;
  motherName?: string | null;
};

type ValidationError = { field: keyof BulkPetRow; code: string; message: string };
type RowState = {
  row: BulkPetRow;
  errors: Record<string, ValidationError>;  // field → error
};
```

- `useState<RowState[]>` 또는 `react-hook-form`의 `useFieldArray` 활용
- 셀 편집마다 해당 행 재검증 (`debounced`)

### 2.4 reactgrid 통합 핵심 포인트

`@silevis/reactgrid`의 `<ReactGrid>`에 다음을 제공:
- `rows`: 헤더 1행 + 데이터 N행 (빈 셀 허용)
- `columns`: 컬럼 너비 + 정렬
- `customCellTemplates`: 위 6가지 커스텀 셀 템플릿 등록
- `onCellsChanged`: 편집 이벤트 수신 → 상태 업데이트 + 재검증
- `stickyTopRows={1}`: 헤더 고정
- `enableRowSelection`: 행 선택 → 삭제/복제 액션

### 2.5 커스텀 셀 템플릿 설계

#### EnumSelectCellTemplate
- 클릭 시 shadcn Select 팝오버 노출
- 값: 키 (DB 값) / 표시: 한글 라벨
- 데이터 소스: `bulkPetSchema`의 enum 정의를 공유

#### MultiSelectCellTemplate (모프/형질/먹이)
- 셀 표시: 쉼표 구분 한글 라벨 (예: "노멀, 알비노")
- 더블클릭/F2 → `Popover` 안에 기존 `MultiSelectList` 렌더
- 적용 시 셀 값 업데이트
- `displayMap`은 기존 CSV 파서의 enum 맵 재사용

#### ParentCellTemplate
- 셀 표시: 부모 이름 문자열
- 편집 모드: shadcn `Command` 기반 Combobox
- 데이터 소스:
  - **Group 1**: 같은 배치 내 행들의 `name` (실시간)
  - **Group 2**: `useQuery([brPetControllerFindAll.name])` 로 서버에서 내 펫 목록 (성별 필터 가능)
- 부(father) 셀은 성별 M 우선, 모(mother) 셀은 성별 F 우선으로 정렬/표시
- 선택 시 `name` 문자열 그대로 저장 (서버가 배치 내 → DB 순으로 해석)

#### DateCellTemplate
- `<input type="date">` 기반
- 빈 값 허용, 잘못된 형식은 셀 경고

### 2.6 파일 임포트 (기존 기능 통합)

**`ImportFileButton`**:
- 기존 `AddPetBulkButton.tsx` 의 파일 파싱 로직 그대로 사용
- `parsePetCsv()` 결과를 **현재 그리드의 행 배열에 병합** (현재 행수 + 파일 행수 > 200 시 잘라내고 경고)
- 파일 선택 후 바로 업로드하지 않고 **그리드에 주입** — 유저가 편집/재검증 후 업로드 버튼

### 2.7 템플릿 다운로드

한글 헤더 + 예시 2행 포함한 CSV blob 생성:

```ts
const HEADERS = ['종', '개체 이름', '공개', '해칭일(YYYY-MM-DD)', '성별', '모프', '형질', '크기', '몸무게', '먹이', '브리더', '분양상태', '부개체', '모개체'];
```

기존 `parsePetCsv`의 `COLUMN_MAP`과 **단일 출처로 통합**하여 drift 방지.

### 2.8 검증 흐름

#### 실시간 (셀 편집마다)
- zod 스키마 기반 필드 검증
- 배치 전체에 걸친 규칙: 이름 중복, 부모 존재, 자기 참조

#### 업로드 직전
- 전 행 재검증
- 오류 있음 → "2행 5개, 7행 1개 등 오류 있음" 토스트, 업로드 중단

#### 서버 응답 후
- `errors[]` 있음 → 행 인덱스 기준으로 셀 하이라이트
- 성공 → 행 비움 + 토스트 + `invalidateQueries([brPetControllerFindAll.name])`

### 2.9 업로드 성공 후 UX

```ts
await mutateAsync({ rows });
// 성공
toast.success(`${result.successCount}개 개체가 등록되었습니다.`);
setRows([]);                                    // 초기화 (요구사항)
queryClient.invalidateQueries([brPetControllerFindAll.name]);
// 유저에게 "개체룸으로 이동 / 계속 등록" 2-choice dialog
```

### 2.10 모바일 제한

페이지 마운트 시 `window.innerWidth < 900` 또는 `isMobile` 감지 → 안내 화면:
> "대량 등록은 데스크톱 환경에서 사용해주세요."

네이티브 앱 WebView는 가로 방향 또는 데스크톱 모드에서 동작. 기본은 안내 화면.

---

## Phase 3 — 공용 zod 스키마 + enum 맵 통합 (0.5일)

**신규 파일**: `apps/client/src/app/(브리더스룸)/pet/bulk/lib/bulkPetSchema.ts`

```ts
export const bulkPetRowSchema = z.object({
  species: z.enum(SPECIES_VALUES),
  name: z.string().min(1).max(30),
  isPublic: z.boolean(),
  hatchingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  sex: z.enum(['M', 'F', 'N']).optional(),
  morphs: z.array(z.string()).default([]),
  // ...
  fatherName: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
});

export const bulkPetArraySchema = z.array(bulkPetRowSchema)
  .min(1)
  .max(200)
  .superRefine((rows, ctx) => {
    // 배치 내 이름 중복 검사
    const names = new Map<string, number>();
    rows.forEach((r, i) => {
      if (!r.name) return;
      if (names.has(r.name)) {
        ctx.addIssue({ path: [i, 'name'], code: 'custom', message: '배치 내 이름 중복' });
      }
      names.set(r.name, i);
    });
    // 자기 참조 검사
    rows.forEach((r, i) => {
      if (r.fatherName === r.name) {
        ctx.addIssue({ path: [i, 'fatherName'], code: 'custom', message: '자기 자신은 부모가 될 수 없음' });
      }
      if (r.motherName === r.name) {
        ctx.addIssue({ path: [i, 'motherName'], code: 'custom', message: '자기 자신은 부모가 될 수 없음' });
      }
    });
  });
```

**enum 맵 정리**:
- 기존 `parsePetCsv.ts` 내부의 `SEX_MAP`, `GROWTH_MAP`, `SPECIES_MAP`, `ADOPTION_STATUS_MAP` 를 `apps/client/src/app/(브리더스룸)/pet/bulk/lib/enumMaps.ts` 로 이동
- `parsePetCsv.ts` 는 이 모듈을 import — **단일 출처 원칙** 유지

---

## Phase 4 — QA (1일)

### 4.1 시나리오 체크리스트

- [ ] 1행 최소 입력(종+이름)만으로 등록 성공
- [ ] 200행 경계 성공 / 201행 거부 UI
- [ ] 같은 배치 내 이름 중복 → 두 행 모두 에러 하이라이트
- [ ] DB 내 기존 이름과 중복 → 서버 에러 수신 후 하이라이트
- [ ] 부모 이름이 배치 내 펫 → 성공 (순서 무관)
- [ ] 부모 이름이 DB 기존 펫 → 성공
- [ ] 부모 이름 못 찾음 → 에러
- [ ] 부모 성별 불일치 → 에러
- [ ] 자기 자신 부모 → 클라이언트 검증에서 차단
- [ ] 해칭일 잘못된 형식 → 셀 경고
- [ ] 공개 슬롯 초과 → `usePetLimitDialog()` 재사용
- [ ] 파일 불러오기 → 기존 행에 추가, 200 초과 시 잘라내기 + 경고
- [ ] Excel에서 셀 복붙 (Ctrl+C/V) 동작
- [ ] Tab/Enter 네비게이션
- [ ] 행 선택 삭제 / 복제
- [ ] 업로드 성공 → 행 초기화 확인 + 개체룸 즉시 갱신
- [ ] isBiz 가 아닌 유저 직접 URL 접근 → BizGuard 차단
- [ ] 비로그인 유저 URL 접근 → 로그인 유도
- [ ] 서버 API 직접 호출 (isBiz=false 토큰) → 403 반환

### 4.2 성능 검증
- 200행 + 각 행에 모프/형질 각 5개 → 업로드 응답 시간 측정
- MySQL slow query log 확인
- reactgrid 렌더 FPS (200행 * 15컬럼 = 3000셀)

### 4.3 회귀 테스트
- 기존 단건 펫 등록 플로우 영향 없음 확인
- 기존 `AddPetBulkButton` 제거로 인한 영향 확인

---

## Phase 5 — 문서화 및 배포 (0.5일)

### 5.1 유저 가이드 (신규)
**`docs/bulk-pet-upload-user-guide.md`** (선택 — 서비스 내 Help 섹션에 링크할 수도 있음)
- 접근 경로 (사업자 계정 필요)
- 스프레드시트 사용법 (키보드 단축키 포함)
- CSV 템플릿 사용법
- 자주 발생하는 오류와 해결법

### 5.2 개발자 문서 업데이트
- `docs/caching.md` — `bulkCreatePets` 캐시 무효화 엔트리 추가
- `CLAUDE.md` — `/pet/bulk` 페이지 경로 및 진입 가드 안내
- `apps/server/scripts/upsert-pets.ts`, `link-pet-parents.ts` 상단에 `@deprecated` 주석

### 5.3 배포 순서
1. **서버 먼저 배포** — Phase 1 (캐시 핫픽스 + API 응답 형식 변경)
2. **패키지 재생성** — `@repo/api-client` 업데이트, lockfile 갱신
3. **클라이언트 배포** — Phase 2~3
4. 배포 후 staging에서 QA 매트릭스 수행
5. 프로덕션 배포

**롤백 플랜**: Phase 1.4 (응답 DTO 변경)는 클라이언트와 계약 변경이므로, 서버가 먼저 배포되고 클라이언트가 구버전일 때 호환 문제 없는지 확인. 필요 시 응답 형식을 `errors` 키 선택적으로 설계하여 구버전 클라이언트도 동작.

---

## 일정 요약

| Phase | 일수 | 주요 산출물 |
|---|---|---|
| 1. 서버 보강 | 0.5일 | 캐시 핫픽스, 행수 가드, isBiz 가드, dry-run 응답 |
| 2. 클라이언트 UI | 3.5일 | `/pet/bulk` 페이지 + reactgrid + 커스텀 셀 |
| 3. 공용 zod + enum 정리 | 0.5일 | 단일 출처 스키마/맵 |
| 4. QA | 1일 | 체크리스트 통과 |
| 5. 문서 + 배포 | 0.5일 | 유저/개발자 문서, deprecation 처리 |
| **합계** | **~6일** | |

---

## 리스크 및 완화

| # | 리스크 | 완화 |
|---|---|---|
| R1 | reactgrid 커스텀 셀 (MultiSelect, Parent) 복잡도 과소평가 | Phase 2 시작 직후 MultiSelectCellTemplate 프로토타입으로 ETA 재검증 |
| R2 | 200행 원자 트랜잭션 락 경합 | 오프피크 테스트 + MySQL `innodb_lock_wait_timeout` 확인 |
| R3 | 파일 임포트 + 스프레드시트 merge 시 컬럼 누락으로 사용자 혼란 | 임포트 시 결과 요약 다이얼로그 ("N행 추가됨, M행 잘림") |
| R4 | `nanoid(8)` 충돌 — 200행 일괄 생성 시 배치 내 충돌 가능성 | 생성 후 배치 내 집합 중복 체크 + 재생성 루프 (현행 로직에 보강) |
| R5 | Excel에서 복붙 시 데이터 타입 불일치 (숫자 셀에 문자열) | 붙여넣기 후 자동 재검증 → 잘못된 셀 하이라이트 |
| R6 | dry-run 응답 변경이 다른 소비자(기존 AddPetBulkButton)에 영향 | 기존 컴포넌트를 `ImportFileButton`으로 흡수하며 응답 매핑 동시 업데이트 |
| R7 | BizGuard가 모든 브리더스룸 경로에 작동하는지 확인 필요 | `/pet/bulk` 경로가 BIZ_EXEMPT에 들어있지 않은지 검증 |

---

## 의사결정 기록

| 결정 | 사유 |
|---|---|
| reactgrid over glide-data-grid | 커스텀 셀 에디터가 많고(MultiSelect/Parent) 200행 규모에서 성능 여유 |
| 부분 성공 불허 | 트랜잭션 원자성 + UX 단순성 |
| 200행 제한 | 트랜잭션 부하 + "업로드 후 초기화" 요구 → 200으로 충분 |
| isBiz만 허용 | 일반 유저 실수로 대량 등록 방지 + 기존 가드 재사용 |
| 파일 업로드 유지 | 기존 운영자 워크플로우 호환 + 엑셀 복붙 경로 |
| 모바일 제한 | 스프레드시트 UX 품질 보장 + 관련 코드 복잡도 감소 |
