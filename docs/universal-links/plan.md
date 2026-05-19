# Universal Link & Deep Link 구현 계획

> 이 문서는 작업을 며칠에 걸쳐 이어받는 에이전트/개발자를 위한 단일 진실 소스입니다.
> 새 세션에서 작업을 재개할 때 **이 파일 하나를 처음부터 끝까지 읽으면 전체 맥락이 파악**됩니다.
> 작업이 진행될 때마다 §6 진행 상태 표와 §7 파일 변경 인덱스, §10 변경 로그를 업데이트하세요.

---

## 1. 목적

`breedy.kr`에서 공유된 URL을 사용자가 클릭했을 때:

1. **앱이 설치된 경우** — 앱이 자동으로 열리고 해당 페이지(펫 상세, 쇼룸, 경매 등)로 진입한다.
2. **앱이 미설치인 경우** — 웹 페이지가 그대로 열리고, 앱 설치를 유도하는 UI(상단 배너 / 공유 진입 시 인터스티셜 모달)가 표시되며, "웹에서 계속 보기" 선택지도 제공한다.

기술 스택:
- iOS Universal Links (AASA 파일)
- Android App Links (Digital Asset Links, autoVerify)
- Custom Scheme(`breedy://`) 보조 폴백

---

## 2. 확정 설정값

| 항목 | 값 |
|------|----|
| App Store ID | `6758280555` |
| iOS Bundle ID | `com.greenonion.daepamily` |
| Apple Team ID | `FSPV9YZ3G8` |
| AASA `appID` | `FSPV9YZ3G8.com.greenonion.daepamily` |
| Android Package | `com.greenonion.daepa` |
| Web 도메인 (prod) | `breedy.kr` |
| API 도메인 (prod) | `api.breedy.kr` |
| Custom Scheme | `breedy://` |
| 업로드 키 SHA-256 | `F3:8A:E3:B1:50:47:D4:9B:C1:A0:42:A3:D8:75:79:AA:62:E4:6E:CC:36:6C:CE:10:00:76:00:4A:BB:0F:3A:D3` |
| 앱 서명 키 SHA-256 | `94:A0:19:85:B3:AD:A4:67:95:94:15:D2:6D:54:A5:E6:FA:44:69:8A:84:67:DE:35:0C:23:DC:1B:81:9E:20:2B` (확정) |

---

## 3. 미해결 / 후속 결정 필요 항목

| # | 항목 | 메모 |
|---|------|-----|
| Q1 | ~~앱 서명 키 SHA-256 재검증~~ | **해결 완료 (2026-05-14)**. `94:A0:19:...` 값으로 확정. §2 표 업데이트됨. |
| Q2 | 경매 라우트 URL 패턴 | 현재 미구현. 패턴 결정 시(`/auction/[id]` 등) 본 문서 §4 경로 목록과 AASA/assetlinks.json/AndroidManifest의 path prefix에 추가. |
| Q3 | 배너 디자인 톤 | 당근스타일(미니멀 상단 배너) / 쿠팡스타일(강한 인터스티셜) 중 결정. 일단 §5 Phase 6은 하이브리드(배너 + 공유 진입 시 모달)로 진행. |

---

## 4. 커버 경로

Universal Link / App Link로 처리할 path:

| Path Prefix | 페이지 | 비고 |
|-------------|--------|-----|
| `/pet/*` | 펫 상세 | `apps/client/src/app/(브리더스룸)/pet/[petId]/page.tsx` |
| `/showroom/*` | 쇼룸 | `apps/client/src/app/showroom/[username]/...` |
| `/notifications/*` | 알림 상세 | 기존에 RN 푸시 클릭 핸들러에서 이미 사용 중인 경로 |
| `/auction/*` | 경매 *(Q2 해결 후 추가)* | 라우트 미구현, 결정 시 본 표와 모든 매니페스트/AASA에 추가 |

---

## 5. 결정 사항 (Phase 1 — 사전 확정 완료)

