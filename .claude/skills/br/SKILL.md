---
name: br
description: 브랜치 또는 GitHub PR 의 모든 diff 를 정밀 리뷰. local 모드는 항목을 선택해 코드에 직접 반영, --pr 모드는 GitHub 에 inline 코멘트로 게시.
---

## 목적

브랜치의 누적 변경분(여러 커밋 포함)을 **버그·잠재 결함·일관성·계약 위반·설계 품질** 관점에서 정밀하게 리뷰한다.

이 skill 은 **두 가지 모드** 를 지원한다:

- **local (기본)** — `/br` 인자 없음 또는 `--base/--scope/--quick`. 대화 내 마크다운 리포트 → 사용자가 항목 선택 → Claude 가 코드 직접 수정.
- **PR (`--pr`)** — `/br --pr <num>` 또는 `/br --pr <url>`. GitHub PR 의 inline 코멘트 + review body → dry-run 미리보기 → 사용자 승인 → GitHub 에 게시.

PR 단위 리뷰 (`/rv`) 가 *외부 리뷰어가 단 코멘트를 다루는 방향* 인 것과 달리, 이 skill 은 *내가 직접 PR 을 리뷰하는 방향* 이다.

## 리뷰 관점 (Mindset)

이 skill 은 **30년차 글로벌 빅테크 시니어 엔지니어** 의 시선을, **소규모 스타트업의 현실 제약** 위에서 적용한다.
즉 "이론적으로 가장 깨끗한 코드" 가 아니라, **작은 팀이 한정된 인프라/비용으로 빠르게 움직이면서 망가지지 않을 코드** 를 추구한다.

다음 질문을 머릿속에 띄워두고 모든 변경을 본다:

**유지보수성**
- 이 코드는 6개월 뒤 처음 보는 사람이 자신 있게 수정할 수 있는가?
- 이 코드를 삭제하는 것이 추가하는 것만큼 쉬운가? (deletability)
- 새로운 케이스가 추가될 때 몇 곳을 동시에 수정해야 하는가? (shotgun surgery 측정)
- 함수 이름만 보고 호출자가 부수효과를 예측할 수 있는가? (intent-revealing)
- 이 추상화는 *지금* 두 번 이상 반복돼서 만든 것인가, 미래를 가정해서 만든 것인가? (rule of three)
- 단일 진실 공급원(SSoT)을 지키는가, 아니면 같은 사실을 여러 곳에서 재선언하는가?
- 장애가 났을 때 로그/메트릭만 보고 원인을 좁혀갈 수 있는가? (observability)

**스타트업 현실 (성능 / 비용 / 운영 부담)**
- 이 변경이 **DB / 외부 API / 스토리지 / 대역폭 비용** 을 얼마나 늘리는가? (트래픽 N배일 때 비용은?)
- N+1 query, 페이지네이션 없는 list, 캐시되지 않는 hot path 가 새로 생겼는가?
- **불필요한 round-trip** 이 추가됐는가? (DB 한 번에 가능한 걸 두 번 호출, 캐시로 막을 수 있는 걸 매번 조회)
- LLM API, 결제 게이트웨이, 푸시, 이미지 변환 등 **유료 외부 호출** 의 호출 빈도와 캐싱은 적절한가?
- 이미지/파일 업로드: 원본 그대로 저장해 S3 비용을 키우진 않는가? (썸네일/리사이즈/포맷)
- 인덱스 없는 컬럼으로 정렬/필터하는 쿼리가 있는가? (작은 테이블에선 OK 지만 곧 hot spot)
- 모니터링/알림이 필요한 새 hot path 인데 메트릭이 없는가?
- 운영 부담: 새 인프라/외부 SaaS 의존이 *지금 단계* 의 팀 규모에 적정한가? (AWS Lambda, Redis cluster, ElasticSearch 등 도입 정당성)
- 이 변경이 망가졌을 때 **수동 복구** 가 가능한가? (idempotency, audit log, soft delete)

**DB 스키마 / 쿼리 — 가장 자주 흔들리는 부분**
- 이 팀은 DB 설계와 쿼리 최적화가 약한 점이 알려져 있다. **DB 가 변경된 PR 에서는 카테고리 P 를 가장 먼저, 가장 깊이 본다.**
- "지금 동작하니까 OK" 가 가장 위험. 인덱스 누락, N+1, 마이그레이션 함정은 **트래픽이 늘기 전엔 절대 드러나지 않는다.**
- DB 변경(스키마/쿼리/인덱스/마이그레이션) 이 보이면 무조건 의식적으로 멈추고, P 카테고리 전체를 한 항목씩 통과시킨다.

**판단 균형**
- 이 PR 의 변경이 *의도적인* 위험인가, *우연한* 위험인가?
- 빅테크라면 막아야 할 안티패턴이지만, 스타트업 단계에서는 *지금은 OK, 트래픽 N 배 시 재검토* 가 적절한 항목인가?
- 단, **DB 인덱스 누락 / N+1 / 페이지네이션 부재 / synchronize 의존** 은 스타트업 단계여도 즉시 잡는다 (수정 비용은 낮고, 방치 비용은 기하급수적).

시니어의 직감으로 "냄새" 가 나면 반드시 리뷰 항목으로 만든다. 단, 항상 **거짓 양성을 경계** 한다 — 코드를 보지 않고 "이럴 것이다" 로 만들지 말고, 의심되면 Read/Grep 으로 확인.

## 0. Argument 처리

사용자가 `/br <args>` 형태로 호출했으면 다음을 우선 적용:

**공통 옵션 (양 모드)**
- `--base <branch>`: 비교 대상 브랜치 지정 (기본: `main`). PR 모드에선 PR 의 base 가 우선이라 무시됨.
- `--scope <glob>`: 특정 경로만 리뷰 (예: `apps/server/**`)
- `--quick`: Critical/Important 만, Suggestion 은 생략

**PR 모드 옵션**
- `--pr <num>` 또는 `--pr <url>`: 특정 PR 을 리뷰. 값을 생략한 `--pr` 만 쓰면 현재 브랜치의 open PR 을 자동 탐지 (`gh pr view --json`).
- `--post`: dry-run 비활성화 → 미리보기 후 즉시 게시. **명시하지 않으면 항상 dry-run + 사용자 승인.**
- `--self-only`: PR author 가 본인이 아니면 즉시 중단 (실수로 남의 PR 에 코멘트 방지)
- `--request-changes`: review event 를 `REQUEST_CHANGES` 로 게시. 본인 PR 에는 사용 불가. 명시 없으면 항상 `COMMENT`.

args 가 없으면 local 모드 기본값으로 진행. `--pr` 가 있으면 자동으로 PR 모드로 전환.

## 1. 변경 범위 파악 (병렬 실행)

