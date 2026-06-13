# 클라이언트 인증 상태 관리 구조

## 1. 저장소 (Zustand Store)

**파일: `apps/client/src/app/(브리더스룸)/store/user.ts`**

```typescript
interface UserState {
  accessToken: string | null; // 반응형 상태 (tokenStorage와 동기화)
  user: UserProfileDto | null;
}

interface UserActions {
  initialize: () => Promise<void>;
  onLoginSuccess: (token: string) => Promise<void>;
  onLogout: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}
```

**저장 정책:**

- `accessToken`:
  - 영구 저장: localStorage (`tokenStorage`)
  - 반응형 상태: Zustand store (`useUserStore`)
  - **쿠키에는 저장하지 않음**
- `refreshToken`: HttpOnly 쿠키 (서버에서 관리)
- `user`: Zustand 메모리에만 저장 (새로고침 시 API로 fetch)

---

## 2. 토큰 저장 위치

| 토큰 | 저장 위치 | 접근 가능 | 만료 시간 | 설정 위치 |
|------|----------|----------|----------|----------|
| accessToken | localStorage | 클라이언트 JS만 | 1시간 | `apps/server/src/app.module.ts` → `JwtModule.register({ signOptions: { expiresIn: '1h' } })` |
| refreshToken | HttpOnly 쿠키 | 서버만 (XSS 방어) | 180일 | `AuthService.createJwtRefreshToken()` → `{ expiresIn: '180d' }` |
| auth code | URL 파라미터 (일회성) | 클라이언트 JS | 30초 | `AuthService.createAuthCode()` → `{ expiresIn: '30s' }` |

**왜 accessToken을 쿠키에 저장하지 않나요?**
- 보안: 쿠키 노출 최소화
- 단순화: localStorage만 관리
- SSR: refreshToken으로 accessToken 획득

---

## 3. 로그인 상태 확인 방법

### 인증 확인 훅 (권장)

**파일: `apps/client/src/hooks/useAuth.ts`**

```typescript
// 로그인 여부 + 유저 모두 필요할 때
const { isLoggedIn, user } = useAuth();

// 로그인 여부만 필요할 때 (가장 가벼움)
const isLoggedIn = useIsLoggedIn();

// 유저 정보만 필요할 때
const user = useUser();
```

### 사용 위치별 패턴

| 위치           | 훅/방식                       | 파일                                                       |
| -------------- | ----------------------------- | ---------------------------------------------------------- |
| page.tsx       | `useIsLoggedIn()`             | `apps/client/src/app/page.tsx`                             |
| Menubar        | `useIsLoggedIn()`             | `apps/client/src/app/(브리더스룸)/components/Menubar.tsx`  |
| AddPetButton   | `useIsLoggedIn()`             | `apps/client/src/app/(브리더스룸)/components/AddPetButton.tsx` |
| Sidebar        | `useIsLoggedIn()`             | `apps/client/src/app/(브리더스룸)/components/Sidebar.tsx`  |
| Header         | `useIsLoggedIn()`             | `apps/client/src/app/(브리더스룸)/pet/[petId]/components/Header.tsx` |
| 설정 (user 필요) | `useAuth()` → `{ user, isLoggedIn }` | `apps/client/src/app/(브리더스룸)/components/SidebarPanel/설정.tsx` |
| 이벤트 핸들러  | `useUserStore.getState().onLogout()` | 액션 실행 시 (구독 불필요)                                 |

### Zustand 접근 패턴

```typescript
// 1. 값 읽기 + 구독 (UI 반영)
const accessToken = useUserStore((state) => state.accessToken);
const user = useUserStore((state) => state.user);

// 2. 쓰기/액션 실행 (구독 불필요)
useUserStore.getState().onLogout();
useUserStore.getState().onLoginSuccess(token);

// 3. 권장: 추상화된 훅 사용
const isLoggedIn = useIsLoggedIn();  // !!accessToken 추상화
const user = useUser();              // state.user 추상화
```

---

## 4. 토큰/유저 설정 흐름

### A. 웹 로그인 (OAuth)