- **공유 링크 도메인**: `breedy.kr` (단일 도메인. 단축 도메인 미사용)
- **AASA `appIDs` 등록 수**: 1개 (dev/prod 모두 동일 Bundle ID 사용)
- **assetlinks.json 등록 키**: 업로드 키 SHA-256 + 앱 서명 키 SHA-256 (둘 다 포함)
- **공유 시 URL 규칙**: `https://breedy.kr/<path>?ref=share` (인터스티셜 트리거용 식별자)
- **빌드 스킴**: iOS는 `breedy-alpha`(dev) / `breedy`(prod) 모두 Bundle ID 동일 → 단일 AASA로 처리

---

## 6. 진행 상태 (Phase 체크리스트)

상태 태그: `[TODO]` `[IN PROGRESS]` `[BLOCKED]` `[DONE]`

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 도메인/스킴 계약 확정 | `[DONE]` |
| Phase 2 | Web well-known 엔드포인트 (Next.js) | `[DONE]` (로컬 검증 통과) |
| Phase 3 | iOS Associated Domains + Custom Scheme | `[IN PROGRESS]` (코드 편집 완료, Apple Developer Portal + Provisioning Profile + Xcode 빌드 검증 대기) |
| Phase 4 | Android App Links + Custom Scheme intent-filter | `[DONE]` (manifest 구조 검증, gradle 빌드는 pre-existing autolinking 캐시 이슈로 보류) |
| Phase 5 | RN linking (URL 수신 → WebView 전달) | `[DONE]` (Jest 9/9 통과) |
| Phase 6 | 앱 설치 유도 UX (배너 + 인터스티셜) | `[DONE]` (타입 체크 통과) |
| Phase 7 | 공유 UX 구현 (페이지별 공유 버튼 + OG 메타) | `[DONE]` (`?ref=share` 일관 적용, OG는 기존 generateMetadata 활용) |
| Phase 8 | 통합 검증 (12가지 시나리오) | `[TODO]` — **휴먼 체크포인트 3** |

---

### Phase 2: Web well-known 엔드포인트  `[TODO]`

**목표**: `breedy.kr` 도메인에서 AASA 파일과 assetlinks.json을 정확한 Content-Type/캐시 헤더로 제공.

**작업 항목**:
- [ ] `apps/client/src/app/.well-known/apple-app-site-association/route.ts` 작성
  - GET 핸들러, 반환 JSON: `applinks.details[0]` = `{ appIDs: ["FSPV9YZ3G8.com.greenonion.daepamily"], components: [...] }`
  - `components` 항목: §4의 path prefix 각각을 `{ "/" : "/pet/*" }` 형태로 등록
  - Content-Type: `application/json` (Apple은 확장자 없음/JSON 둘 다 허용. 경로 자체에 확장자 없음)
  - `Cache-Control: public, max-age=300` (Apple CDN이 캐시. 너무 길게 잡지 말 것)
- [ ] `apps/client/src/app/.well-known/assetlinks.json/route.ts` 작성
  - 반환: 배열 `[{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace, package_name, sha256_cert_fingerprints: [업로드 키, 앱 서명 키] } }]`
- [ ] (필요 시) `apps/client/next.config.js`의 `headers()`로 `/.well-known/*` 추가 헤더 설정
- [ ] (운영) Cloudflare/리버스 프록시가 `.well-known` 경로를 가로채지 않는지 확인

**검증**:
```bash
# 형식
curl -sI https://breedy.kr/.well-known/apple-app-site-association | grep -i content-type
curl -s  https://breedy.kr/.well-known/apple-app-site-association | jq .
curl -s  https://breedy.kr/.well-known/assetlinks.json | jq .

# Apple CDN 캐시 (배포 직후엔 미반영일 수 있음)
curl -s https://app-site-association.cdn-apple.com/a/v1/breedy.kr | jq .

# Google 공식 검증 도구
# https://developers.google.com/digital-asset-links/tools/generator
```

---

### Phase 3: iOS Associated Domains + Custom Scheme  `[TODO]`

**목표**: 앱이 `https://breedy.kr/...`와 `breedy://...` 모두를 받을 수 있게 한다.