다음 명령을 **단일 메시지에서 병렬로** 실행:
- `git log --oneline <base>..HEAD` — 커밋 히스토리
- `git diff <base>...HEAD --stat` — 파일별 변경량 (3개 dot 주의: merge-base 기준)
- `git status` — 미커밋 변경분 존재 여부 확인

미커밋 변경이 있으면 사용자에게 "커밋 후 리뷰를 권장합니다. 그래도 진행할까요?" 라고 묻고 동의를 받은 뒤 진행.

## 2. Diff 수집 전략 (context 보호)

전체 diff 가 클 가능성이 높으므로 한 번에 전체를 읽지 말고 **논리 그룹** 단위로 나눠서 읽는다:

- **서버**: `apps/server/**` 의 service / controller / entity / dto / module 파일을 그룹화
- **클라이언트**: `apps/client/**`
- **모바일**: `apps/mobile/**`
- **공유 패키지**: `packages/**` (orval 자동 생성물은 별도 그룹)
- **인프라/설정**: 루트 config, `.github/**`, dockerfile 등

각 그룹마다 `git diff <base>...HEAD -- <paths>` 로 가져온다.

diff 만으로 판단이 어려운 경우 (변경된 함수의 호출자, 주변 코드, enum/default 값 등) 다음을 추가 확인:
- `git show HEAD:<file>` 로 변경 후 전체 코드
- `git show <base>:<file>` 로 변경 전 전체 코드
- `Read` / `Grep` 으로 변경되지 않은 관련 파일

특히 **반드시 확인할 것**:
- 변경된 entity 의 default 값과 nullable 여부
- 변경된 API 의 호출자 전체 (server ↔ client ↔ mobile 일치 여부)
- 변경된 함수의 트랜잭션 경계
- 새로 추가된 컬럼/필드의 마이그레이션/synchronize 설정
- orval 자동 생성된 타입이 swagger DTO 와 일치하는지

**DB 변경이 감지되면** (entity / migration / `*.repository.ts` / queryBuilder / `find*` / `@Index` / 새 SQL 등) 반드시 추가로:
- 해당 entity 파일 전체 읽기 (관계, 인덱스, default 값, FK)
- 새 쿼리가 사용하는 컬럼들에 인덱스가 있는지 grep (`@Index`, migration 파일)
- 같은 테이블을 쓰는 다른 service 메서드 확인 (인덱스 변경이 영향을 주는가?)
- 마이그레이션 디렉토리 존재 여부 / synchronize 설정 확인
- 새 컬럼이면 기존 행에 대한 backfill / default 처리 명시 여부
- 새 쿼리의 예상 EXPLAIN 결과를 머릿속으로 시뮬레이션 (인덱스 사용 여부, filesort 발생 여부)

## 3. 정밀 리뷰 체크리스트

각 변경 파일에 대해 다음 체크리스트를 **반드시 모두** 적용한다. 항목별로 "해당 없음" 이라도 머리속에서는 통과시켜야 한다.

카테고리 개요:
- **A~I**: 정확성·안전성 (버그·계약 위반·라이프사이클·보안·회귀)
- **J~L**: 설계·가독성·중복 (시니어 관점의 코드 품질)
- **M**: 성능·비용 (애플리케이션·외부 API·스토리지·프론트엔드)
- **N~O**: 테스트 용이성·관측성·진화
- **P**: **DB 스키마·쿼리·마이그레이션** (이 팀의 약점 — 가장 깊이 본다)

### A. 데이터 무결성 / 동시성
- [ ] Race condition: count → check → insert/update 사이에 lock 이 필요한가?
- [ ] Transaction 경계: 여러 service 호출이 한 트랜잭션 안에 있어야 하는데 분리돼 있지 않은가?
- [ ] 트랜잭션 격리 수준 가정이 옳은가? (READ COMMITTED 기본)
- [ ] 트랜잭션 안에서 외부 호출 (HTTP, 캐시 invalidate) 이 있는가? (rollback 시 inconsistent)
- [ ] 정렬에 secondary key 가 필요한 곳은? (`createdAt DESC` 만 쓰면 동일 시각 비결정적)

### B. 캐시 일관성
- [ ] DB 를 변경했는데 관련 캐시 invalidate 가 누락된 곳이 있는가?
- [ ] 단건 캐시 vs 목록 캐시: 한 쪽만 invalidate 하고 있는가?
- [ ] TTL 에 의존하는 게 적절한가, 즉시 invalidate 가 필요한가?

### C. 에러 처리 / UX
- [ ] catch 블록에서 에러가 silently 무시되는가? (`catch {}`, 체크 없는 `handleX(error)`)
- [ ] 사용자에게 알려야 할 실패가 토스트/다이얼로그 없이 묻히는가?
- [ ] 에러 응답의 contract 가 클라이언트 기대와 일치하는가?
- [ ] 자동으로 상태가 변경됐을 때(예: silent demote) 사용자 안내가 있는가?

### D. 타입 안전성 / API contract
- [ ] orval/codegen 결과가 실제 의도한 타입인가? (특히 nullable + primitive)
- [ ] swagger `@ApiProperty` 에 `type` 명시가 누락된 곳은?
- [ ] 클라이언트 ↔ 서버 ↔ 모바일 메시지 union 이 모두 동기화돼 있는가?
- [ ] 새로 추가된 메시지/필드를 모든 consumer 가 처리하는가? (한쪽만 추가하고 다른 쪽이 무시하면 silent bug)

### E. 라이프사이클 / 정리
- [ ] useEffect cleanup, listener 해제, 타이머 cleanup 누락?
- [ ] 컴포넌트 unmount 시 진행 중인 비동기 처리의 결과가 setState 를 호출하는가?
- [ ] navigation reset 이 nested state 를 하드코딩해서 다른 파일과 강결합돼 있는가?

### F. 보안 / 권한
- [ ] 새 엔드포인트의 권한 체크 (`@Roles`, guard) 가 있는가?
- [ ] 사용자 입력에 대한 validation pipe 우회 가능성 (`@IsOptional` + `@ValidateIf` 조합 등)
- [ ] 다른 사용자의 리소스를 조작할 수 있는 경로가 있는가?

### G. 매직 넘버 / Sentinel
- [ ] 의미 없는 큰 숫자 (`9999`, `MAX_SAFE_INTEGER`) 가 응답에 그대로 노출되는가?
- [ ] 클라이언트가 sentinel 을 화면에 그대로 표시할 위험은?
- [ ] 매직 상수에 주석/이름이 붙어 있는가?

### H. 마이그레이션 / 스키마
- [ ] 새 컬럼/인덱스가 추가됐는데 마이그레이션 파일이 누락됐는가?
- [ ] `synchronize: true` 환경이라도 기존 데이터의 default 값 처리가 명시됐는가?
- [ ] 기존 행에 nullable: false 컬럼을 추가하면서 default 가 없는 경우?

