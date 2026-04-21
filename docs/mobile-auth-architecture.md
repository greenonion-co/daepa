# 모바일 인증 아키텍처 (Native + WebView)

> 최종 수정: 2026-04-21
> 대상: `apps/mobile` (React Native) + `apps/client` (Next.js, WebView 내부 렌더)

## 1. 설계 원칙

| 원칙 | 의미 |
|---|---|
| **Access token은 양쪽에서 자체 관리** | Native(zustand + AsyncStorage), Web(localStorage). 각 컨텍스트가 자기 axios 호출을 독립적으로 수행할 수 있음. |
| **Refresh token은 HttpOnly 쿠키 단일 store** | Native 쿠키 스토어(iOS NSHTTPCookieStorage / Android WebKit CookieDB)에 저장. WebView와 공유. 서버도 쿠키로만 수신. JS 노출 금지. |
| **양방향 실시간 동기화** | 어느 쪽이 refresh해도 반대편 store에 **즉시** 전파. 한쪽에만 있는 최신 토큰이 다른 쪽의 오래된 토큰에 의해 덮어써지지 않도록 iat 기반 ordering. |
| **Native는 "언제나 최신 토큰을 안다"** | 웹 refresh도 native zustand에 반영. 탭 이동 시 재주입되는 값이 항상 최신이라 stale overwrite 사이클 차단. |
| **단일 진실 공급원은 "iat가 가장 큰 토큰"** | 저장 위치가 여러 개여도 논리적 순서는 JWT `iat` 단 하나로 결정. |

## 2. 주요 컴포넌트

### 2-1. 저장소

| 저장소 | 위치 | 저장 내용 | 수명 |
|---|---|---|---|
| **Native 토큰** | `useAuthStore` (zustand) + AsyncStorage | access token | 앱 재시작 후에도 유지 |
| **Web 토큰** | `localStorage.accessToken` | access token | WebView 인스턴스 lifetime (iOS는 sharedProcessPool 기준 공유) |
| **Refresh 쿠키** | Native cookie store | `refreshToken` (HttpOnly) | 180일 or 서버 정책 |

### 2-2. 네트워크 계층

| 계층 | 위치 |
|---|---|
| Native axios 인스턴스 | `packages/api-client` (`AXIOS_INSTANCE`) — native와 web이 같은 코드 사용, **다른 token provider를 주입받음** |
| Native token provider | `apps/mobile/src/utils/apiSetup.ts` — `useAuthStore` 바인딩 |
| Web token provider | `apps/client/src/lib/setupApiClient.ts` — `tokenStorage` (localStorage) 바인딩 |
| Request interceptor (공통) | Authorization: Bearer 첨부 |
| Response interceptor (공통) | 401 감지 → `authControllerGetToken()` 호출 → provider.setToken(new) → 원래 요청 재시도 |
| Mobile cookie bridge | `apps/mobile/src/utils/apiSetup.ts` — 요청에 Cookie 헤더 첨부, 응답의 Set-Cookie를 native cookie store에 저장 |

### 2-3. 동기화 bridge

| 방향 | 메커니즘 | 트리거 |
|---|---|---|
| **Native → WebView (최초 로드)** | `injectedJavaScriptBeforeContentLoaded` | 매 페이지 full-load, WebView 새 마운트 |
| **Native → WebView (실시간)** | `webViewRef.injectJavaScript(...)` | `useAuthStore.accessToken` 변경 감지 useEffect |
| **WebView → Native** | `postMessage('SET_ACCESS_TOKEN', token)` | web의 `tokenStorage.setToken` 호출마다 (로그인·refresh 직후) |

## 3. 데이터 흐름

### 3-1. 로그인 (Native OAuth)

```
[사용자 카카오 로그인 탭]
  ↓
KakaoLoginButton → @react-native-seoul/kakao-login 네이티브 SDK
  ↓ email, id, refreshToken (카카오)
authControllerKakaoNative(...) POST /api/v1/auth/kakao-native
  ↓ 서버: JWT 발급 + bcrypt hash DB 저장
  ↓ 응답 body: { accessToken, status }
  ↓ 응답 Set-Cookie: refreshToken=<jwt>; HttpOnly
  ↓
[axios response interceptor — cookie bridge]
  → CookieManager.setFromResponse(url, "Set-Cookie: refreshToken=...")
  → Native cookie store에 저장
  ↓
useAuthStore.getState().setAccessToken(accessToken)
  → zustand state 업데이트
  → AsyncStorage 자동 persist
  ↓
navigateByStatus({ status, token }) → 로그인 후 라우팅
```