**작업 항목**:
- [ ] Xcode에서 `apps/mobile/ios/mobile.xcworkspace` 열기
- [ ] Target `mobile` → Signing & Capabilities → "+ Capability" → **Associated Domains** 추가
- [ ] 항목 추가: `applinks:breedy.kr`
- [ ] (개발 디버그 시) `applinks:breedy.kr?mode=developer` 사용 가능 — TestFlight 빌드에선 모드 옵션 제거
- [ ] `mobile.entitlements`에 `com.apple.developer.associated-domains` 자동 추가 확인
- [ ] `Info.plist`의 `CFBundleURLTypes`에 Custom Scheme `breedy` 추가
  - 기존 카카오 스킴(`kakao{KAKAO_APP_KEY}`)과 충돌 없음 — 별도 URL Type으로 등록
- [ ] Provisioning profile 재생성 (Apple Developer 콘솔, Capabilities에 Associated Domains 활성화)

**검증**:
- 디바이스에 빌드 설치 → 메모앱에 `https://breedy.kr/pet/<실제 펫id>` 입력 → 길게 눌러 "BREEDY로 열기" 메뉴 표시
- Safari에서 위 URL 직접 입력 → 앱으로 전환되는지 (인앱 브라우저 아닌 Safari에서 테스트)

---

### Phase 4: Android App Links + intent-filter  `[TODO]`

**목표**: 앱이 `https://breedy.kr/...`와 `breedy://...` 모두를 자동 검증 통과 상태로 처리.

**작업 항목**:
- [ ] `apps/mobile/android/app/src/main/AndroidManifest.xml`의 `.MainActivity`에 intent-filter 2개 추가:
  - HTTPS App Link (`autoVerify="true"`, `scheme="https"`, `host="breedy.kr"`, `pathPrefix`를 §4 경로별로 모두 등록)
  - Custom Scheme (`scheme="breedy"`)
- [ ] `singleTask` launchMode 유지 (이미 설정됨) — 새 인스턴스 생성 방지
- [ ] (선택) `MainActivity.kt`/`MainActivity.java`에서 `onNewIntent` 처리 확인 — React Native Linking으로 자동 전달됨

**검증**:
```bash
# 디바이스 연결 후
adb shell pm verify-app-links --re-verify com.greenonion.daepa
adb shell pm get-app-links com.greenonion.daepa     # breedy.kr → verified 확인

# 링크 직접 호출
adb shell am start -W -a android.intent.action.VIEW -d "https://breedy.kr/pet/abc123" com.greenonion.daepa
adb shell am start -W -a android.intent.action.VIEW -d "breedy://pet/abc123" com.greenonion.daepa
```

---

### Phase 5: RN URL 수신 → WebView 전달  `[TODO]`

**목표**: 콜드 스타트/웜 스타트 모두에서 들어온 URL을 파싱해 `WebViewScreen`에 path로 전달.

**작업 항목**:
- [ ] `apps/mobile/src/navigation/linking.ts` 신규 파일
  - `prefixes: ['https://breedy.kr', 'breedy://']`
  - `getStateFromPath(path, options)`: path만 추출해 `Main` 스크린의 `params.path`로 매핑하는 커스텀 구현
  - 보호 경로(로그인 필요)는 `pendingPath`로 저장 후 Login 스크린으로 (`useAuthStore` 활용)
- [ ] `apps/mobile/App.tsx`에서 `<NavigationContainer linking={linking}>` 적용
- [ ] 콜드 스타트 처리: `Linking.getInitialURL()` → 파싱 → `initialState` 적용 (또는 `linking` config가 자동 처리)
- [ ] 웜 스타트 처리: `Linking.addEventListener('url', ...)` → `navigationRef.navigate('Main', { path })`
- [ ] 카카오 OAuth 콜백 URL(`kakao{...}://oauth`)은 기존 핸들러가 처리하므로 linking config에서 명시적으로 무시
- [ ] 푸시 알림 deep link(`/notifications?id=...`)는 이미 동작 중 — linking 도입 후에도 깨지지 않는지 회귀 테스트

