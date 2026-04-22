# 모바일 앱 식별자 변경 가이드 (Android applicationId / iOS Bundle ID)

> 최종 수정: 2026-04-22
> 대상: `apps/mobile` (React Native)
> 목적: Android `applicationId` 또는 iOS Bundle ID 를 바꿀 때 **코드 + 외부 서비스 등록 + 배포 체크리스트** 를 한 곳에 정리해 재발을 막고 누락을 방지.

---

## 0. 읽기 전에 — 핵심 원칙

1. 앱 식별자 변경은 **되돌리기 힘든 변경**이다. Play Store/App Store 에 출시된 이후에는 동일 앱으로 재출시 불가 — 완전히 새 앱으로 취급된다.
2. 코드만 바꿔서는 **빌드만 통과하고 런타임에 모든 외부 서비스가 실패**한다. Firebase / OAuth / Kakao 등은 식별자를 키로 등록돼 있기 때문.
3. 본 프로젝트에서는 iOS 와 Android 식별자가 **별개 변수** 로 분리돼 있다.
   - iOS: `BUNDLE_ID` env (`apps/mobile/.env*`) → Xcode `PRODUCT_BUNDLE_IDENTIFIER`
   - Android: `ANDROID_APPLICATION_ID` env (`apps/mobile/.env*`) → Gradle `applicationId`
   - 둘은 같은 값이어도, 달라도 된다 (현재는 다르다: `com.greenonion.daepamily` vs `com.greenonion.daepa`).
4. Kotlin `namespace` 와 Kotlin 소스 경로 (`java/com/mobile/`) 는 **applicationId 와 독립적인 내부 식별자**다. 바꿀 이유가 없으면 건드리지 않는다.

---

## 1. 코드 변경 체크리스트

변경 대상이 **Android** 인지 **iOS** 인지에 따라 건드리는 파일이 다르다.

### 1-1. Android applicationId 변경 시

| # | 파일 | 변경 내용 |
|---|---|---|
| 1 | `apps/mobile/.env` | `ANDROID_APPLICATION_ID=<new>` |
| 2 | `apps/mobile/.env.development` | 동일 |
| 3 | `apps/mobile/.env.production` | 동일 |
| 4 | `apps/mobile/.env.example` | 예제값 업데이트 |
| 5 | `apps/mobile/android/app/google-services.json` | **파일 전체 교체** (Firebase Console 에서 새 Android 앱 등록 후 다운로드) |

`apps/mobile/android/app/build.gradle` 은 이미 env 에서 `applicationId` 를 읽도록 구성돼 있어 **수정 불필요**:

```groovy
applicationId project.env.get("ANDROID_APPLICATION_ID") ?: "com.mobile"
```

> 주의: `google-services.json` 의 `package_name` 필드만 수동으로 바꾸면 안 된다. 그 파일 안의 `mobilesdk_app_id`, `api_key` 등은 Firebase 가 앱별로 부여하는 값이라 Console 에서 새 Android 앱을 추가하고 파일을 통째로 다시 받아야 Firebase 런타임 매칭이 성립한다.

### 1-2. iOS Bundle ID 변경 시

| # | 파일 | 변경 내용 |
|---|---|---|
| 1 | `apps/mobile/.env` | `BUNDLE_ID=<new>` |
| 2 | `apps/mobile/.env.development` | 동일 |
| 3 | `apps/mobile/.env.production` | 동일 |
| 4 | `apps/mobile/.env.example` | 예제값 업데이트 |
| 5 | `apps/mobile/ios/mobile.xcodeproj/project.pbxproj` | `PRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*]` 하드코딩 라인을 새 값으로 (일반적으로 2~4줄) |
| 6 | `apps/mobile/ios/GoogleService-Info.plist` | **파일 전체 교체** (Firebase Console 에서 새 iOS 앱 등록 후 다운로드) |
| 7 | `apps/mobile/ios/mobile/GoogleService-Info.plist` | Xcode 프로젝트가 참조하는 복사본 — 위 5번 파일과 동일 내용으로 교체 |