### 3-2. 로그인 (WebView 내부 OAuth 콜백)

```
[WebView가 /sign-in OAuth 플로우 진입 — 구글 웹 로그인 등]
  ↓ 외부 OAuth 리디렉션 → 콜백 URL 복귀
  ↓ /sign-in/auth?status=ACTIVE&code=xxxx
  ↓
[AuthPage useQuery — code 존재 시만 실행]
  → AXIOS_INSTANCE.get('/api/auth/token?code=xxx')
  → 서버: code 검증 후 JWT 발급 + Set-Cookie: refreshToken
  ↓ 브라우저(WebView)가 자동으로 쿠키 저장 (WKWebView sharedCookies → native store와 공유)
  ↓
onLoginSuccess(token)
  → tokenStorage.setToken(token)
    → localStorage.setItem('accessToken', token)
    → postMessage('SET_ACCESS_TOKEN', token)  ← 여기서 native 동기화
  ↓
[Native WebView screen handleMessage('SET_ACCESS_TOKEN')]
  → iat 비교 통과 시 useAuthStore.setAccessToken(token)
  → AsyncStorage persist
```

### 3-3. 일반 API 요청 (정상 경로)

```
Native: AXIOS_INSTANCE.get(...)
  ↓ request interceptor:
    - tokenProvider.getToken() → 현재 accessToken 반환
    - Authorization: Bearer <accessToken>
    - cookie bridge: Cookie: refreshToken=<jwt>; (refresh 엔드포인트에만 사용됨)
  ↓
서버: Public 엔드포인트 아니면 JwtStrategy가 Authorization 헤더 검증
  ↓ 유효 → 200
Web: 동일 플로우. localStorage에서 토큰 읽어 Bearer 첨부. 쿠키는 브라우저 자동.
```

### 3-3-1. SSR 원칙 — 서버 컴포넌트는 auth-free 유지

**원칙**: Next.js 서버 컴포넌트는 매 요청마다 `/auth/token`을 호출해 새 access token을
획득할 수밖에 없다 (브라우저 localStorage 접근 불가, refresh token cookie만 가용).
이 호출은 **페이지당 1회씩 누적되는 비용**이므로 가능한 한 server-side fetch를 피해야 함.

**가이드라인**:
1. **페이지 본문에서 authenticated fetch 금지** — 데이터 로드는 Client Component가
   React Query + localStorage Bearer로 수행. Client는 interceptor가 refresh까지 처리.
2. **`generateMetadata`는 공개 API만으로 작성** — 비공개 리소스는 minimal metadata로 대체
   (어차피 `robots: noindex`라 SEO 손해 없음).
3. **`getServerRequestHeaders` 호출 지양** — 다른 대안이 모두 실패했을 때의 최후 수단.
   현재 사용처 0건. 신규 도입 시 리뷰어 승인 필요.

**예시 — `pet/[petId]/page.tsx`**:
- Metadata: `fetchPet` (auth-free)로 공개 펫 OG 생성. 비공개 펫은 `title: "비공개 개체"`.
- Page body: 바로 `<PetDetailClient />` 반환. 404/비공개 접근 오류 UI도 Client에서.

**효과**: `/auth/token` 호출이 SSR에서 완전히 제거됨. 서버 CPU·로그·refresh token race
리스크 모두 감소.

### 3-4. Access token 만료 → 자동 refresh (Native 측)

```
Native API 호출 → Bearer <expired_A> → 서버 401 { message: "ACCESS_TOKEN_INVALID" }
  ↓
[response interceptor 401 블록]
  → isRefreshing === false 이므로 진입
  → originalRequest._retry = true
  → authControllerGetToken() 호출 (GET /api/v1/auth/token)
    ↓ request interceptor: cookie 첨부
    ↓ 서버: req.cookies.refreshToken 검증 → 새 access_B 발급 (+ rotation 시 새 refreshToken)
    ↓ 응답 Set-Cookie: refreshToken=<new> (rotation 시)
  ↓ response interceptor (cookie bridge): Set-Cookie 있으면 native store 업데이트
  ↓ tokenProvider.setToken(access_B) → useAuthStore.setAccessToken(access_B)
  ↓ 열린 WebView useEffect 트리거 → injectJavaScript(access_B)로 localStorage 동기화
  ↓ processQueue(null, access_B) — 대기 중 queue 요청 resume
  ↓ 원래 요청 재시도 with Bearer <access_B> → 200
```