**검증**:
```bash
# iOS Simulator
xcrun simctl openurl booted https://breedy.kr/pet/abc123
xcrun simctl openurl booted breedy://pet/abc123

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "https://breedy.kr/pet/abc123"
```
- 앱이 종료된 상태에서도 정상 진입
- 앱이 백그라운드일 때 정상 진입
- 앱이 포그라운드일 때 정상 진입 (다른 페이지 보고 있어도)
- 비로그인 + 보호 페이지 → 로그인 후 원래 경로 진입

---

### Phase 6: 앱 설치 유도 UX  `[TODO]`

**목표**: 모바일 웹 진입 사용자에게 앱 설치를 유도하되, 강제하지 않는다.

**감지 로직** (`apps/client/src/lib/userAgent.ts` 또는 hook으로):
```ts
isInApp       = !!window.ReactNativeWebView    // RN WebView 내부면 모든 UI 숨김
isMobile      = /Mobi|Android|iPhone/.test(ua)
isIOS         = /iPhone|iPad|iPod/.test(ua)
isAndroid     = /Android/.test(ua)
isKakaoInApp  = /KAKAOTALK/.test(ua)
isInstaInApp  = /Instagram/.test(ua)
fromShare     = searchParams.get('ref') === 'share'
```

**노출 정책**:

| 상황 | UI | 다시 안 보기 |
|------|----|---|
| `isInApp` | 표시 안 함 | — |
| 데스크톱 | 표시 안 함 | — |
| 모바일 + 일반 진입 | 상단 배너 | 7일 (localStorage) |
| 모바일 + 공유 진입(`ref=share`) | 바텀시트 모달 (1회) | 세션 |
| 모바일 + 카톡/IG 인앱 | "외부 브라우저로 열기" 안내 배너 | 닫기 시 세션 |

**"앱으로 열기" 버튼 동작**:

| 환경 | 동작 |
|------|------|
| iOS Safari | App Store(`https://apps.apple.com/app/id6758280555`) 직행 |
| iOS 카톡 인앱 | "Safari로 열기" 가이드 (인앱 브라우저는 Universal Link 차단) |
| Android Chrome | Intent URL — 앱 있으면 실행, 없으면 Play Store 폴백<br/>`intent://breedy.kr/pet/123#Intent;scheme=https;package=com.greenonion.daepa;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.greenonion.daepa;end` |
| Android 카톡 인앱 | Chrome 강제 이동 안내 |

**작업 항목**:
- [ ] `apps/client/src/lib/userAgent.ts` 작성 (감지 유틸)
- [ ] `apps/client/src/lib/appPromptStorage.ts` 작성 (localStorage 노출 빈도 관리)
- [ ] `apps/client/src/components/AppInstallPrompt/Banner.tsx` (상단 띠)
- [ ] `apps/client/src/components/AppInstallPrompt/BottomSheet.tsx` (공유 진입 모달)
- [ ] `apps/client/src/components/AppInstallPrompt/KakaoInAppGuide.tsx` (인앱 브라우저 안내)
- [ ] `apps/client/src/app/layout.tsx`(또는 `(브리더스룸)/layout.tsx`)에 진입점 마운트
- [ ] 적용 제외 경로(예: `/intro`, `/privacy`, `/auth-callback`) 필터

**검증**: §8 시나리오 매트릭스 참조.

---

### Phase 7: 공유 UX 구현  `[TODO]`

**목표**: 각 페이지에 일관된 공유 버튼 + 외부 미리보기(OG/카톡) 메타.

**작업 항목**:
- [ ] `apps/client/src/lib/share.ts` 작성
  - 앱 내부(`isInApp`): `native-bridge.ts`로 메시지 전송 → RN의 `Share.share()` 호출
  - 일반 브라우저: `navigator.share` 우선, 폴백 `navigator.clipboard.writeText` + 토스트
  - 공유 URL은 항상 `?ref=share` 부착
- [ ] `apps/mobile/src/screens/WebView/index.tsx`의 `handleMessage`에 `share` 케이스 추가
- [ ] `apps/client/src/lib/native-bridge.ts`에 `share(payload)` 함수 추가
- [ ] 페이지별 `generateMetadata()` 작성 (OG 태그):
  - `/pet/[petId]` → 펫 이름, 썸네일, 부모/모프 요약
  - `/showroom/[username]` → 브리더 이름, 대표 이미지
  - `/auction/*` → 추후
