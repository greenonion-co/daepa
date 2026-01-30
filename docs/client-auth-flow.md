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
  - 영구 저장: 쿠키/localStorage (`tokenStorage`)
  - 반응형 상태: Zustand store (`useUserStore`)
- `user`: Zustand 메모리에만 저장 (새로고침 시 API로 fetch)

---

## 2. 로그인 상태 확인 방법

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

## 3. 토큰/유저 설정 흐름

### A. 웹 로그인 (OAuth)

```
[로그인 페이지]
    ↓ OAuth 리다이렉트 (Kakao/Google/Apple)
    ↓ 콜백 처리
    ↓
[onLoginSuccess(token)]
    ↓ tokenStorage.setToken(token)
    ↓ initialize() 호출
    ↓ userControllerGetUserProfile() 호출
    ↓ set({ user: userData })
```

**관련 파일:**

- `apps/client/src/app/(user)/sign-in/auth/page.tsx`
- `apps/client/src/app/(브리더스룸)/store/user.ts`

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
        - document.cookie = 'accessToken=' + nativeToken
    ↓ tokenStorage가 주입된 토큰 사용
    ↓ initialize() → API로 user fetch
```

**중요:** WebView → Native 토큰/유저 동기화는 하지 않음 (Native가 Source of Truth)

---

## 4. 토큰/유저 삭제 흐름

### A. 웹 로그아웃

```
[로그아웃 버튼 클릭]
    ↓ useLogout().logout()
    ↓ useUserStore.getState().onLogout()
        ↓ authControllerSignOut() API 호출
        ↓ tokenStorage.removeToken()
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
    ↓ onLogout() (쿠키 삭제)
    ↓ (네이티브 앱인 경우) requestResetToHome() → Native 메시지
```

**관련 파일:**

- `apps/client/src/app/(브리더스룸)/settings/components/DeleteAccountButton.tsx`

---

## 5. 데이터 흐름 다이어그램

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
│         │  (cookie/localStorage)    │                       │
│         └───────────────────────────┘                       │
│                       ↑                                      │
│         ┌─────────────┴─────────────┐                       │
│         │   OAuth 로그인 / Native    │                       │
│         │     토큰 주입              │                       │
│         └───────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
              │
              │ (Native App인 경우)
              ▼
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT 메시지 → Native로 전송                               │
│  (sendToNative({ type: "LOGOUT" }))                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 주요 파일 목록

| 파일                                               | 역할                                    |
| -------------------------------------------------- | --------------------------------------- |
| `apps/client/src/app/(브리더스룸)/store/user.ts`   | Zustand 유저 상태 저장소                |
| `apps/client/src/hooks/useAuth.ts`                 | 인증 상태 확인 훅 (useAuth, useIsLoggedIn, useUser) |
| `apps/client/src/hooks/useLogout.ts`               | 로그아웃 처리 훅                        |
| `apps/client/src/lib/tokenStorage.ts`              | 토큰 저장/조회/삭제                     |
| `apps/client/src/providers/AuthProvider.tsx`       | 앱 시작 시 인증 초기화                  |
| `apps/client/src/lib/native-bridge.ts`             | Native ↔ WebView 통신                   |

---

## 7. Mobile vs Client 비교

| 항목           | Mobile                      | Client                      |
| -------------- | --------------------------- | --------------------------- |
| 토큰 저장      | AsyncStorage (persist)      | Cookie/localStorage + Store |
| 유저 저장      | 메모리만 (API fetch)        | 메모리만 (API fetch)        |
| 로그인 확인    | `!!accessToken`             | `!!accessToken`             |
| Store          | `useAuthStore`              | `useUserStore`              |
| 인증 훅        | `useAuth`, `useIsLoggedIn`  | `useAuth`, `useIsLoggedIn`  |
