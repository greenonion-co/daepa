# 인증 상태 관리 구조

## 1. 저장소 (Zustand Store)

**파일: `apps/mobile/src/store/auth.ts`**

```typescript
type AuthState = {
  accessToken: string | null; // AsyncStorage에 persist
  user: UserProfileDto | null; // 메모리에만 저장 (persist 안함)
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserState | null) => void;
  clear: () => void;
};
```

**저장 정책:**

- `accessToken`: AsyncStorage에 persist (앱 재시작 시 유지)
- `user`: persist 안함 (앱 시작 시 API로 fetch)
- 앱 시작 시 토큰 없으면 WebView 쿠키도 정리

---

## 2. 토큰/유저 설정 흐름

### A. 네이티브 로그인 (Kakao/Google/Apple)

```
[LoginButton]
    ↓ SDK 로그인
    ↓ API 호출 (authControllerKakaoNative 등)
    ↓
[useLogin.navigateByStatus]
    ↓ setAccessToken(token)  ← 토큰만 저장
    ↓ 화면 이동 (PENDING → 회원가입, ACTIVE → 홈)
    ↓
[App.tsx useEffect]
    ↓ accessToken 변경 감지
    ↓ userControllerGetUserProfile() 호출
    ↓ setUser(userData)  ← API에서 최신 데이터 fetch
```

**관련 파일:**

- `apps/mobile/src/screens/Settings/KakaoLoginButton.tsx`
- `apps/mobile/src/screens/Settings/GoogleLoginButton.tsx`
- `apps/mobile/src/screens/Settings/AppleLoginButton.tsx`
- `apps/mobile/src/hooks/useLogin.ts`

### B. Native → WebView 토큰 주입 (단방향)

```
[WebView 로드]
    ↓ injectedJavaScriptBeforeContentLoaded 실행
    ↓ Native accessToken을 WebView에 주입:
        - localStorage.setItem('accessToken', token)
        - document.cookie = 'accessToken=' + token
    ↓ WebView의 API 클라이언트가 이 토큰 사용
```

**중요:** WebView → Native 토큰/유저 동기화는 하지 않음 (Native가 Source of Truth)

**관련 파일:**

- `apps/mobile/src/screens/WebView/scripts.ts` (토큰 주입)
- `apps/mobile/src/screens/WebView/index.tsx` (WebView 렌더링)

### C. 앱 시작/토큰 변경 시 자동 유저 정보 갱신

**파일: `apps/mobile/App.tsx` (Line 83-100)**

```typescript
useEffect(() => {
  const fetchUserProfile = async () => {
    if (accessToken && hydrated) {
      const { data } = await userControllerGetUserProfile();
      setUser(data.data);
    } else if (!accessToken) {
      setUser(null);
    }
  };
  fetchUserProfile();
}, [accessToken, hydrated, setUser]);
```

- `accessToken` 있음 → `userControllerGetUserProfile()` 호출 → `setUser()`
- `accessToken` 없음 → `setUser(null)`

---

## 3. 토큰/유저 삭제 흐름

### A. 네이티브 로그아웃

```
[WebView LOGOUT 메시지]
    ↓ useAuthStore.clear()
        ↓ accessToken = null
        ↓ user = null
        ↓ CookieManager.clearAll()
    ↓ navigation.reset → Login 화면
```

### B. 회원탈퇴

```
[DeleteAccountButton (WebView)]
    ↓ authControllerDeleteAccount()
    ↓ onLogout() (쿠키 삭제)
    ↓ requestResetToHome() → Native 메시지

[Native RESET_TO_HOME 핸들러]
    ↓ useAuthStore.clear()
    ↓ navigation.reset → Login 화면
```

**관련 파일:**

- `apps/client/src/app/(브리더스룸)/settings/components/DeleteAccountButton.tsx`
- `apps/mobile/src/screens/WebView/index.tsx`

### C. 토큰 갱신 실패

```
[API 401 에러]
    ↓ TOKEN_REFRESH_FAILED 메시지
    ↓ useAuthStore.clear()
    ↓ navigation.reset → Login 화면
```

---

## 4. 로그인 상태 확인 방법

### 인증 확인 훅 (권장)

**파일: `apps/mobile/src/hooks/useAuth.ts`**

```typescript
// 로그인 여부 + 유저 + 토큰 모두 필요할 때
const { isLoggedIn, user, accessToken } = useAuth();

// 로그인 여부만 필요할 때 (가장 가벼움)
const isLoggedIn = useIsLoggedIn();

// 유저 정보만 필요할 때
const user = useUser();
```

### 사용 위치별 패턴