- [ ] 카카오톡 공유 미리보기 검증 (`og:image` 1200x630 권장, https 필수)

---

### Phase 8: 통합 검증 매트릭스  `[TODO]`

| # | 시나리오 | iOS | Android |
|---|---------|-----|---------|
| 1 | 앱 설치 + 종료 상태, 외부 링크 클릭 | 앱 콜드 스타트 → 해당 페이지 | 동일 |
| 2 | 앱 설치 + 백그라운드, 외부 링크 클릭 | 앱 포그라운드 + 해당 페이지 진입 | 동일 |
| 3 | 앱 설치 + 포그라운드(다른 페이지), 외부 링크 클릭 | 해당 페이지로 전환 | 동일 |
| 4 | 앱 미설치, Safari/Chrome에서 링크 클릭 | 웹 페이지 + 상단 배너 | 동일 |
| 5 | 앱 미설치, 공유 링크(?ref=share) 클릭 | 웹 페이지 + 바텀시트 모달 | 동일 |
| 6 | 모달에서 "앱으로 열기" 클릭 | App Store | Play Store (Intent URL 폴백) |
| 7 | 모달에서 "웹으로 보기" 클릭 | 모달 닫힘, 세션 동안 재노출 X | 동일 |
| 8 | 카톡 인앱에서 링크 클릭 | "Safari로 열기" 안내 | "Chrome으로 열기" 안내 |
| 9 | 비로그인 + 보호 경로 진입 | 로그인 후 원래 경로 | 동일 |
| 10 | 데스크톱 진입 | 배너/모달 없음 | — |
| 11 | RN WebView 내부 | 배너/모달 없음 | 동일 |
| 12 | 푸시 알림 클릭(`/notifications?id=...`) | 알림 상세 진입 (회귀 테스트) | 동일 |

---

## 7. 파일 변경 인덱스

작업 진행 시 변경/생성된 파일을 여기에 누적 기록합니다.

| 파일 | 변경 사유 | Phase | 상태 |
|------|----------|-------|------|
| `docs/universal-links/plan.md` | 본 계획 문서 | — | `[DONE]` |
| `apps/client/src/app/.well-known/apple-app-site-association/route.ts` | AASA 엔드포인트 (신규) | 2 | `[DONE]` |
| `apps/client/src/app/.well-known/assetlinks.json/route.ts` | Digital Asset Links (신규) | 2 | `[DONE]` |
| `apps/mobile/android/app/src/main/AndroidManifest.xml` | MainActivity에 App Link + custom scheme intent-filter 2개 추가 | 4 | `[DONE]` |
| `apps/mobile/src/navigation/linking.ts` | React Navigation linking config (신규) | 5 | `[DONE]` |
| `apps/mobile/App.tsx` | NavigationContainer에 `linking` prop 연결 | 5 | `[DONE]` |
| `apps/mobile/__tests__/linking.test.ts` | normalizePath / getStateFromPath 단위 테스트 (신규) | 5 | `[DONE]` |
| `apps/client/src/lib/userAgent.ts` | UA 감지 유틸 (신규) | 6 | `[DONE]` |
| `apps/client/src/lib/appPromptStorage.ts` | 배너/모달 dismissal storage (신규) | 6 | `[DONE]` |
| `apps/client/src/components/AppInstallPrompt/index.tsx` | 오케스트레이터 (신규) | 6 | `[DONE]` |
| `apps/client/src/components/AppInstallPrompt/Banner.tsx` | 상단 배너 (신규) | 6 | `[DONE]` |
| `apps/client/src/components/AppInstallPrompt/BottomSheet.tsx` | 공유 진입 인터스티셜 (신규) | 6 | `[DONE]` |
| `apps/client/src/components/AppInstallPrompt/KakaoInAppGuide.tsx` | 인앱 브라우저 안내 (신규) | 6 | `[DONE]` |
| `apps/client/src/components/AppInstallPrompt/storeLinks.ts` | 스토어/인텐트 URL 빌더 (신규) | 6 | `[DONE]` |
| `apps/client/src/app/layout.tsx` | `<AppInstallPrompt />` 마운트 | 6 | `[DONE]` |
| `apps/client/src/lib/share.ts` | 공유 통합 유틸 (`?ref=share` 일관 부착, 신규) | 7 | `[DONE]` |
| `apps/client/src/app/showroom/[username]/utils/shareShowroom.ts` | `sharePage` 사용, URL 형식을 canonical `/showroom/{slug}`로 통일 | 7 | `[DONE]` |
| `apps/client/src/app/(브리더스룸)/pet/[petId]/components/Header.tsx` | `sharePage` 사용 | 7 | `[DONE]` |
| `apps/mobile/ios/mobile/mobile.entitlements` | `com.apple.developer.associated-domains` = `applinks:breedy.kr` 추가 | 3 | `[DONE]` (코드) |
| `apps/mobile/ios/mobile/Info.plist` | `CFBundleURLTypes`에 `breedy` 스킴 추가 | 3 | `[DONE]` |
| `apps/mobile/ios/mobile-Bridging-Header.h` | `#import <React/RCTLinkingManager.h>` 추가 (Swift에서 RCTLinkingManager 접근용) | 3 | `[DONE]` |
| `apps/mobile/ios/mobile/AppDelegate.swift` | `open URL`을 RCTLinkingManager로 폴백, `continue userActivity` 핸들러 추가 (Universal Link) | 3 | `[DONE]` |