### I. 회귀 / 부수효과
- [ ] 변경된 함수의 다른 호출자가 영향을 받는가?
- [ ] 기본값이 바뀌면서 기존 사용자의 데이터 의미가 달라지는가?
- [ ] 새 기능이 기존 필터/정렬/페이지네이션과 충돌하는가?

### J. 설계 / 아키텍처 (Design)
- [ ] 단일 책임 원칙: 한 함수/클래스가 두 가지 이상을 하는가? (이름이 "and" 로 이어지면 의심)
- [ ] 결합도: 변경이 file A 에서 일어났는데 왜 file B,C,D 도 같이 바뀌어야 하는가? (shotgun surgery)
- [ ] 응집도: 한 모듈 안의 함수들이 같은 추상화 수준/도메인을 공유하는가?
- [ ] 계층 누수: 비즈니스 로직이 controller / view 에 들어가 있지 않은가? (controller 는 thin)
- [ ] 추상화 수준 일관성: 한 함수 안에서 고수준 호출과 저수준 디테일이 섞여 있지 않은가?
- [ ] 새 기능이 *기존 추상화의 자연스러운 확장* 인가, 아니면 *기존 추상화를 깨고 끼워넣은* 것인가?
- [ ] God object/service: service 클래스가 너무 많은 책임을 떠안고 있는가? (1000 줄 + 다양한 도메인)
- [ ] 순환 의존성, 양방향 의존이 새로 생겼는가?
- [ ] public/private 경계가 적절한가? (필요 이상으로 export 한 internal helper)
- [ ] 새 API 의 인터페이스가 호출자 입장에서 *오해 없이 사용 가능* 한가?

### K. 가독성 / 유지보수성 (Readability)
- [ ] **네이밍**: 함수/변수 이름만 보고 의도와 부수효과를 예측할 수 있는가? (`processData` 같은 모호한 이름 금지)
- [ ] 중첩 깊이가 3을 넘는가? (early return / guard clause 로 평탄화 가능?)
- [ ] cyclomatic complexity 가 높은 함수가 있는가? (분기 10 이상 = 의심)
- [ ] **boolean flag 파라미터**: `doX(true, false, true)` 형태 — 호출부 가독성 0. 별도 함수 분리 또는 enum 사용.
- [ ] 긴 파라미터 리스트 (5+) — 객체로 묶거나 builder 패턴 고려
- [ ] **매직 스트링**: 상태값/타입을 문자열 리터럴로 비교하는 곳 → enum/const
- [ ] 주석이 *what* 이 아니라 *why* 를 설명하는가? "i를 1 증가" 같은 노이즈 주석 금지.
- [ ] 코드베이스 내 다른 유사 코드와 컨벤션이 일치하는가? (이전 패턴을 따르는 것이 새 패턴 도입보다 안전)
- [ ] 죽은 코드, 주석 처리된 코드, `// TODO` 누적이 새로 생겼는가?
- [ ] 사용되지 않는 import / 변수 / 파라미터 / 타입이 남아 있는가?

### L. 중복 / 추상화 (DRY balance)
- [ ] 같은 로직이 N 곳에 반복되는데 추상화가 빠진 곳? (rule of three: 3 번째 등장 시 추상화)
- [ ] 반대로 *한 번만 쓰일* 헬퍼/추상화가 새로 생겼는가? (premature abstraction)
- [ ] 같은 *데이터* 가 여러 곳에 중복 정의되는가? (단일 진실 공급원 위반 — enum/상수/타입)
- [ ] 비슷해 보이지만 미묘하게 다른 두 함수가 존재 → 합치는 게 좋은지, 그대로 두는 게 명확한지 판단
- [ ] copy-paste 흔적 (`// 위 함수와 동일하지만 X만 다름`) 이 보이는가?

### M. 성능 / 비용 (Performance & Cost — 스타트업 핵심)

스타트업은 인프라 비용이 곧 런웨이다. "지금 트래픽" 이 아니라 **"트래픽 10배 / 100배일 때 이 변경이 비용·지연시간에 어떤 곡선을 그리는가"** 를 본다.

**DB 비용 / 쿼리**
- [ ] **N+1 query**: loop 안에서 DB 호출하는가? `IN` 절 / `JOIN` / `loadMany` / DataLoader 로 batch 가능?
- [ ] 페이지네이션 없는 `find()` / `findAll()` 이 있는가? 작은 테이블도 곧 hot spot.
- [ ] 정렬/필터 컬럼에 **인덱스가 있는가**? 새 쿼리 패턴이 인덱스 없이 동작하는가?
- [ ] `count(*)` 를 hot path 마다 호출하는가? 캐시/incremental counter 로 대체 가능?
- [ ] 트랜잭션 안에서 외부 호출(HTTP, 캐시) 이 있어 lock 점유 시간 / connection pool 점유가 길어지는가?
- [ ] 같은 데이터를 한 요청 안에서 여러 번 fetch 하는가? request-scope cache / memo 가능?
- [ ] `SELECT *` 로 큰 컬럼(JSON, BLOB, TEXT) 을 매번 끌어오는가? `select` 컬럼 한정 권장.
- [ ] eager loading 으로 join 폭증 — 필요한 relation 만 로드하는가?
- [ ] soft delete / `isDeleted = false` 조건에 인덱스가 포함된 복합 인덱스가 있는가?

**캐싱 전략**
- [ ] hot read path 에 캐시가 누락됐는가? (Redis / in-memory / React Query / HTTP cache)
- [ ] 캐시 TTL 이 데이터 변경 빈도에 비해 적절한가? (너무 짧으면 무용, 너무 길면 stale)
- [ ] 캐시 stampede 위험 (popular key TTL 만료 시 동시 재계산) — single-flight 가 필요한가?
- [ ] 클라이언트 측 React Query staleTime 이 0/기본값이라 매 마운트마다 refetch 하는가?
- [ ] 이미지/정적 자원에 CDN / `Cache-Control` 헤더가 적절한가?

**외부 API / 유료 호출**
- [ ] LLM, 결제, 푸시, SMS, 이메일, 지도 API 같은 **유료 외부 호출** 의 호출 빈도가 적절한가?
- [ ] 같은 외부 응답을 단기 캐시할 수 있는가? (예: geocoding 24h 캐시)
- [ ] retry 정책이 무한루프/exponential blowup 으로 비용을 키우진 않는가?
- [ ] webhook / polling 중 polling 인터벌이 과한가? (1초 polling 은 거의 항상 너무 짧음)
- [ ] LLM 호출에 prompt caching, 짧은 system prompt, 필요한 경우만 호출하는 가드가 있는가?

