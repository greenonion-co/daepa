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

| 토큰 | 저장 위치 | 접근 가능 |
|------|----------|----------|
| accessToken | localStorage | 클라이언트 JS만 |
| refreshToken | HttpOnly 쿠키 | 서버만 (XSS 방어) |

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
    ↓ 서버에서 refreshToken 쿠키 설정
    ↓
[/sign-in/auth 페이지]
    ↓ authControllerGetToken() 호출 (refreshToken 쿠키 자동 전송)
    ↓ accessToken 응답 수신
    ↓
[onLoginSuccess(token)]
    ↓ tokenStorage.setToken(token) → localStorage에 저장
    ↓ initialize() 호출
    ↓ userControllerGetUserProfile() 호출
    ↓ set({ user: userData })
    ↓ 홈으로 리다이렉트
```

**관련 파일:**

- `apps/client/src/app/(auth-callback)/sign-in/auth/page.tsx`
- `apps/client/src/app/(브리더스룸)/store/user.ts`

**참고:** `/sign-in/auth` 페이지는 `(auth-callback)` 라우트 그룹에 위치하여
`(user)` 레이아웃의 리다이렉트 로직 영향을 받지 않음

### B. 앱 시작 시 자동 유저 정보 갱신

**파일: `apps/client/src/providers/AuthProvider.tsx`**

```typescript
useEffect(() => {
  initialize();
}, [initialize]);
```

- 토큰 있음 → `userControllerGetUserProfile()` 호출 → `set({ user })`
- 토큰 없음 → `set({ user: null })`

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

## 5. 서버 컴포넌트 인증

### SSR에서 인증된 API 요청

서버 컴포넌트에서는 클라이언트의 localStorage에 접근할 수 없으므로,
refreshToken 쿠키를 사용하여 accessToken을 획득합니다.

**파일: `apps/client/src/lib/server/auth.ts`**

```typescript
export const getServerRequestHeaders = cache(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return {};
  }

  // refreshToken으로 accessToken 획득
  const response = await fetch(`${BASE_URL}/api/v1/auth/token`, {
    headers: { Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (response.ok) {
    const data = await response.json();
    return { Authorization: `Bearer ${data.data.token}` };
  }

  return {};
});
```

**특징:**
- `cache()`로 감싸서 같은 렌더링 사이클 내 중복 요청 방지
- refreshToken 쿠키로 accessToken 획득 후 Authorization 헤더 반환

### 게스트 전용 페이지 보호

**파일: `apps/client/src/app/(user)/layout.tsx`**

```typescript
export default async function UserLayout({ children }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // refreshToken 존재 = 로그인 상태로 간주
  if (refreshToken?.value) {
    redirect("/");
  }

  return <>{children}</>;
}
```

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

```
[API 401 에러 + ACCESS_TOKEN_INVALID]
    ↓ refreshToken 쿠키로 토큰 갱신 시도
    ↓ 성공: 새 accessToken으로 원래 요청 재시도
    ↓ 실패:
        ↓ tokenProvider.removeToken()
        ↓ WebView: TOKEN_REFRESH_FAILED 메시지 → Native
        ↓ Web: /sign-in으로 리다이렉트 (/sign-in/* 경로는 제외)
```

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
| `apps/client/src/app/(user)/layout.tsx`            | 게스트 전용 페이지 보호                 |
| `apps/client/src/app/(auth-callback)/sign-in/auth/page.tsx` | OAuth 콜백 처리           |

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
3. **자동 토큰 갱신**: 401 에러 시 자동으로 refreshToken으로 갱신
4. **무한루프 방지**: `/sign-in/*` 경로에서는 로그인 리다이렉트 제외
5. **SSR 인증 분리**: 서버 컴포넌트는 refreshToken으로 별도 인증

### 토큰 갱신 큐

동시에 여러 API 요청이 401을 받을 경우:
- 첫 번째 요청만 토큰 갱신 수행
- 나머지 요청은 큐에서 대기
- 갱신 완료 후 큐의 모든 요청 재시도