---

## 8. 참고 자료

- Apple: [Supporting Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- Apple: [Allowing apps and websites to link to your content](https://developer.apple.com/documentation/bundleresources/applinks)
- Apple AASA CDN: `https://app-site-association.cdn-apple.com/a/v1/<domain>`
- Google: [Android App Links](https://developer.android.com/training/app-links)
- Google: [Digital Asset Links Generator](https://developers.google.com/digital-asset-links/tools/generator)
- Google: [Intent URL 폴백](https://developer.chrome.com/docs/multidevice/android/intents)
- React Navigation: [Configuring links](https://reactnavigation.org/docs/configuring-links)

---

## 9. 운영 주의사항

- AASA/assetlinks.json은 **HTTP 200 + 정확한 Content-Type** 으로만 응답해야 검증 통과. 리다이렉트(301/302) 금지.
- AASA 파일은 Apple CDN이 캐시(약 24시간). 변경 후 즉시 반영 안 됨 — 검증 시 디바이스에서 직접 URL 호출 또는 앱 재설치로 우회.
- Android의 `autoVerify`는 앱 설치 시점에 검증을 시도. assetlinks.json이 잘못되면 자동 검증 실패 → 사용자에게 매번 "이 링크로 열 앱 선택" 다이얼로그가 뜸. 배포 전 반드시 §6 Phase 4 검증 명령으로 확인.
- 카카오톡 인앱 브라우저는 Universal/App Link을 **항상 차단**한다. 카톡 트래픽이 큰 한국 서비스에서는 "외부 브라우저로 열기" 가이드가 사실상 필수.
- `?ref=share` 외 다른 트래킹 파라미터(예: `?ref=share&from=kakao`)를 채널별로 부착하면 공유 채널 효율 측정 가능. 추후 분석 필요 시 확장.

---

## 10. 변경 로그

| 날짜 | 변경 | 작성자 |
|------|------|-------|
| 2026-05-14 | 초안 작성 (Phase 1 확정, Phase 2~8 작업 항목 정의) | Claude + sh.k |
| 2026-05-14 | Q1 해결 (앱 서명 키 SHA-256 확정). 자동 진행 운영 방식 합의 (휴먼 체크포인트 3개). | Claude + sh.k |
| 2026-05-14 | Phase 2 / 4 / 5 / 6 / 7 일괄 구현 완료. 로컬 검증 통과. Phase 3 (iOS 콘솔/엔타이틀먼트), Phase 8 (실디바이스) 휴먼 체크포인트 대기. | Claude |
| 2026-05-14 | Phase 3 코드 편집 완료 (entitlements, Info.plist, AppDelegate.swift, bridging header). Apple Developer Portal capability 활성화 + `pod install` + 실디바이스 빌드는 휴먼 단계. | Claude |