**스토리지 / 대역폭**
- [ ] 이미지/파일 업로드: 원본 그대로 저장하는가? (썸네일 / WebP / AVIF / 리사이즈)
- [ ] S3 객체에 lifecycle policy 가 있는가? (오래된 임시 파일 자동 삭제)
- [ ] 응답 페이로드에 클라이언트가 쓰지 않는 큰 필드가 포함됐는가? (egress 비용)
- [ ] 모바일 WebView 에 큰 번들/이미지가 매번 다운로드되는가? (Cache-Control + immutable hash)
- [ ] 로그/이벤트가 무한히 쌓이는 테이블이 있는가? archival / partition 계획?

**프론트엔드 성능**
- [ ] React: 큰 list 렌더링에 key 가 잘못되거나 memoization 누락?
- [ ] React: 의존성 배열에 매 렌더 새로 만드는 객체/함수가 들어가 무한 재계산하는가?
- [ ] 큰 list 의 알고리즘 복잡도 — O(n²) 가 숨어있는가?
- [ ] 무의미한 `await` 직렬화 — 독립적인 비동기 호출은 `Promise.all` 가능?
- [ ] 메모리 누수: 이벤트 리스너, setInterval, WebSocket, IntersectionObserver 의 cleanup 누락?
- [ ] 큰 컴포넌트 트리에서 lazy loading / code splitting 기회를 놓쳤는가?
- [ ] 모바일: 큰 리스트에 `FlatList` 대신 `ScrollView + map` 을 쓰고 있는가?

**판단 기준 (스타트업 톤)**
- 리뷰 항목에 **"지금 트래픽에선 OK, 하지만 X 배가 되면 Y 비용/지연 발생"** 을 명시한다.
- 즉시 고쳐야 할 비용 폭탄(N+1, 무한 polling, 무한 retry, 매 요청 외부 호출) 은 🔴.
- 곧 hot spot 이 될 가능성이 큰 곳(인덱스 누락, 캐시 누락) 은 🟠.
- 코드가 깔끔하면 더 좋을 정도(메모이제이션 누락 등) 는 🟡.

### N. 테스트 용이성 / 관측성 (Testability / Observability)
- [ ] **순수성**: 비즈니스 핵심 로직이 I/O 와 분리되어 있는가? (테스트 시 mock 할 표면이 작은가)
- [ ] DI 또는 인자 주입으로 외부 의존성을 교체 가능한가?
- [ ] 핵심 흐름에 로깅이 있는가? (성공 path 에도 1줄 정도, 실패 path 에는 충분한 context)
- [ ] **에러 로그가 디버깅 가능한가?** — userId, requestId, 입력값, 발생 위치 포함?
- [ ] 사용자가 신고할 때 식별할 수 있는 단서를 응답에 남기는가? (errorId / requestId)
- [ ] silent state change (자동 강등, 자동 복구 등) 가 audit log / 메트릭에 기록되는가?

### O. 진화 / 확장성 (Evolution)
- [ ] **삭제 가능성**: 이 코드를 나중에 제거하기 쉬운가? (feature flag, 격리된 모듈)
- [ ] 새 케이스 추가 시 몇 곳을 동시에 수정해야 하는가? (1~2곳이면 OK, 5곳 이상이면 리팩터)
- [ ] backwards compatibility 를 깨는 변경인데 마이그레이션 경로가 없는가?
- [ ] 추측에 기반한 일반화 (speculative generality) — *지금* 필요 없는 옵션/타입 변수
- [ ] 결제, 권한, 한도 같은 정책이 코드에 흩어져 있지 않고 한 곳(policy 클래스)에 모여 있는가?

### P. DB 스키마 / 쿼리 / 마이그레이션 (이 팀의 약점 — 가장 깊이 본다)

> 이 팀은 DB 설계와 쿼리 최적화가 약하다는 것이 알려져 있다. DB 가 변경된 PR 에서는 **이 카테고리를 가장 먼저, 가장 자세하게** 적용한다. 항목이 길어 보이지만 무시하지 말고 한 줄씩 통과시킨다.

#### P-1. 스키마 설계
- [ ] **컬럼 타입** 적절성:
  - 정수: INT(unsigned) vs BIGINT — 사용자/이벤트 ID 처럼 무한 증가할 수 있으면 BIGINT
  - 문자열: VARCHAR 길이 명시. 의미 있는 상한이 있는가? (이메일 320, 닉네임 50 등)
  - 시간: TIMESTAMP(UTC) vs DATETIME — timezone 처리 명확한가? `createdAt`/`updatedAt` 자동 갱신 옵션 일관성?
  - boolean: TINYINT(1). DB 레벨에서 0/1 로만 다루는가?
  - JSON 컬럼: 정말 unstructured 인가? 조회/필터링이 필요하면 별도 컬럼/테이블이 맞다 (JSON 인덱싱 비용 큼)
  - ENUM: 추후 옵션 추가가 잦으면 ENUM 변경 비용이 큼 → string + check 또는 lookup table
- [ ] **NULL 의미**: nullable 이 정말 "값 없음" 을 표현하는가? 단순 default 가 더 명확하지 않은가?
- [ ] **NOT NULL 추가 시 backfill 계획**: 새 컬럼을 NOT NULL 로 도입할 때 기존 행에 default/backfill 이 명시됐는가? (이 함정을 자주 봄)
- [ ] **정규화 vs 비정규화**:
  - 새 컬럼이 다른 테이블의 정보를 *복제* 하는가? (denormalization → 동기화 책임 발생)
  - 정규화로 인해 hot read path 에서 N+1 이 생기는가? 의도적 비정규화면 주석으로 명시
- [ ] **외래 키 (FK)**:
  - 관계가 명백한데 FK constraint 가 빠져 있지 않은가?
  - `ON DELETE` / `ON UPDATE` 동작이 비즈니스 의도와 일치하는가? (CASCADE/RESTRICT/SET NULL)
  - FK 컬럼에 인덱스가 있는가? (MySQL 은 자동 생성, PostgreSQL 은 수동)
- [ ] **유일성 제약**: 비즈니스 invariant (예: `(userId, email)`, `(petId)`) 가 UNIQUE 로 강제되고 있는가? 코드에서 중복 체크만 하면 race 로 깨짐.
- [ ] **ID 생성 전략**: auto-increment / UUID v4 / UUID v7 / ULID — 정렬 가능성과 인덱스 효율을 고려했는가? 새 테이블이면 v7/ULID 권장 (v4 는 인덱스 단편화 큼)
- [ ] **감사(audit) 컬럼**: `createdAt`, `updatedAt`, `deletedAt` 이 일관되게 추가됐는가?
- [ ] **soft delete**: `isDeleted` / `deletedAt` 패턴이 일관된가? 두 가지가 섞여 있지 않은가?
- [ ] **네이밍 컨벤션**: 기존 테이블/컬럼과 일치하는가? (snake_case, 단수/복수 통일)
- [ ] **불필요하게 큰 컬럼**: TEXT/BLOB/JSON 이 자주 SELECT 되는 hot path 에 있는가? 별도 테이블 분리 검토.