`apps/mobile/ios/Config.xcconfig` / `tmp.xcconfig` 는 `pod install` 시 `.env.*` 에서 자동 재생성되므로 손대지 않는다.

### 1-3. 두 식별자를 동시에 바꿀 때

위 1-1, 1-2 모두 수행. 두 식별자는 같을 필요 없지만, 같게 유지하고 싶다면 `.env*` 에서 두 변수에 동일 값을 적으면 된다.

---

## 2. 외부 서비스 재등록 (코드 변경만으로는 동작 안 함)

**변경된 식별자별로** 아래 단계를 모두 수행해야 한다. 하나라도 빠지면 해당 기능이 실패한다.

### 2-1. Firebase (FCM 푸시 알림 / Analytics)

Android/iOS 앱은 Firebase 에서 **식별자 기준으로 별개 앱** 으로 등록된다.

**Android**
1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 `breedy-d4d81` → ⚙️ 프로젝트 설정
2. **내 앱** → `Android 앱 추가` → 패키지 이름에 새 `applicationId` 입력
3. 앱 닉네임 / Store ID 설정 (Store ID 는 Play Console 업로드 후 자동 연결)
4. **디버그 SHA-1 추가** (로컬 빌드 서명) + **릴리스 SHA-1 추가** (Play Store 업로드 키)
   ```bash
   # debug SHA-1
   keytool -list -v -keystore apps/mobile/android/app/debug.keystore \
     -alias androiddebugkey -storepass android -keypass android
   # release SHA-1
   keytool -list -v -keystore apps/mobile/android/app/daepa-release.keystore \
     -alias daepa-key
   ```
5. **`google-services.json` 다운로드 → `apps/mobile/android/app/google-services.json` 을 이 파일로 교체**
6. Google Play 출시 이후에는 Play App Signing 의 SHA-1 도 추가해야 함 (Play Console → 설정 → 앱 서명 → "앱 서명 키 인증서 SHA-1")

**iOS**
1. Firebase Console → 동일 프로젝트 → `iOS 앱 추가` → Bundle ID 에 새 값 입력
2. (선택) App Store ID, APNs 인증 키 등록
3. **`GoogleService-Info.plist` 다운로드 → `apps/mobile/ios/GoogleService-Info.plist` 및 `apps/mobile/ios/mobile/GoogleService-Info.plist` 두 곳 모두 교체**

누락 시 증상
- Android: FCM 토큰 발급 실패 (`FirebaseApp is not initialized`) / 푸시 도착 안 함
- iOS: Firebase 초기화 경고 → 기능 무력화

### 2-2. Google Cloud Console (OAuth 클라이언트)

Google 로그인은 **식별자 + SHA-1 (Android) / 번들 ID (iOS)** 기준 OAuth 클라이언트가 필요하다.