```
[로그인 페이지 (/sign-in)]
    ↓ OAuth 리다이렉트 (Kakao/Google/Apple)
    ↓ 서버에서 OAuth 인증 완료
    ↓ 30초 유효 auth code(JWT) 생성
    ↓ /sign-in/auth?status={status}&code={authCode} 로 리다이렉트
    ↓
[/sign-in/auth 페이지]
    ↓ URL에서 auth code 추출
    ↓ /api/auth/token?code={authCode} 호출
    ↓ 서버: auth code 검증 → accessToken + refreshToken(쿠키) 발급
    ↓
[onLoginSuccess(token)]
    ↓ tokenStorage.setToken(token) → localStorage에 저장
    ↓ initialize() 호출
    ↓ userControllerGetUserProfile() 호출
    ↓ set({ user: userData })
    ↓ 홈으로 리다이렉트
```

**참고:**
- redirect URL에는 단기 auth code만 포함 (refresh token 직접 노출 방지)
- auth code가 없는 경우 (기존 쿠키 기반) fallback으로 `authControllerGetToken()` 호출
- `/sign-in/auth` 페이지는 `(auth-callback)` 라우트 그룹에 위치

**관련 파일:**

- `apps/client/src/app/(auth-callback)/sign-in/auth/page.tsx`
- `apps/client/src/app/(브리더스룸)/store/user.ts`

### B. 앱 시작 시 자동 유저 정보 갱신

**파일: `apps/client/src/providers/AuthProvider.tsx`**

```typescript
useEffect(() => {
  initialize();
}, [initialize]);
```

- 토큰 있음 → `userControllerGetUserProfile()` 호출 → `set({ user })`
- 토큰 없음 → **(sign-in 페이지가 아니면) `authControllerGetToken()`으로 refresh 1회 시도**
  - 성공: 새 accessToken을 localStorage에 저장 후 user fetch — refresh 쿠키가 살아있는 한 세션 자동 복구 (access token 부재만으로 로그아웃되던 "며칠 뒤 로그아웃" 방지)
  - 실패(쿠키 무효/만료) 또는 sign-in 페이지: `set({ user: null })`

> **sign-in 페이지에서는 복구 시도를 건너뛴다** — 로그인 화면에서 유효 쿠키로 자동 재로그인되는 것을 막기 위함 (`window.location.pathname.startsWith("/sign-in")` 체크).

### C. Native App WebView에서 실행 시

```
[WebView 로드]
    ↓ Native에서 토큰 주입 (injectedJavaScriptBeforeContentLoaded)
        - localStorage.setItem('accessToken', nativeToken)
    ↓ tokenStorage가 주입된 토큰 사용
    ↓ initialize() → API로 user fetch
```

**중요:**
- accessToken은 localStorage에만 저장 (쿠키에 저장하지 않음)
- WebView → Native 토큰/유저 동기화는 하지 않음 (Native가 Source of Truth)

---

## 5. 라우트 보호

### 인증 필요 경로 보호 (서버 사이드)

**파일: `apps/client/src/app/(브리더스룸)/layout.tsx`**

```typescript
const PUBLIC_PATHS = [
  /^\/pet\/[^/]+$/, // /pet/[petId] (펫 상세 페이지)
];

export default async function BrLayout({ children }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");
  const pathname = headersList.get("x-pathname") || "";

  // 공개 경로는 인증 체크 스킵
  if (isPublicPath(pathname)) return <>{children}</>;

  // 비공개 경로는 refreshToken 존재 여부로 인증 체크
  if (!refreshToken?.value) redirect("/sign-in");

  return <>{children}</>;
}
```

### 로그인 페이지 (/sign-in)

**파일: `apps/client/src/app/(user)/sign-in/page.tsx`**

- 서버 사이드 보호 없음 — 누구나 접근 가능
- 마운트 시 `tokenStorage.removeToken()`으로 stale accessToken 정리
- sign-in 페이지에 도달하는 주요 경로:
  1. 브리더스룸 layout에서 refreshToken 없음 → `/sign-in` 리다이렉트
  2. axios 인터셉터에서 토큰 갱신 실패 → `/sign-in` 리다이렉트
  3. 사용자가 직접 URL 접근