#### P-2. 인덱스 설계
- [ ] **새 쿼리의 모든 WHERE / JOIN / ORDER BY 컬럼에 인덱스가 있는가?** 새 endpoint 추가 시 가장 자주 누락되는 항목.
- [ ] **복합 인덱스의 컬럼 순서**가 leftmost prefix rule 을 따르는가?
  - 자주 함께 쓰이고, equality 필터가 앞, range 필터가 뒤
  - 예: `WHERE ownerId = ? AND createdAt > ?` → `(ownerId, createdAt)` 가 정답
- [ ] **인덱스 중복**: `(a)` 와 `(a, b)` 가 동시에 있으면 `(a)` 는 잉여 (앞쪽 prefix 가 커버)
- [ ] **함수/형변환으로 인한 인덱스 무효화**:
  - `WHERE LOWER(name) = ?`, `WHERE DATE(createdAt) = ?` → 인덱스 안 탐
  - 해결: 정규화된 컬럼 추가, 또는 functional/expression index
- [ ] **타입 불일치**: `WHERE id = "123"` (id 가 INT) — 드라이버가 자동 변환해도 EXPLAIN 으로 확인
- [ ] **`LIKE '%foo%'`**: 인덱스 무효화. 검색 기능이면 full-text 또는 외부 검색 엔진 (단, 도입 비용 비교)
- [ ] **soft delete 인덱스 포함**: `WHERE isDeleted = false AND ownerId = ?` 가 자주 나오면 `(ownerId, isDeleted)` 복합 인덱스 (또는 partial index)
- [ ] **카디널리티 낮은 단독 인덱스**: status, isPublic 등 boolean/소수 값 컬럼 단독 인덱스는 효과 적음. 다른 컬럼과 복합으로.
- [ ] **인덱스 추가의 비용**: 큰 테이블의 INSERT/UPDATE 가 느려짐 — 정말 필요한가?
- [ ] **인덱스 생성 자체의 락**: 운영 큰 테이블에 인덱스 추가는 long lock 위험 — `pt-online-schema-change`, `gh-ost`, online DDL 검토
- [ ] **사용되지 않는 인덱스**: 점차 누적되면 쓰기 비용만 발생. (information_schema 로 주기 점검 권장 — 이 PR 범위 외)

#### P-3. 쿼리 작성 / 성능
- [ ] **N+1 query** (가장 흔한 실수):
  - loop 안에서 단건 fetch → `IN` 절 / `JOIN` / DataLoader 로 batch
  - ORM 의 lazy loading 이 hidden N+1 을 만들지 않는가?
- [ ] **`SELECT *` 회피**: 큰 JSON/TEXT 컬럼이 있을 때 매번 끌어오는가? 필요한 컬럼만 명시.
- [ ] **페이지네이션**:
  - 무한 스크롤이면 cursor 기반 (createdAt + id) — OFFSET 은 깊은 페이지에서 비례해서 느려짐
  - **LIMIT 없는 list 쿼리** 가 있는가? 작은 데이터에서 OK 였다가 갑자기 터짐.
  - 정렬 없는 페이지네이션 → 결과가 비결정적, 중복/누락 발생
- [ ] **`COUNT(*)` 전체 카운트**: 정말 필요한가? approximate count (`SHOW TABLE STATUS`), incremental counter, 또는 "더 보기" 패턴으로 회피
- [ ] **EXISTS vs IN vs LEFT JOIN ... NULL** — 의도에 맞는 패턴인가? (큰 서브쿼리는 EXISTS 가 보통 빠름)
- [ ] **불필요한 DISTINCT**: 보통 잘못된 JOIN 의 증상 (1:N 관계 join 으로 행이 부풀어남)
- [ ] **ORDER BY 가 인덱스를 사용하는가?**: 인덱스 컬럼 순서 + ASC/DESC 일치 필요. EXPLAIN 에 `Using filesort` 가 보이면 의심.
- [ ] **GROUP BY 의 인덱스 활용**: `Using temporary` 경고는 메모리/디스크 임시 테이블 발생
- [ ] **JOIN 폭증**: ORM `relations: [...]` 로 너무 많은 자식 테이블을 한 번에 join 하지 않는가? — 별도 쿼리로 쪼개는 게 빠를 수 있음
- [ ] **트랜잭션 안의 read 가 lock 을 잡는가?**: TypeORM 의 `lock: { mode: 'pessimistic_read' }` 옵션 명시 여부
- [ ] **트랜잭션 안의 외부 호출 금지**: HTTP / 캐시 / 메시지 큐 호출이 트랜잭션 안에 있으면 connection pool 점유 폭증
- [ ] **큰 UPDATE/DELETE 는 chunked**: `WHERE id BETWEEN ... LIMIT 1000` 으로 잘라서 처리. 한 번에 처리하면 lock & redo log 폭증
- [ ] **race-safe upsert**: UNIQUE 충돌 케이스에 `INSERT ... ON DUPLICATE KEY UPDATE` 또는 `ON CONFLICT` 를 쓰는가? select + insert 패턴은 race 로 깨짐

#### P-4. ORM 함정 (TypeORM 기준)
- [ ] **`save()` 의 숨은 비용**: select + insert/update 두 번 — 단순 update 면 `update()` 직접 호출이 1 round-trip
- [ ] **`find` 의 `relations` 옵션**: 모든 자식을 매번 eager load 하는가? 필요한 곳만 별도 메서드로 분리 권장
- [ ] **`createQueryBuilder().getRawOne()`** 사용 시 entity 인스턴스가 아니라 plain object — 메서드 호출 가정한 코드와 충돌
- [ ] **cascade 옵션**: 의도하지 않은 자식 insert/update/delete 가 일어나는가?
- [ ] **subscribers / EventSubscriber**: hot path 에서 매번 동작하는가? 부수효과 추적 어려움
- [ ] **synchronize: true** 의존: 운영에서는 절대 켜지 않는다. 마이그레이션 파일을 명시적으로 생성/관리하는가?
- [ ] **`@Index` 데코레이터** vs 마이그레이션 파일 — 두 곳에 인덱스 정의가 어긋나지 않는가?
- [ ] **N+1 의 ORM 형태**: relation 을 lazy 로 두고 코드에서 `await pet.owner` 같은 접근을 loop 에서 하는가?

#### P-5. 마이그레이션 안전성
- [ ] **DDL 락 시간**: 큰 테이블에 ALTER 는 어떤 락을 잡는가?
  - MySQL 8 의 INSTANT ADD COLUMN 가능 여부 확인
  - PostgreSQL 11+ 는 default 추가가 metadata-only (fast)
