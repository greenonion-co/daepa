# Android App Bundle 빌드 및 Google Play Console 업로드 가이드

## 1단계: 릴리스 서명 키(Keystore) 생성

현재 release 빌드가 debug 서명을 사용 중이므로, Play Store 업로드용 릴리스 keystore를 생성해야 한다.

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore apps/mobile/android/app/daepa-release.keystore \
  -alias daepa-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

- 비밀번호, 이름, 조직명 등을 입력
- **비밀번호를 반드시 기억할 것** (분실 시 앱 업데이트 불가)
- 생성된 `.keystore` 파일은 **git에 커밋하지 않는다**

## 2단계: 서명 설정 추가

### gradle.properties에 키 정보 추가

`apps/mobile/android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=daepa-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=daepa-key
MYAPP_UPLOAD_STORE_PASSWORD=여기에비밀번호
MYAPP_UPLOAD_KEY_PASSWORD=여기에비밀번호
```

### build.gradle 서명 설정 수정

`apps/mobile/android/app/build.gradle`:

```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release   // debug → release로 변경
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

## 3단계: versionCode / versionName 확인

`apps/mobile/android/app/build.gradle`의 `defaultConfig`:

```groovy
versionCode 1
versionName "1.0"
```

- Play Store에 업로드할 때마다 `versionCode`를 증가시켜야 한다
- 첫 업로드라면 현재 값 그대로 사용 가능

## 4단계: .env 파일 확인

릴리스 빌드 시 아래 환경변수가 필수:

- `KAKAO_APP_KEY` — 없으면 빌드 실패
- `BUNDLE_ID` — 없으면 기본값 `com.mobile` 사용

## 5단계: App Bundle 빌드

### 방법 A: Android Studio UI

1. Android Studio에서 `apps/mobile/android` 폴더를 Open
2. Gradle sync 완료 대기
3. 메뉴: **Build → Generate Signed Bundle / APK...**
4. **Android App Bundle** 선택 → Next
5. Keystore path에 생성한 keystore 선택, 비밀번호/alias 입력 → Next
6. **release** 선택 → **Create**
7. 빌드 완료 후 출력 경로: `app/build/outputs/bundle/release/app-release.aab`

### 방법 B: 터미널

```bash
cd apps/mobile/android && ./gradlew bundleRelease
```

출력 파일: `app/build/outputs/bundle/release/app-release.aab`

## 6단계: Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. **앱 만들기** (첫 등록 시) → 앱 이름, 기본 언어, 앱/게임 유형 등 입력
3. 왼쪽 메뉴에서 트랙 선택 (내부 테스트 / 비공개 테스트 / 프로덕션)
4. **새 버전 만들기** → `.aab` 파일 업로드
5. 출시 노트 작성 → **검토** → **출시 시작**

## 주의사항

- `daepa-release.keystore`와 `gradle.properties`의 비밀번호는 `.gitignore`에 추가할 것
- 첫 업로드 시 Play Console에서 **Play App Signing**에 동의하게 됨 (Google이 앱 서명 키 관리)
- 스토어 등록 정보(스크린샷, 설명, 아이콘 등)를 미리 준비해야 심사 제출 가능