- 모든 경우에 stale accessToken을 정리하고 로그인 폼 표시

**accessToken이 있지만 refreshToken이 없는 사용자가 /sign-in에 도달하는 경우:**
- accessToken이 유효하더라도 refreshToken이 없으면 세션 갱신 불가 → 사실상 만료된 상태
- stale accessToken을 정리하고 재로그인 유도가 적절

### SSR에서 인증된 API 요청

서버 컴포넌트에서는 클라이언트의 localStorage에 접근할 수 없으므로,
refreshToken 쿠키를 사용하여 accessToken을 획득합니다.

**파일: `apps/client/src/lib/server/auth.ts`**

```typescript
export const getServerRequestHeaders = cache(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) return {};

  // refreshToken으로 accessToken 획득
  const response = await fetch(`${BASE_URL}/api/auth/token`, {
    headers: { Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (response.ok) {
    const data = await response.json();
    return { Authorization: `Bearer ${data.token}` };
  }

  return {};
});
```

**특징:**
- `cache()`로 감싸서 같은 렌더링 사이클 내 중복 요청 방지
- refreshToken 쿠키로 accessToken 획득 후 Authorization 헤더 반환
- 서버 측에서 동일 유저의 동시 refresh 요청을 in-memory deduplication으로 처리하여 SSR/CSR 간 rotation race condition 방지

---

## 6. 토큰/유저 삭제 흐름

### A. 웹 로그아웃

```
[로그아웃 버튼 클릭]
    ↓ useLogout().logout()
    ↓ useUserStore.getState().onLogout()
        ↓ authControllerSignOut() API 호출 (서버에서 refreshToken 쿠키 삭제)
        ↓ tokenStorage.removeToken() (localStorage에서 accessToken 삭제)
        ↓ set({ user: null })
        ↓ (네이티브 앱인 경우) sendToNative({ type: "LOGOUT" })
```

**참고:** sign-out 엔드포인트는 `@Public()`으로 설정되어 access token 만료 상태에서도 로그아웃 가능

**관련 파일:**

- `apps/client/src/hooks/useLogout.ts`
- `apps/client/src/app/(브리더스룸)/store/user.ts`

### B. 회원탈퇴

```
[DeleteAccountButton]
    ↓ authControllerDeleteAccount()
    ↓ onLogout() (토큰 삭제)
    ↓ (네이티브 앱인 경우) requestResetToHome() → Native 메시지
```

**관련 파일:**

- `apps/client/src/app/(브리더스룸)/settings/components/DeleteAccountButton.tsx`

### C. 토큰 갱신 실패 (axios 인터셉터)

**파일: `packages/api-client/src/api/mutator/use-custom-instance.ts`**

refresh를 시도할지 여부와 실패 처리를 다음과 같이 구분한다:

```
[API 401]
    ↓ refresh 시도 조건:
    │    - message === "ACCESS_TOKEN_INVALID" (만료/토큰 없음), 또는
    │    - 요청에 Authorization 헤더가 있었음 (우리 토큰이 거부된 비표준 401 — 손상/서명 불일치 등)
    │  → 둘 다 아니면(헤더 없는 비표준 401, 예: 로그인 실패) 토큰 유지, 요청만 실패
    ↓ authControllerGetToken()으로 갱신 시도
    ├─ 성공: 새 accessToken으로 원래 요청 재시도
    ├─ 확정 실패 (refresh 응답이 401/403 = refresh token 무효):
    │    ↓ tokenProvider.removeToken()
    │    ↓ handleAuthError("refresh-failed")
    │    ↓ WebView: TOKEN_REFRESH_FAILED → Native / Web: /sign-in 리다이렉트
    └─ 일시적 실패 (네트워크/타임아웃/5xx):
         ↓ 로그아웃하지 않음. 토큰·세션 유지 → 다음 요청에서 자동 재시도
         ↓ console.warn 로그만 남김
```

**핵심:** refresh 실패를 **확정(401/403)** 과 **일시적(네트워크/5xx)** 으로 구분(`isDefinitiveAuthFailure`). 일시적 실패를 로그아웃으로 처리하면 refresh token이 유효해도 며칠 안에 강제 로그아웃되므로, 확정 실패에만 세션을 종료한다.

