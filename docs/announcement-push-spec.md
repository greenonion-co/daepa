# 전체 공지 푸시(Announcement Broadcast) 기능 Spec

관리자가 입력한 공지 내용을, 활성 FCM 토큰을 가진 **전체 사용자**에게 푸시 알림으로 발송하는 기능.

## 1. 개요

| 항목 | 내용 |
|------|------|
| 트리거 | 관리자가 admin 페이지에서 제목/내용 입력 후 발송 |
| 대상 | `fcm_tokens.isActive = true` 인 모든 토큰 (가입일 무관) |
| 발송 방식 | 직접 토큰 멀티캐스트 (`sendEachForMulticast`, 500개 배치) |
| 처리 방식 | 비동기 fire-and-forget — 이력 저장 후 즉시 응답, 발송은 백그라운드 |
| 이력 | `announcements` 테이블에 발송 내용·통계 기록 (인앱 알림함에는 미노출) |
| 권한 | `USER_ROLE.ADMIN` (`RolesGuard`) |

## 2. 전체 흐름

```
[관리자 admin 페이지]
   │  제목/내용/(경로) 입력 → "전체 발송" → 확인 다이얼로그
   ▼
POST /v1/admin/announcement        (RolesGuard: ADMIN)
   │
   ▼
AnnouncementService.createAndBroadcast()
   │  1) announcements row 저장 (status=SENDING, count=0)
   │  2) void broadcastInBackground(announcement)   ← await 안 함
   │  3) { id, status, message } 즉시 응답  ──────────────► 관리자 화면: "발송 시작" 토스트
   │
   ▼ (백그라운드)
FcmService.sendBroadcast(title, body, data)
   │  - fcm_tokens 에서 isActive=true 토큰 전체 조회
   │  - 500개씩 admin.messaging().sendEachForMulticast()
   │  - 실패 토큰 → isActive=false 로 비활성화
   │  - { targetCount, successCount, failureCount } 반환
   ▼
announcements row update (status=SENT/FAILED, 각 count 갱신)
   │
   ▼
[사용자 기기] FCM 푸시 수신 (data.type=ANNOUNCEMENT, data.path?)
```

## 3. 데이터 모델

### `announcements` 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | int PK auto | |
| `title` | varchar | 공지 제목 |
| `body` | text | 공지 내용 |
| `data_path` | varchar nullable | 알림 클릭 시 이동 경로 (`data.path`) |
| `sent_by` | varchar | 발송한 관리자 userId |
| `status` | enum(`sending`,`sent`,`failed`) | 발송 상태 |
| `target_count` | int default 0 | 발송 대상 토큰 수 |
| `success_count` | int default 0 | 성공 토큰 수 |
| `failure_count` | int default 0 | 실패 토큰 수 |
| `failures_by_code` | json nullable | FCM 에러 코드별 실패 토큰 수 (예: `{"messaging/registration-token-not-registered": 30}`) |
| `created_at` | datetime | 생성 시각 |

> 스키마는 `synchronize: true` 설정으로 서버 부팅 시 자동 생성됨.
> 수동 적용용 DDL: [`announcement-push.sql`](./announcement-push.sql)

### 기존 재사용

- `fcm_tokens` — 발송 대상 토큰 소스 (변경 없음)
- `FcmService` — Firebase Admin 초기화 로직 재사용

## 4. API

### `POST /v1/admin/announcement`

- 권한: `ADMIN` (`@Roles(USER_ROLE.ADMIN) @UseGuards(RolesGuard)`)

요청:
```json
{ "title": "서비스 점검 안내", "body": "6/8 02:00~04:00 점검 예정", "path": "/notice/1" }
```

응답 (201):
```json
{ "id": 1, "status": "sending", "message": "공지 발송이 시작되었습니다." }
```

- `path`는 선택. 미입력 시 서버가 기본 경로(`/`, `DEFAULT_ANNOUNCEMENT_PATH`)로 채움.
- 푸시 `data`에는 항상 `{ type: "ANNOUNCEMENT", path }` 가 포함됨.

> 앱 알림 탭 핸들러([apps/mobile/App.tsx](../apps/mobile/App.tsx))는 `data.path`가 있으면 그 경로로 WebView 이동하고, 없으면 이동하지 않는다(`data.type`은 해석하지 않음). 따라서 공지 푸시는 항상 `path`를 채워 보낸다.