### 3-5. Access token 만료 → 자동 refresh (WebView 내부 Web 측)

```
Web axios API 호출 → Bearer <expired_A> → 401
  ↓ 동일 interceptor가 동일 refresh 로직 실행 (packages/api-client 공유)
  → authControllerGetToken() (브라우저 네트워크 스택 사용, 쿠키 자동 첨부)
  → 서버가 새 access_B 발급
  → tokenProvider.setToken(access_B)
    → tokenStorage.setToken(access_B)
      → localStorage.setItem('accessToken', access_B)
      → postMessage('SET_ACCESS_TOKEN', access_B) → native handleMessage
        → isTokenNewerOrEqual 가드 통과 → useAuthStore.setAccessToken(access_B)
  → 원래 요청 재시도 → 200
```

### 3-6. 동기화 Race 시나리오와 방어

**시나리오**: Native가 막 refresh한 access_A를 막 AsyncStorage에 쓰는 순간, Web이 자체 refresh로 받은 access_B를 postMessage로 보냄. 서로 다른 토큰이 거의 동시에 도착.

**방어 메커니즘**:
1. 서버의 `refreshPromises` 맵 — 같은 user의 concurrent refresh는 단일 promise로 dedupe → 양쪽이 **같은** access token을 받음 (race 아님)
2. iat 비교 — 어떤 이유로든 다른 토큰이 도착했다면, 각 저장 경로에서 `getJwtIat()`로 더 오래된 값은 무시
   - `SET_ACCESS_TOKEN` handler → `isTokenNewerOrEqual(incoming, current)` 검사
   - `injectedJavaScriptBeforeContentLoaded` → localStorage 기존값과 iat 비교
   - `injectJavaScript` 실시간 → 동일한 iat 비교

## 4. 로그아웃

### 4-1. 명시적 로그아웃 (Profile.tsx)

```
handleSignOut:
  await signOut()           // POST /auth/sign-out (실패해도 catch로 흡수)
    ↓ 서버: req.cookies.refreshToken 검증 → DB의 hash null 처리 → clearCookie 응답
    ↓ cookie bridge가 clearCookie 반영 (만료 쿠키 저장 = 삭제)
  useAuthStore.getState().clear()
    ↓ accessToken = null, user = null
    ↓ CookieManager.clearAll() — 잔여 쿠키 완전 제거
  queryClient.removeQueries(...)
  Toast.show('로그아웃되었습니다')
```

정책: **서버 invalidate 실패해도 로컬 상태는 반드시 정리**. 오프라인/네트워크 장애에서도 "로그아웃됨" 상태 보장.

### 4-2. Refresh 실패에 따른 강제 로그아웃

```
interceptor catch(refreshError):
  processQueue(refreshError, null)
  tokenProvider.removeToken()
    → Native: useAuthStore.setAccessToken(null)
    → Web: tokenStorage.removeToken() → postMessage('SET_ACCESS_TOKEN', '')
  handleAuthError('refresh-failed')
    → Native: useAuthStore.clear() + resetToLogin() → Tabs + Login 스택
    → WebView: postMessage('TOKEN_REFRESH_FAILED') → native handleMessage에서 clear + navigation.reset
```

## 5. 주요 파일 맵

### Native (apps/mobile)

| 파일 | 역할 |
|---|---|
| `src/store/auth.ts` | zustand store — accessToken / user. AsyncStorage persist. logout 시 CookieManager.clearAll. |
| `src/utils/apiSetup.ts` | axios baseURL, token provider, cookie bridge, onAuthError 연결 |
| `src/utils/jwt.ts` | JWT iat 파서, `isTokenNewerOrEqual` |
| `src/navigation/navigationRef.ts` | 모듈 레벨 ref + `resetToLogin()` + pending action queue |
| `src/screens/WebView/index.tsx` | WebView 컴포넌트 — 주입 JS 관리, handleMessage (SET_ACCESS_TOKEN, TOKEN_REFRESH_FAILED, LOGOUT, ...), native ↔ web 실시간 sync |
| `src/screens/WebView/scripts.ts` | `createInjectedJavaScriptBeforeContentLoaded` — 페이지 로드 전 토큰 주입 (iat 비교) |
| `src/screens/Settings/Profile.tsx` | 로그아웃 UI (best-effort signOut) |

### Web (apps/client)