**참고:** 무한 리다이렉트 방지를 위해 `/sign-in/*` 경로에서는 리다이렉트하지 않음

### D. 403 권한 없음 에러 처리

**파일: `packages/api-client/src/api/mutator/use-custom-instance.ts`**

```
[API 403 에러]
    ↓ WebView 환경:
        ↓ TOAST 메시지 → Native (권한 없음 알림)
        ↓ RESET_TO_HOME 메시지 → Native (홈으로 이동)
    ↓ Web 환경:
        ↓ alert("권한이 없습니다. 관리자에게 문의해주세요.")
        ↓ 홈으로 리다이렉트
```

---

## 7. 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Web/WebView)                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   useUserStore                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │              user: UserProfileDto             │   │    │
│  │  │                  (메모리만)                    │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                       ↑                              │    │
│  │                  API fetch                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                       ↑                                      │
│         ┌─────────────┴─────────────┐                       │
│         │      tokenStorage         │                       │
│         │     (localStorage만)      │                       │
│         └───────────────────────────┘                       │
│                       ↑                                      │
│    ┌──────────────────┼──────────────────┐                  │
│    │                  │                  │                  │
│    ▼                  ▼                  ▼                  │
│  OAuth            Native              SSR                   │
│  로그인           토큰 주입          (refreshToken →        │
│                                      accessToken 획득)      │
└─────────────────────────────────────────────────────────────┘
              │
              │ (Native App인 경우)
              ▼
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT, TOKEN_REFRESH_FAILED 메시지 → Native로 전송        │
│  (sendToNative({ type: "LOGOUT" }))                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 주요 파일 목록

| 파일                                               | 역할                                    |
| -------------------------------------------------- | --------------------------------------- |
| `apps/client/src/app/(브리더스룸)/store/user.ts`   | Zustand 유저 상태 저장소                |
| `apps/client/src/hooks/useAuth.ts`                 | 인증 상태 확인 훅 (useAuth, useIsLoggedIn, useUser) |
| `apps/client/src/hooks/useLogout.ts`               | 로그아웃 처리 훅                        |
| `apps/client/src/lib/tokenStorage.ts`              | 토큰 저장/조회/삭제 (localStorage)      |
| `apps/client/src/lib/server/auth.ts`               | SSR용 인증 헤더 생성 (refreshToken → accessToken) |
| `apps/client/src/providers/AuthProvider.tsx`       | 앱 시작 시 인증 초기화                  |
| `apps/client/src/lib/native-bridge.ts`             | Native ↔ WebView 통신                   |
| `apps/client/src/app/(user)/sign-in/page.tsx`      | 로그인 페이지 (stale 토큰 정리 + 로그인 폼) |
| `apps/client/src/app/(auth-callback)/sign-in/auth/page.tsx` | OAuth 콜백 처리           |
| `apps/client/src/app/(브리더스룸)/layout.tsx`      | 인증 필요 경로 보호 (refreshToken 체크) |

---

## 9. Mobile vs Client 비교

| 항목           | Mobile                      | Client                      |
| -------------- | --------------------------- | --------------------------- |
| accessToken 저장 | AsyncStorage              | localStorage                |
| refreshToken 저장 | HttpOnly 쿠키            | HttpOnly 쿠키               |
| 유저 저장      | 메모리만 (API fetch)        | 메모리만 (API fetch)        |
| 로그인 확인    | `!!accessToken`             | `!!accessToken`             |
| Store          | `useAuthStore`              | `useUserStore`              |
| 인증 훅        | `useAuth`, `useIsLoggedIn`  | `useAuth`, `useIsLoggedIn`  |
| SSR 인증       | 해당 없음                   | refreshToken으로 accessToken 획득 |

---

## 10. 보안 고려사항

### 토큰 저장 보안

| 저장소 | 토큰 종류 | XSS 위험 | CSRF 위험 |
|--------|----------|----------|----------|
| localStorage | accessToken | 있음 (단기 토큰) | 해당 없음 |
| HttpOnly 쿠키 | refreshToken | 없음 | SameSite로 방어 |