**Android**
1. [Google Cloud Console](https://console.cloud.google.com) → API 및 서비스 → **사용자 인증 정보**
2. **OAuth 2.0 클라이언트 ID 만들기** → 애플리케이션 유형: Android
3. 패키지 이름: 새 `applicationId`, SHA-1: 위 2-1 과 동일한 값 (debug + release 각각)
4. Android 는 client secret 이 없음 — env 에 별도 `GOOGLE_CLIENT_ID_ANDROID` 추가는 불필요 (google-services.json 에 포함)

**iOS**
1. 동일 페이지에서 OAuth 클라이언트 ID 새로 생성 → 유형: iOS
2. 번들 ID: 새 값
3. 생성된 클라이언트 ID 를 `.env*` 의 `GOOGLE_CLIENT_ID_IOS` 로 교체
4. `GOOGLE_REVERSED_CLIENT_ID` 도 새 값으로 갱신 (`com.googleusercontent.apps.<숫자>` 형식)

누락 시 증상: Google 로그인 시 `DEVELOPER_ERROR` 또는 401 반환.

### 2-3. Kakao Developers

카카오 로그인은 앱에 등록된 **플랫폼 식별자 + 키 해시 (Android) / 번들 ID (iOS)** 와 매칭돼야 한다.

1. [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 플랫폼
2. **Android 플랫폼 수정** → 패키지명에 새 `applicationId` 추가, **키 해시** 등록
   ```bash
   # debug 키 해시
   keytool -exportcert -alias androiddebugkey -keystore apps/mobile/android/app/debug.keystore \
     -storepass android -keypass android | openssl sha1 -binary | openssl base64
   # release 키 해시
   keytool -exportcert -alias daepa-key -keystore apps/mobile/android/app/daepa-release.keystore \
     | openssl sha1 -binary | openssl base64
   ```
3. **iOS 플랫폼 수정** → 번들 ID 에 새 값 추가
4. (선택) Redirect URI / Origin 도 확인

누락 시 증상: 카카오 SDK 초기화 실패 또는 `KakaoTalk is not connected` 계열 오류.

### 2-4. Apple Developer Portal (iOS 전용)

iOS Bundle ID 를 바꾸는 경우에만 해당.

1. [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **App IDs** → 새 Bundle ID 생성
2. Capabilities 활성화 (Push Notifications, Associated Domains, Sign in with Apple 등 — 기존과 동일하게)
3. 해당 App ID 로 **Provisioning Profile** (Development / App Store) 새로 생성
4. Xcode → Signing & Capabilities → 새 프로필 선택
5. (Push 를 쓰면) APNs 키는 프로젝트당 1개로 공유 가능 — 재등록 불필요. 단 Firebase Console 의 iOS 앱에 APNs 업로드를 다시 확인.

### 2-5. Play Store / App Store Connect

**Play Store (Android)**
- 이미 출시된 앱은 `applicationId` 변경 불가 → **완전히 새 앱으로 Play Console 에 등록해야 함**.
- 기존 유저는 새 앱을 수동으로 설치해야 하고 자동 업데이트 안 됨.
- 구 앱을 "지원 종료" 상태로 전환하고 신규 앱 링크로 유도하는 in-app 공지 고려.

**App Store Connect (iOS)**
- Bundle ID 변경 시 마찬가지로 **새 앱** 으로 등록. 기존 앱과의 업데이트 경로 없음.

---

## 3. 빌드 검증 체크리스트

코드 + 외부 등록 완료 후 아래를 순서대로 확인.

- [ ] `cd apps/mobile && pnpm ios --mode=Debug` 로 iOS 디버그 빌드 → 앱 실행 → 로그인/푸시 정상
- [ ] `cd apps/mobile/android && ./gradlew :app:assembleDebug` → 빌드 성공 → 에뮬레이터 설치 → 로그인/푸시 정상
- [ ] 릴리스 빌드: `./gradlew :app:bundleRelease` → Play Console 내부 테스트 트랙 업로드 → 설치 후 기능 점검
- [ ] Firebase Console 에서 해당 앱의 "최근 이벤트" 가 정상 수신되는지 확인
- [ ] Sentry/Crashlytics 이 설치돼 있다면 이벤트 수신 dashboard 확인

---

## 4. 식별자를 바꾸지 않아야 하는 경우

다음 상황에서는 식별자 변경을 시도하지 말고 다른 해결책을 찾는다:

1. 이미 수만 이상의 유저가 설치한 앱 — 자동 업데이트가 끊기면 지원 비용 폭증
2. 식별자가 외부 파트너/SDK 와 계약상 고정된 경우 (결제 게이트웨이 SDK 의 화이트리스트 등)
3. 정책 위반 회피 목적 (새 식별자로 재출시해 정지를 우회하려는 시도는 Apple/Google 양쪽 모두 금지)

---

## 5. 과거 변경 이력

| 날짜 | 변경 | 비고 |
|---|---|---|
| 2026-04-22 | Android: `com.greenonion.daepamily` → `com.greenonion.daepa` | iOS Bundle ID 는 유지. Play Store 출시 전 단계에서 변경. |

향후 변경 시 이 표에 한 줄 추가.