### `POST /v1/admin/announcement/test` (테스트 발송)

- 권한: `ADMIN`
- 전체 broadcast 코드 경로(`sendMulticast`)를 그대로 타되 **지정 유저의 활성 토큰에만** 전송. 라이브 DB에서도 안전.
- 이력(`announcements`)을 저장하지 않고 발송 결과를 **동기 반환**.

요청:
```json
{ "title": "테스트", "body": "테스트 내용", "path": "/notice/1", "targetUserId": "<유저ID>" }
```
- `targetUserId` 생략 시 요청한 관리자 본인에게 발송.

응답 (201):
```json
{ "targetCount": 1, "successCount": 1, "failureCount": 0 }
```

## 5. 파일 목록

### 서버 (`apps/server`)

| 파일 | 역할 |
|------|------|
| `src/fcm/announcement.entity.ts` | `announcements` 엔티티, `ANNOUNCEMENT_STATUS` enum |
| `src/fcm/announcement.dto.ts` | `CreateAnnouncementDto`, `CreateAnnouncementResponseDto` |
| `src/fcm/announcement.service.ts` | 이력 저장 + 백그라운드 broadcast 오케스트레이션 |
| `src/fcm/admin/admin.announcement.controller.ts` | `POST /v1/admin/announcement` |
| `src/fcm/fcm.service.ts` | `sendBroadcast()` 추가 (멀티캐스트 배치) |
| `src/fcm/fcm.module.ts` | 엔티티/서비스/컨트롤러 등록 |
| `src/app.module.ts` | `ENTITIES` 에 `AnnouncementEntity` 추가 |

### 클라이언트 (`apps/client`)

| 파일 | 역할 |
|------|------|
| `src/app/(브리더스룸)/admin/announcement/page.tsx` | 관리자 공지 입력/발송 폼 (role 가드 + 확인 다이얼로그) |

> 클라이언트는 orval 미생성 상태이므로 `AXIOS_INSTANCE` 직접 호출. 추후 orval 재생성 시 `adminAnnouncementController*` 함수로 교체 가능.

## 6. 기존 가입자 소급 적용

- 푸시는 **가입일이 아니라 `fcm_tokens` 의 디바이스 토큰** 기준으로 발송됨.
- 토큰 등록(`POST /v1/fcm/token`)은 앱 로그인 시점에 일어나므로, **가입 시점과 무관하게 활성 토큰만 있으면 모두 수신**. 별도 백필 불필요.
- 수신 불가 케이스 (소급 불가가 아니라 토큰 부재):
  - FCM 도입 후 앱 로그인 이력 없음 / 푸시 권한 거부 / 웹 전용 / 토큰 만료(다음 앱 실행 시 자동 재등록)

## 6.1 환경별 발송 가드 (실유저 보호)

`sendBroadcast()`는 환경에 따라 대상이 강제로 분리된다.

| 환경 (`NODE_ENV`) | 전체 공지(`POST /v1/admin/announcement`) 발송 대상 |
|------|------|
| `production` | 활성 토큰 전체 (실제 전 사용자) |
| 그 외 (dev 등) | `ANNOUNCEMENT_TEST_USER_ID` 유저에게만. **미설정 시 아무에게도 발송 안 함** |

- dev에서는 관리자 UI/엔드포인트를 그대로 눌러도 실유저에게 절대 나가지 않는다.
- env: `ANNOUNCEMENT_TEST_USER_ID` (`.env.local` 에 테스트 유저 ID 설정)
- 별도 `POST /v1/admin/announcement/test` 는 환경과 무관하게 `targetUserId` 1명에게만 발송 (이중 안전장치).

## 7. 설계 결정 및 한계

- **비동기 fire-and-forget**: 별도 큐 인프라(BullMQ 등)가 없어 NestJS 프로세스 내 백그라운드 실행. 서버 재시작 시 진행 중 발송은 유실될 수 있음 (대량 트래픽/재시도 보장 필요 시 큐 도입 검토).
- **인앱 알림함 미노출**: `user_notifications` 는 `(senderId, receiverId, type, targetId)` 유니크 1:1 구조라 전체 공지를 per-user row로 적재하면 부적합. 공지는 푸시 + `announcements` 이력만 저장.
- **부분 실패 허용**: 배치 단위 실패는 카운트에 집계, 실패 토큰은 자동 비활성화. 전체 실패 시 status=`failed`.