| 위치                | 훅/방식                         | 파일                                          |
| ------------------- | ------------------------------- | --------------------------------------------- |
| Tabs (user role)    | `useUser()`                     | `apps/mobile/src/navigation/Tabs.tsx`         |
| AddPetButton        | `useIsLoggedIn()`               | `apps/mobile/src/components/common/AddPetButton.tsx` |
| SettingsScreen      | `useIsLoggedIn()`               | `apps/mobile/src/screens/Settings/index.tsx`  |
| usePushNotification | `useAuth()` → `{ accessToken }` | `apps/mobile/src/hooks/usePushNotification.ts` |
| 이벤트 핸들러       | `useAuthStore.getState().clear()` | 액션 실행 시 (구독 불필요)                    |
| WebView             | 쿠키 기반                       | -                                             |

### Zustand 접근 패턴

```typescript
// 1. 값 읽기 + 구독 (UI 반영)
const accessToken = useAuthStore(state => state.accessToken);

// 2. 쓰기/액션 실행 (구독 불필요)
useAuthStore.getState().setAccessToken(token);
useAuthStore.getState().clear();

// 3. 권장: 추상화된 훅 사용
const isLoggedIn = useIsLoggedIn();  // !!accessToken 추상화
const user = useUser();              // state.user 추상화
```

**주의**: `accessToken`과 `user`는 자동 동기화됨 (App.tsx useEffect)

- 토큰 설정 시 → API로 user 자동 fetch
- 토큰 삭제 시 → user도 null로 자동 설정
- 앱 재시작 시 → 저장된 토큰으로 user 자동 fetch

---

## 5. 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│              Native (Source of Truth)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   useAuthStore                       │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ accessToken  │  │    user      │                 │    │
│  │  │  (persist)   │  │ (메모리만)    │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  │         ↑                 ↑                          │    │
│  │    AsyncStorage      API fetch                       │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↑                                                    │
│         │                                                    │
│  ┌──────┴──────┐                                            │
│  │ 네이티브 로그인 │  (Kakao/Google/Apple SDK)                │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
         │
         │ (단방향: Native → WebView)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                         WebView                              │
│                                                              │
│  injectedJavaScriptBeforeContentLoaded:                      │
│    localStorage.setItem('accessToken', nativeToken)          │
│    document.cookie = 'accessToken=' + nativeToken            │
│                                                              │
│  WebView는 별도 토큰 저장 없음, Native 토큰만 사용            │
└─────────────────────────────────────────────────────────────┘
         │
         │ (액션 메시지만: WebView → Native)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT, TOKEN_REFRESH_FAILED, RESET_TO_HOME                 │
│  → useAuthStore.clear() → 로그인 화면 이동                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. WebView ↔ Native 메시지 타입

### Native → WebView (injectedJavaScript)

- `window.nativeAccessToken` - 토큰 주입
- `window.isNativeApp` - 네이티브 앱 여부

### WebView → Native (postMessage)

| 타입                   | 설명                  | 핸들러 동작                 |
| ---------------------- | --------------------- | --------------------------- |
| `LOGOUT`               | 로그아웃 요청         | `clear()` + Login 화면 이동 |
| `RESET_TO_HOME`        | 홈으로 리셋 (탈퇴 등) | `clear()` + Login 화면 이동 |
| `TOKEN_REFRESH_FAILED` | 토큰 갱신 실패        | `clear()` + Login 화면 이동 |
| `NAVIGATE`             | 화면 이동             | navigation.navigate()       |
| `GO_BACK`              | 뒤로가기              | navigation.goBack()         |

---

## 7. 주요 파일 목록

| 파일                                        | 역할                                    |
| ------------------------------------------- | --------------------------------------- |
| `apps/mobile/App.tsx`                       | 앱 진입점, 토큰 변경 시 자동 유저 fetch |
| `apps/mobile/src/store/auth.ts`             | Zustand 인증 상태 저장소                |
| `apps/mobile/src/hooks/useAuth.ts`          | 인증 상태 확인 훅 (useAuth, useIsLoggedIn, useUser) |
| `apps/mobile/src/hooks/useLogin.ts`         | 로그인 후 화면 이동 처리                |
| `apps/mobile/src/screens/WebView/index.tsx` | WebView 메시지 핸들링                   |
| `apps/mobile/src/navigation/index.tsx`      | 네비게이션 (로그인 상태 기반)           |
| `apps/mobile/src/navigation/Tabs.tsx`       | 탭 네비게이션 (Settings 분기)           |
| `apps/client/src/lib/native-bridge.ts`      | WebView→Native 메시지 전송 함수         |