### 적용된 보안 조치

1. **accessToken 쿠키 미사용**: localStorage만 사용하여 쿠키 노출 최소화
2. **refreshToken HttpOnly**: XSS 공격으로 탈취 불가
3. **자동 토큰 갱신 + 일시 실패 내성**: 401 시 refreshToken으로 자동 갱신. refresh가 **확정 실패(401/403)** 일 때만 로그아웃하고, **일시적 실패(네트워크/5xx)** 는 세션을 유지해 다음 요청에서 재시도 (며칠 뒤 강제 로그아웃 방지)
4. **무한루프 방지**: `/sign-in/*` 경로에서는 로그인 리다이렉트 제외 + `initialize()`의 startup refresh도 건너뜀
5. **SSR 인증 분리**: 서버 컴포넌트는 refreshToken으로 별도 인증
6. **Auth code 패턴**: OAuth redirect URL에 refresh token 대신 30초 유효 auth code 사용하여 URL 노출 방지
7. **사용자 상태 검증**: token refresh 시 ACTIVE 상태가 아닌 사용자 차단
8. **토큰 만료 정합성**: JWT 만료(180일)와 DB `refreshTokenExpiresAt`(180일) 동일하게 유지

### 토큰 갱신 큐

동시에 여러 API 요청이 401을 받을 경우:
- 첫 번째 요청만 토큰 갱신 수행
- 나머지 요청은 큐에서 대기
- 갱신 완료 후 큐의 모든 요청 재시도

### 서버 측 토큰 갱신 보호

- **Rotation race condition 방지**: 동일 유저의 동시 refresh 요청을 in-memory deduplication으로 하나만 실행
- **Sign-out 접근성**: `@Public()` 데코레이터로 access token 만료 상태에서도 로그아웃 가능

---

## 11. 비상 조치: 사용자 세션 강제 무효화

### 관리자가 특정 사용자를 강제 로그아웃

DB에서 해당 사용자의 refreshToken을 무효화하면, 다음 accessToken 만료 시 자동으로 로그아웃됩니다.

**서버 메서드: `AuthService.invalidateRefreshToken()`**

```typescript
// apps/server/src/auth/auth.service.ts
async invalidateRefreshToken(refreshToken: string): Promise<void> {
  const tokenPayload = this.jwtService.verify<JwtPayload>(refreshToken, {
    secret: process.env.JWT_REFRESH_SECRET ?? '',
  });
  await this.userService.update(tokenPayload.sub, {
    refreshToken: null,
    refreshTokenExpiresAt: null,
  });
}
```

**또는 DB 직접 조작:**

```sql
UPDATE user SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE user_id = '대상_사용자_ID';
```

**동작 흐름:**

```
[관리자: DB에서 refreshToken 무효화]
    ↓
[사용자: accessToken 만료 전까지 정상 이용]
    ↓ accessToken 만료
    ↓ axios 인터셉터: refreshToken으로 갱신 시도
    ↓ 서버: bcrypt.compare(refreshToken, null) → 실패
    ↓ 401 응답 → 인터셉터가 tokenProvider.removeToken() + /sign-in 리다이렉트
    ↓
[사용자: 강제 로그아웃 완료]
```

### 한계

- **즉시 차단 불가**: accessToken 만료(1시간)까지 기존 요청은 정상 처리됨
- 즉시 차단이 필요하면 accessToken 블랙리스트(Redis 등) 또는 매 요청 DB 체크가 필요

### 사용자 상태 변경을 통한 차단

`user.status`를 `ACTIVE`가 아닌 상태로 변경하면 token refresh 시 차단됩니다.

```sql
UPDATE user SET status = 'SUSPENDED' WHERE user_id = '대상_사용자_ID';
```

이 경우 `performRefresh()`에서 `userEntity.status !== USER_STATUS.ACTIVE` 체크에 의해 401 응답 → 강제 로그아웃.
refreshToken 무효화와 동일한 타이밍(accessToken 만료 후, 최대 1시간 이내)에 적용됩니다.