| 파일 | 역할 |
|---|---|
| `src/lib/setupApiClient.ts` | axios baseURL, token provider, onAuthError (WebView면 postMessage, 일반 웹이면 /sign-in 리다이렉트) |
| `src/lib/tokenStorage.ts` | localStorage wrapper. setToken/removeToken 시 `ReactNativeWebView.postMessage` 자동 호출 |
| `src/app/(auth-callback)/sign-in/auth/page.tsx` | OAuth 콜백 — code → token 교환 처리 |

### Shared

| 파일 | 역할 |
|---|---|
| `packages/api-client/src/api/mutator/use-custom-instance.ts` | 공용 axios 설정, 401 interceptor, refresh 로직, `handleAuthError` 중앙 처리 |
| `packages/api-client/index.ts` | TokenProvider, AuthErrorReason 등 타입 export |

### Server (참고)

| 파일 | 역할 |
|---|---|
| `apps/server/src/auth/auth.controller.ts` | `GET /auth/token` (OAuth code 교환 + refresh), `POST /auth/sign-out` |
| `apps/server/src/auth/auth.service.ts` | `refresh()` 메소드. `refreshPromises` 맵으로 동시 refresh dedupe |
| `apps/server/src/auth/auth.decorator.ts` | `ACCESS_TOKEN_INVALID` 401 응답 위치 |
| `apps/server/src/app.module.ts` | JwtModule `signOptions.expiresIn` (access token TTL) |

## 6. 인증 관련 WebView 메시지 타입

| 타입 | 방향 | 목적 |
|---|---|---|
| `SET_ACCESS_TOKEN` | Web → Native | web refresh 후 native AsyncStorage 동기화 |
| `TOKEN_REFRESH_FAILED` | Web → Native | web refresh 실패 → native가 clear + Login 스택으로 이동 |
| `LOGOUT` | Web → Native | 명시적 로그아웃 — native clear + 탭 스택 reset |

## 7. Race condition / 장애 시나리오 대응 표

| 시나리오 | 대응 |
|---|---|
| 동시 N개 API가 401 | interceptor `isRefreshing` + `failedQueue`로 1회 refresh + 나머지 queue resume |
| Native와 Web이 동시에 refresh | 서버 `refreshPromises` 맵으로 같은 userId는 단일 promise 공유, 같은 토큰 발급 |
| Native AsyncStorage stale → WebView 마운트 시 stale 주입 | Web → Native sync (SET_ACCESS_TOKEN) + Native → WebView 실시간 주입 + iat 비교 |
| Web이 refresh 후 Native에 sync 전에 다른 탭 마운트 | 새 탭의 injected JS가 기존 localStorage 값과 iat 비교 → web이 더 최신이면 skip |
| Refresh 자체 실패 (refresh token도 만료) | `handleAuthError('refresh-failed')` → removeToken + Login 화면으로 reset |
| 로그아웃 서버 호출 실패 | `.catch()`로 흡수, 로컬 `clear()` 항상 실행 |
| Cold start 시 NavigationContainer 미 ready 상태에서 onAuthError | `navigationRef`에 pending action 큐잉 → onReady 시 flush |

## 8. 토큰 TTL 정책

| 토큰 | 현재 값 | 정의 위치 |
|---|---|---|
| Access token | **1시간** | `apps/server/src/app.module.ts` `JwtModule.register.signOptions.expiresIn` |
| Refresh token | **180일** | `apps/server/src/auth/auth.service.ts` `createJwtRefreshToken` |
| OAuth auth code (redirect용) | 30초 | `apps/server/src/auth/auth.service.ts` `createAuthCode` |
| Refresh token rotation 조건 | 만료까지 7일 이하 남았을 때만 rotate | `auth.service.ts` `performRefresh` |

**테스트**: access token을 `'30s'`로 임시 변경 → 서버 재시작 → 재로그인 → 30s 후 API 호출 시 refresh 자동 발화 확인.

## 9. 확장 시 주의사항

### 새 API 엔드포인트가 Auth 필요하면
- 별도 조치 불필요. `AXIOS_INSTANCE` 사용하면 Bearer 자동 첨부, 401 자동 refresh.
- `@Public()` 데코레이터 붙일 엔드포인트는 서버에서 명시.

### 새 SSR 페이지 작성 시
- **페이지 본문에서 server-side fetch 금지**: Client Component에 petId 등 식별자만 전달하고
  실제 fetch는 React Query로 처리. 중복 요청·`/auth/token` 오버헤드 방지.
- **generateMetadata에 authenticated fetch 금지**: auth-free `fetch`만 사용. 비공개
  리소스는 minimal metadata (`robots: noindex`) 반환.