- [ ] **컬럼 추가는 3단계**: NULLABLE 추가 → 코드 배포(쓰기 시작) → backfill → NOT NULL 전환
- [ ] **컬럼 삭제는 역순**: 코드에서 먼저 제거 → 배포 → 후속 마이그레이션 으로 컬럼 drop. 한 번에 하면 구버전 코드가 깨짐.
- [ ] **컬럼 rename 금지**: 추가 → 두 컬럼 동시 쓰기 → backfill → 읽기 전환 → 삭제 (5단계)
- [ ] **인덱스 추가**: 큰 테이블에서 online 모드인지 확인
- [ ] **마이그레이션의 down 메서드**: rollback 가능한가? (없으면 사고 시 복구 어려움)
- [ ] **마이그레이션 안의 풀스캔**: `SELECT * FROM huge_table` 같은 한 줄이 운영 DB 를 멈출 수 있음
- [ ] **데이터 마이그레이션 (DML)** vs 스키마 마이그레이션 (DDL) 분리: DML 은 chunked 배치로
- [ ] **synchronize: true 환경의 위험**: 코드 변경만으로 컬럼이 자동 추가/삭제됨 — 의도치 않은 데이터 손실

#### P-6. 운영 / 비용
- [ ] **DB 인스턴스 사양**: 현재 워크로드에 대한 헤드룸. (RDS t3.micro 에 100 QPS 는 곧 한계)
- [ ] **slow query log** 가 켜져 있고 모니터링되는가?
- [ ] **hot table 의 row 증가율**: 1년 후 row 수 추정. 1000만 행 넘어가면 인덱스 전략 재검토.
- [ ] **archival / partition 전략**: 로그/이벤트성 테이블이 무한 누적되는가? 오래된 데이터 cold storage 이전?
- [ ] **백업 검증**: 마이그레이션 직전 최신 백업이 있는가? 복구 시뮬레이션은 했는가?
- [ ] **read replica**: hot read path 가 분리 가능한가? (단, 도입 비용/복잡도 비교 — 스타트업 단계엔 빠르지 않을 수 있음)
- [ ] **connection pool 사이즈**: 인스턴스의 max_connections 와 앱 인스턴스 수 × pool size 가 균형 잡혀 있는가?

## 4. 리뷰 보고 형식

다음 형식으로 한국어 마크다운 리포트를 출력한다.

```markdown
# 브랜치 리뷰: <branch-name>

**범위**: <commit-count>개 커밋, <files>개 파일, +<insert>/-<delete>

## 🔴 Critical (수정 권장)

### [번호]. <한 줄 요약>
- `<file>:<line>` — <코드 인용 또는 스니펫>
- **원인**: ...
- **결과/영향**: ...
- **수정 방향**: ...

## 🟠 Important

### [번호]. <한 줄 요약>
...

## 🟡 Suggestion / Style

### [번호]. <한 줄 요약>
...

## ✅ 잘 된 부분
- ...
- ...

## 우선순위 조치 추천
1. 즉시 수정: #<번호>, #<번호>
2. 이번 PR 내 권장: #<번호>~#<번호>
3. 후속 작업으로 OK: #<번호>~#<번호>
```

