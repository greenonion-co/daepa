This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Environment Configuration

이 프로젝트는 개발(Development)과 프로덕션(Production) 환경을 분리하여 관리합니다.

### 환경 파일

- `.env.development` - 개발 환경 설정 (로컬 서버 URL 등)
- `.env.production` - 프로덕션 환경 설정 (실제 서버 URL 등)

### iOS Xcode Schemes

| Scheme | 환경 | 용도 |
|--------|------|------|
| `breedy-alpha` | Development | 개발 및 테스트용 |
| `breedy` | Production | TestFlight/App Store 배포용 |

각 Scheme은 빌드 시 Pre-Action 스크립트를 통해 자동으로 해당 환경의 `.env` 파일을 적용합니다.

### 빌드 스크립트

```sh
# 개발 환경 (빠른 실행 - pod install 없음)
pnpm ios

# 개발 환경 (초기 설정 또는 네이티브 의존성 변경 후)
pnpm ios:setup

# 프로덕션 환경 빌드
pnpm ios:prod

# Pod install만 실행
pnpm pod:dev    # 개발 환경용
pnpm pod:prod   # 프로덕션 환경용

# Android 개발 환경
pnpm android
```

### DEV 표시

개발 환경에서 실행 시 앱 화면 우측 상단에 빨간색 "DEV" 뱃지가 표시됩니다.
`SERVER_BASE_URL`에 `192.168`, `localhost`, 또는 `10.0.`이 포함된 경우 개발 환경으로 인식합니다.

### 주의사항

- `pnpm ios`는 이미 pod install이 완료된 상태에서 빠르게 실행할 때 사용합니다.
- 처음 clone하거나 네이티브 의존성이 변경된 경우 `pnpm ios:setup`을 사용하세요.
- Xcode에서 직접 Archive할 때는 `breedy` scheme을 선택하면 자동으로 프로덕션 환경이 적용됩니다.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