- 원칙 근거: §3-3-1 참조.

### 새 WebView 메시지가 토큰 관련이면
- `apps/mobile/src/screens/WebView/types.ts` — `WebViewMessage` union에 타입 추가
- `apps/mobile/src/screens/WebView/index.tsx` `handleMessage` switch에 케이스 추가
- 토큰 변경 수반 시 `isTokenNewerOrEqual` 가드 필수

### 새 token provider 구현 시
- `TokenProvider` 인터페이스 준수 (`setToken`, `getToken`, `removeToken`, 선택 `onAuthError`)
- refresh 실패 시 UX 처리는 `onAuthError` 콜백에서만 담당 (`use-custom-instance.ts`에 env별 분기 금지)

### 서버 JWT secret 변경 시
- 모든 기존 access token이 즉시 무효화됨 → 대규모 재로그인 발생. 점진적 롤아웃 전략 필요.

## 10. 향후 개선 (Backlog)

**Phase 3 — Native 단일 Refresh 허브** (우선순위: 낮음, 도입 조건: 고보안 기능 추가 or auth race로 실제 장애 발생)

- Web axios가 401 받으면 자체 refresh하지 않고 `postMessage('REFRESH_REQUEST', { requestId })`
- Native가 단독으로 refresh 수행 후 `webView.injectJavaScript`로 응답 전달
- Web 측은 promise 매핑으로 원래 요청 재시도
- 효과: refresh 경로 1개로 일원화, race 원천 차단, 단일 SSoT 강화
- 비용: request/response bridge 구현 필요, 디버깅 복잡도 증가

## 11. 안전망 (Defense in Depth)

자동 복구가 가능하도록 다층 방어를 적용합니다.

### 11-1. 자동 복구 메커니즘 (코드 레벨)

| 안전망 | 위치 | 작동 조건 | 복구 동작 |
|---|---|---|---|
| Refresh interceptor | `use-custom-instance.ts` | API 401 + ACCESS_TOKEN_INVALID | refresh 자동 시도 |
| Refresh dedupe (서버) | `auth.service.ts` `refreshPromises` | 동일 user 동시 refresh | 단일 promise로 합치기 |
| Refresh dedupe (클라) | `use-custom-instance.ts` `isRefreshing` + `failedQueue` | 동시 다중 401 | 1회만 refresh, 나머지 queue |
| iat 비교 | `WebView/scripts.ts`, `index.tsx` SET_ACCESS_TOKEN | 토큰 sync 시 race | 더 오래된 토큰 무시 |
| `handleAuthError` | `use-custom-instance.ts` | refresh 실패 (모든 원인) | provider 콜백 호출 → Login reset |
| `pendingAction` queue | `navigationRef.ts` | NavigationContainer 미준비 시 reset 요청 | onReady 시 flush |
| `clear()` always 실행 | `Profile.tsx` 로그아웃 | 서버 signOut 실패 | 로컬 상태 강제 정리 |
| Cookie bridge `\|\| true` | `apiSetup.ts` 인터셉터 | cookie read/write 실패 | 요청은 정상 진행 |
| **Memory fallback** | `tokenStorage.ts` | localStorage 사용 불가 | 메모리에 임시 보관, 무한 루프 방지 |
| **Hydration version + migrate** | `store/auth.ts` | persist 스키마 충돌 | 빈 state로 안전 복원 → 재로그인 유도 |
| **Hydration error catch** | `store/auth.ts` `onRehydrateStorage` | AsyncStorage 손상 | accessToken=null로 정리 + cookie clear |

### 11-2. 사용자 시각 복구 매트릭스

각 장애 상황에서 사용자가 정상 상태로 돌아갈 수 있는 경로:

| 장애 상황 | 자동 복구? | 사용자 액션 |
|---|---|---|
| Access token 만료 | ✅ 자동 | 없음 (다음 요청 자동 갱신) |
| Refresh token 만료/무효 | ✅ 자동 | 다시 로그인 화면 표시됨 → 재로그인 |
| 네트워크 일시 단절 | ✅ 자동 | 연결 복구 후 다음 요청에서 재시도 |
| 서버 5xx 일시 장애 | ⚠️ 부분 | 잠시 후 재시도. 장기 지속 시 앱 재실행 |
| DB의 refresh hash 강제 invalidate | ✅ 자동 | refresh 실패 → Login 표시 → 재로그인 |
| 다른 기기에서 로그인으로 본 기기 invalidate | ✅ 자동 | 위와 동일 |
| AsyncStorage 손상 | ✅ 자동 (v1) | `onRehydrateStorage`가 정리 → Login 표시 |
| localStorage 비활성 (WebView) | ✅ 자동 | 메모리 폴백 동작. 새로고침 시 native에서 재주입 |
| zustand store shape 변경 (앱 업데이트) | ✅ 자동 (`migrate`) | 마이그레이션 실패 시 빈 state → 재로그인 |
| OS가 앱 데이터/쿠키 클리어 | ✅ 자동 | refresh 실패 → Login 표시 → 재로그인 |
| Cold start 시 모든 토큰 stale | ✅ 자동 | 자동 refresh, 실패하면 Login |
| **알 수 없는 코드 버그로 stuck** | ❌ | **앱 강제종료 → 재실행** (대부분 회복). 안 되면 **앱 데이터 삭제 + 재설치** (확실히 회복) |

### 11-3. 최후의 수단 — 사용자 안내

만약 모든 자동 복구가 실패하고 앱이 비정상 상태에 빠지면:

1. **앱 강제 종료 후 재실행** — 메모리 상태 초기화. 대부분의 transient 이슈 해결.
2. **앱 데이터 삭제** (Android) / **앱 삭제 후 재설치** (iOS) — 모든 로컬 상태 (AsyncStorage, localStorage, cookie store) 초기화. 절대 안전 escape hatch.
3. **재로그인** — 정상 흐름 진입.

이 3단계는 **어떤 코드 버그가 있든 사용자가 정상 상태로 돌아올 수 있음**을 보장합니다.

## 12. 검증 체크리스트 (배포 전)

신규 인증 관련 변경 후 반드시 통과해야 할 시나리오:

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 신규 사용자 로그인 (Kakao/Google/Apple) | 로그인 성공 + 메인 탭 진입 |
| 2 | 로그인 후 Access TTL(30s) 경과 → 화면 전환 | refresh 자동 발화, UX 끊김 없음 |
| 3 | 로그인 후 30초 이내 탭 이동 5회 | refresh 1회만 (또는 전혀 안 일어남) |
| 4 | WebView 안에서 로그인 → 다른 탭 이동 | 토큰 유지, 추가 refresh 없음 |
| 5 | 비행기 모드에서 로그아웃 | "로그아웃되었습니다" + Login 화면 |
| 6 | Refresh token 만료 시뮬레이션 (`'2m'` 임시) | 2분 후 자동 Login 화면 표시 |
| 7 | 앱 강제 종료 → 재실행 | 토큰 유지, 자동 로그인 상태 |
| 8 | 푸시 알림 cold start | Login 또는 메인 진입, 401 무한 루프 없음 |
| 9 | WebView 내부 OAuth 콜백 (`/sign-in/auth`) | 토큰 native 동기화, 메인 진입 |
| 10 | 명시적 로그아웃 후 재로그인 | 정상 복귀, 잔여 cookie 없음 (`CookieManager.clearAll`) |
| 11 | 동시 다중 API 호출 (페이지 로드 시) | refresh 1회만, 모든 요청 성공 |
| 12 | 서버 maintenance(503) 중 사용 | 적절한 에러 표시, 강제 로그아웃 없음 |

## 부록 — 디버깅 체크리스트

### "자꾸 로그아웃된다"
1. Access token TTL 설정 확인 (`app.module.ts`)
2. Refresh token TTL + DB의 `refreshTokenExpiresAt` 확인
3. Metro + 서버 로그에서 `[auth-debug]` 메시지 추적
4. Cookie bridge 동작 확인: `CookieManager.get(baseURL)`으로 refreshToken entry 존재 여부

### "30초 이내 탭 이동 시 refresh 반복"
- Phase 1+2 sync 동작 확인. 이 문서 §3-5, §7의 race 방어 메커니즘 참조.
- `SET_ACCESS_TOKEN` postMessage가 실제로 native handleMessage에 도달하는지 로그 확인.

### "WebView 내에서 로그인 후 다른 탭으로 이동하면 토큰 사라짐"
- `injectedJavaScriptBeforeContentLoaded`가 native 현재 accessToken을 주입하는지 확인
- native accessToken이 로그인 후 업데이트됐는지 (native login endpoint 사용 시만 직접 업데이트됨)

### "사용자가 어떤 화면에서도 못 빠져나옴"
- 앱 강제 종료 → 재실행 권유
- 그래도 동일하면 앱 데이터 삭제 / 재설치 안내
- §11-2 매트릭스 참조