**번호는 카테고리 무관 전체 통합 번호**로 매긴다 (예: #1~#15). 사용자가 "3, 5, 8 만 고쳐줘" 라고 답하기 쉽도록.

각 항목은 다음을 반드시 포함:
- **파일경로:라인** 명시 (사용자가 바로 클릭/탐색할 수 있게)
- **원인 → 결과 → 수정 방향** 3단 구조
- 코드 스니펫은 짧게 (3~5 라인 이내)

## 5. 선택적 수정 단계

리뷰 보고 직후, 사용자에게 **자유 텍스트로** 어떤 항목을 수정할지 묻는다:

```
어떤 항목을 수정할까? (예: "1, 3, 5" / "all critical" / "1-7" / "스킵")
```

응답 해석 규칙:
- `1, 3, 5` 또는 `1 3 5` → 해당 번호만
- `1-7` → 범위
- `all critical` / `critical` / `all 🔴` → Critical 카테고리 전체
- `all important` / `🟠` → Important 전체
- `all` → 모든 항목 (Suggestion 포함)
- `스킵` / `skip` / `nothing` / `no` → 종료
- 혼합 가능: `all critical, 9` → Critical 전체 + #9

선택된 항목들에 대해:
1. **TaskCreate** 로 각 항목을 task 로 생성 (병렬 처리하기 쉽게)
2. 각 항목의 "수정 방향" 을 따라 코드 수정
3. 수정 도중 추가 컨텍스트가 필요하면 Read/Grep 으로 확인
4. 한 항목을 끝낼 때마다 TaskUpdate 로 completed 표시
5. 수정 불가능하거나 추가 정보가 필요하면 `AskUserQuestion` 으로 사용자에게 질문

## 6. 최종 보고

모든 수정이 끝나면:
- **수정한 파일 목록** (file:line 단위로)
- **각 항목의 결과**: ✅ 완료 / ⚠️ 부분 완료(이유) / ❌ 보류(이유)
- **추가 검토 권장 사항**: 자동 수정 후 사람이 한 번 더 봐야 할 곳

⚠️ **자동 커밋하지 않는다.** 사용자가 변경 내용을 직접 확인한 뒤 `/c` 로 커밋하도록 안내.

## 7. PR 모드 (`--pr`)

`--pr` 가 주어지면 위의 1~6 단계 대신 이 섹션의 워크플로우로 진행한다.
**리뷰 방법론(체크리스트 A~P)은 local 모드와 100% 동일**하다. 차이는 *입력*(diff 출처)과 *출력*(GitHub 게시) 만이다.

### 7-1. PR 메타 정보 수집

다음을 병렬로 실행:

```
gh pr view <pr> --json number,title,url,headRefName,baseRefName,headRefOid,author,isCrossRepository,state,files
gh api user --jq .login   # 본인 login 확인 (self-PR 판단용)
```

검증:
- `state != OPEN` → 즉시 중단 (closed/merged 에는 게시 안 함)
- `--self-only` 가 있으면 `author.login != 본인 login` 일 때 즉시 중단
- `author.login != 본인 login` 인데 `--self-only` 가 없으면 사용자에게 "타인의 PR 입니다. 정말 진행할까요?" 확인
- `isCrossRepository: true` (fork PR) 이면 사용자에게 알림 — inline 코멘트 권한이 다를 수 있음
- `headRefOid` 를 변수로 보관 → `commit_id` 로 사용 (게시 직전에 한 번 더 fetch 해 stale 방지)

`--pr` 가 값 없이 호출됐으면 `gh pr list --head $(git branch --show-current) --json number,url --jq '.[0]'` 로 자동 탐지. 여러 개면 사용자에게 선택 받기.

### 7-2. PR Diff 수집

```
gh pr diff <pr>                                              # 전체 diff (text)
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate  # 파일별 patch + line metadata (JSON)
```

`pulls/files` API 응답의 각 파일은 `patch` 필드에 hunk 헤더(`@@ -a,b +c,d @@`)와 본문이 들어 있다. **inline 코멘트를 달려면 이 hunk 안의 라인 번호만 사용 가능**하므로, 파싱해서 commentable line set 을 미리 만든다:

```
파일별 commentable lines = patch 에서 ` `(공백) 또는 `+` 로 시작하는 라인의 새 파일 기준 라인 번호
```

context 보호를 위해 큰 PR 은 그룹별로 처리 (local 모드의 §2 와 동일 — server / client / mobile / packages / infra).

`gh pr diff` 만으로 판단이 어려우면 `gh api repos/.../contents/<path>?ref=<headRefOid>` 로 파일 전문을 받아본다.

**DB 변경이 감지되면** local 모드와 동일하게 entity 파일 / 마이그레이션 / 호출자를 추가로 본다 (§2 의 "DB 변경이 감지되면" 절차 그대로 적용).

### 7-3. 정밀 리뷰 (체크리스트 A~P)

§3 의 체크리스트 A~P 를 그대로 적용한다. PR 모드라고 항목 수가 줄어들지 않는다.
각 리뷰 항목을 만들 때마다 다음 정보를 같이 확정한다:

| 필드 | 결정 방법 |
|---|---|
| `path` | 리뷰 대상 파일 경로 (repo root 기준) |
| `line` | 리뷰가 가리키는 라인 (head 파일 기준 라인 번호) |
| `side` | 추가/수정 라인 → `RIGHT`, 삭제 라인 → `LEFT` |
| `start_line` | 멀티라인 코멘트일 때 시작 라인 (선택) |
| `inlineable` | `line` 이 §7-2 에서 만든 commentable line set 에 들어있으면 true, 아니면 false |
| `severity` | 🔴 / 🟠 / 🟡 |

**inlineable 분기**:
- `inlineable: true` → review payload 의 `comments` 배열에 inline 코멘트로 추가
- `inlineable: false` → 변경되지 않은 주변 코드 / 파일 전반 / cross-file 이슈. review payload 의 `body` (overall summary) 안에 "## 인라인으로 게시 못 한 항목" 섹션으로 묶어서 추가

### 7-4. 코멘트 톤 (실제 팀 리뷰처럼)

각 inline 코멘트의 본문은 다음 형식을 지킨다:

```markdown
🟠 [Important] <한 줄 요약>

**현상**: <보이는 코드와 그 동작>

**이슈**: <왜 문제인가, 어떤 시나리오에서 깨지는가>

**제안**: <구체적 수정안>
```

작성 가이드:
- **한국어, 존댓말**. 격식 너무 무겁지 않게: "~할게요", "~인 것 같아요", "~확인 부탁드려요" 톤.
- 단정 금지: "이거 틀렸어" 가 아니라 "이 케이스에서 X 가능성이 있어 보여요".
- 한 코멘트는 **5~12줄 이내**. 길어지면 본문 review body 로 옮기고, inline 에는 짧은 요약 + "자세한 분석은 review body 참고".
- 가능하면 GitHub 의 `suggestion` 블록을 사용해 PR 작성자가 한 번 클릭으로 적용할 수 있게 한다:

````markdown
**제안**: `IN` 절로 batch 가능할 것 같아요.

```suggestion
const owners = await ownerRepo.find({ where: { id: In(pets.map(p => p.id)) } });
```
````

`suggestion` 블록은 **단일 라인(or 멀티라인 range) 의 정확한 교체** 일 때만 사용한다. 구조적 변경이거나 새 함수를 도입하는 제안은 일반 코드 블록(\`\`\`ts) 으로 작성.

### 7-5. Review payload 작성

모든 inline 코멘트를 **하나의 review** 로 묶는다. 개별 POST 금지 (PR 작성자에게 알림 N 번 → 스팸).

```
POST /repos/{owner}/{repo}/pulls/{number}/reviews
{
  "commit_id": "<headRefOid 직전 fetch 값>",
  "event": "COMMENT",
  "body": "<overall summary in markdown>",
  "comments": [
    { "path": "src/x.ts", "line": 42, "side": "RIGHT", "body": "🔴 [Critical] ..." },
    { "path": "src/y.ts", "start_line": 10, "line": 15, "side": "RIGHT", "body": "🟠 ..." }
  ]
}
```

`event` 결정:
- 기본: `COMMENT` (의견만, approve/block 없음)
- `--request-changes` 가 있고 본인 PR 이 아니면: `REQUEST_CHANGES`
- 본인 PR 이면 `REQUEST_CHANGES` / `APPROVE` 둘 다 GitHub 가 거부 → 항상 `COMMENT`

`body` (overall summary) 마크다운은 다음을 포함:

```markdown
## 리뷰 요약

총 <N>개 항목 (🔴 <c1> · 🟠 <c2> · 🟡 <c3>)
체크리스트 A~P 정밀 적용. 인라인 <X>개 / 본문 <Y>개.

## ✅ 잘 된 부분
- ...
- ...

## 🧭 우선순위 조치 추천
1. 즉시 수정: #1, #3 (인라인 #1, #3 참고)
2. 이번 PR 내 권장: #4~#7
3. 후속 작업으로 OK: #8~#12

## 📌 인라인으로 게시하지 못한 항목
변경 영역 밖이거나 cross-file 이슈라 inline 으로 못 단 항목들입니다.

### [본-1] <요약>
- 위치: `<file>` 전반 / `<file>:<line>` (변경 영역 밖)
- **현상**: ...
- **이슈**: ...
- **제안**: ...

---
🤖 `/br --pr` 으로 자동 생성된 self-review 입니다.
```

### 7-6. Dry-run 미리보기 (default)

`--post` 없이 호출되면 **절대 게시하지 않는다.** 대신 콘솔에 미리보기를 출력:

```
# PR #<num> 리뷰 미리보기 (dry-run)

게시 대상   : <pr-url>
PR 작성자   : <author> (본인 PR / 타인 PR)
base/head   : main → PET-287-pet-limits
commit_id   : a95bbd94...
event       : COMMENT
인라인 코멘트: <X>개  /  본문 코멘트: <Y>개

## Body Preview
<overall summary 의 처음 30줄>

## Inline Comments
[1] 🔴 apps/server/src/pet/pet.service.ts:135 (RIGHT)
🔴 [Critical] Race condition...

[2] 🟠 apps/server/src/pet/pet.service.ts:161 (RIGHT)
🟠 [Important] N+1 query 가능성...

...
```

미리보기 후 사용자에게 자유 텍스트로 묻는다:

```
이대로 게시할까? (예: "go" / "drop 3,7" / "edit 5: <new body>" / "취소")
```

응답 해석:
- `go` / `post` / `yes` / `네` → 그대로 게시
- `drop 3,7` 또는 `del 3 7` → 해당 번호 코멘트 제거 후 다시 미리보기
- `drop 🟡` → 특정 severity 전체 제거
- `edit N: <text>` → N번 코멘트 본문을 새 텍스트로 교체 후 다시 미리보기
- `move N to body` → N번을 inline → body 로 이동
- `취소` / `cancel` / `no` → 종료

### 7-7. 게시 직전 안전 점검

`--post` 또는 사용자 `go` 응답을 받은 직후, 게시 전에 다음을 다시 확인:

1. `gh pr view <pr> --json headRefOid,state` 재호출
2. `state` 가 여전히 `OPEN` 인가
3. `headRefOid` 가 7-1 에서 받은 값과 동일한가
   - 다르면 (리뷰 작성 중 새 push 발생) 사용자에게 알림: "PR 이 업데이트되었습니다. 리뷰를 다시 실행할까요?"
4. 모든 inline 코멘트의 `path/line` 이 새 head 의 commentable line set 에 여전히 유효한가
   - 유효하지 않은 항목은 자동으로 body fallback 으로 이동시키고 사용자에게 알림

### 7-8. 게시 및 결과 보고

```
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  -f commit_id=<sha> \
  -f event=COMMENT \
  -f body=@<temp body file> \
  -F comments[][path]=... \
  -F comments[][line]=... \
  -F comments[][side]=... \
  -F comments[][body]=...
```

> 실제로는 `comments` 배열을 정확히 보내려면 `gh api -X POST .../reviews --input <json-file>` 형태로 JSON 파일을 만들어 보내는 게 안전. multipart `-F` 만으론 nested 배열 표현이 불안정.

게시 성공 시 보고:
- review URL (`html_url`)
- 게시된 inline 코멘트 수 / body 길이
- review id (나중에 dismiss/삭제용 — 사용자가 잘못 보냈을 때 대비)

게시 실패 시 (가장 흔한 케이스: line 이 hunk 밖이라 422):
- 어느 코멘트가 실패했는지 표시
- 실패한 코멘트만 body 로 옮긴 새 review payload 를 만들어 다시 미리보기 → 사용자 승인 → 재게시
- 두 번 실패하면 중단하고 사용자에게 수동 조치 안내

### 7-9. PR 모드 안전장치 (요약)

- ✅ **dry-run 이 default**: `--post` 없으면 절대 게시 안 함
- ✅ **게시 직전 head SHA 재확인**: stale commit_id 게시 방지
- ✅ **state 가 open 인지 재확인**: closed/merged 에는 게시 안 함
- ✅ **본인 PR 우선**: author 가 본인이 아니면 추가 확인 (`--self-only` 면 즉시 중단)
- ✅ **REQUEST_CHANGES 는 명시적 opt-in**: `--request-changes` 없이는 항상 `event=COMMENT`
- ✅ **fork PR 알림**: `isCrossRepository: true` 인 PR 은 사용자에게 알림 후 진행
- ✅ **단일 review 로 묶기**: 알림 폭증 방지 — 절대 개별 코멘트 POST 하지 않음
- ✅ **inline 실패 시 body fallback**: line 매칭 실패 시 자동 회수

### 7-10. PR 모드와 local 모드의 차이 요약

| 단계 | local 모드 | PR 모드 (`--pr`) |
|---|---|---|
| diff 출처 | `git diff <base>...HEAD` | `gh pr diff` + `pulls/files` API |
| 기준 commit | working tree (미커밋 확인) | `headRefOid` |
| 결과물 | 대화 내 마크다운 리포트 | GitHub review (inline + body) |
| 사용자 인터랙션 | "어떤 항목 수정?" | "이대로 게시?" |
| 후속 동작 | Claude 가 코드 직접 수정 → /c 로 커밋 | 게시 후 종료 (수정은 PR 작성자 몫) |
| 안전 default | 코드 수정 전 사용자 검토 | dry-run → 사용자 승인 → 게시 |

## 핵심 원칙

- **컨텍스트 보호**: 한 번에 전체 diff 를 읽지 말고 그룹으로 나눠서 처리. 너무 크면 (>2000줄) Explore agent 로 그룹별 위임 고려.
- **추측 금지**: 코드를 보지 않고 "이럴 것이다" 로 리뷰 항목을 만들지 않는다. 의심되면 Read/Grep 으로 확인.
- **체크리스트 전수 적용**: 위 A~P 모든 카테고리를 머릿속으로 한 번씩 통과시킨다. "해당 없음" 이라도 무시하지 말고 의식적으로 확인.
- **DB 변경은 무조건 정밀 검토**: 이 팀의 약점이다. entity / 마이그레이션 / 새 쿼리 / 인덱스 변경이 보이면 P 카테고리 전체를 한 항목씩 통과시키고, 의심되면 entity 파일 / 마이그레이션 / 호출자 전체를 직접 읽어 확인. **인덱스 누락 / N+1 / 페이지네이션 부재 / synchronize 의존 / 마이그레이션 함정** 은 발견 즉시 🔴 또는 🟠.
- **거짓 양성 방지**: 리뷰 항목을 만들기 전 "이게 정말 버그인가? 의도적인 설계는 아닌가?" 한 번 더 자문.
- **스타트업 톤 유지**: 빅테크급 무거운 솔루션 (Kafka, ElasticSearch, GraphQL Federation 등) 을 함부로 권하지 않는다. *지금 단계의 팀과 트래픽에 맞는* 가장 단순한 해결책을 우선 제안하고, 필요 시 "트래픽 X 배 이상에서 재검토" 라는 단서를 단다.
- **비용 감각**: 모든 새로운 hot path 는 "트래픽 10배 / 100배 시 비용 곡선" 을 머릿속에서 시뮬레이션. N+1 / 무한 polling / 무한 retry / 매 요청 외부 호출 / 인덱스 누락 hot query 는 무조건 잡는다.
- **선택권 존중**: 리뷰 항목에 적힌 것이 모두 옳다고 가정하지 않는다. 사용자가 "스킵" 이라고 하면 깔끔하게 종료.
- **PR 모드의 안전 default**: GitHub 에 게시하는 행위는 *되돌리기 어려운* 행위 (PR 작성자/팀원에게 알림 + 협업 채널에 흔적). `--post` 명시 없이는 절대 게시하지 않는다. dry-run 미리보기 → 사용자 명시적 승인 → 게시 직전 head SHA 재확인 → 단일 review 로 묶어 한 번에 게시. 본인 PR 이 아니면 한 번 더 묻는다.
- **PR 코멘트 톤**: 단정적인 언어 금지. "이거 틀렸어" 가 아니라 "이 케이스에서 X 가능성이 있어 보여요". 한국어 존댓말, 과한 격식 없이. 가능하면 GitHub `suggestion` 블록으로 한 클릭 적용 가능하게.
