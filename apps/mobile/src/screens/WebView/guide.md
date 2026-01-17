# WebView 동작 가이드

## 개요

`WebViewScreen`은 React Native 앱에서 Next.js 웹 클라이언트를 렌더링하는 핵심 컴포넌트입니다. 웹과 앱 간의 양방향 통신, 인증 토큰 동기화, 네비게이션 제어 등을 담당합니다.

## 파일 구조

```
apps/mobile/src/screens/WebView/
├── index.tsx       # 메인 WebView 컴포넌트
├── types.ts        # 타입 정의
├── scripts.ts      # 주입 JavaScript 스크립트
└── guide.md  # 이 문서

apps/client/src/lib/
└── native-bridge.ts  # 웹에서 앱으로 통신하는 브릿지 유틸리티
```

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   WebViewScreen                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              TopBar (조건부)                     │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │                                                 │  │  │
│  │  │              react-native-webview               │  │  │
│  │  │        ┌─────────────────────────────┐          │  │  │
│  │  │        │     Next.js 웹 클라이언트    │          │  │  │
│  │  │        │                             │          │  │  │
│  │  │        │  window.ReactNativeWebView  │          │  │  │
│  │  │        │    .postMessage() ──────────┼──► onMessage │  │
│  │  │        │                             │          │  │  │
│  │  │        └─────────────────────────────┘          │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Props 및 상태

### Props

| Prop | 타입 | 설명 |
|------|------|------|
| `initialPath` | `string?` | 초기 로드할 웹 경로. 탭에서 직접 렌더링 시 사용 |

### 내부 상태

| 상태 | 타입 | 용도 |
|------|------|------|
| `canGoBack` | `boolean` | WebView 내부에서 뒤로가기 가능 여부 |
| `error` | `string \| null` | 에러 메시지 (로드 실패 시) |
| `refreshing` | `boolean` | Pull-to-refresh 진행 중 여부 |

---

## 사용 방식에 따른 동작 차이

### 1. 탭에서 직접 렌더링 (initialPath 있음)

```tsx
// Tabs.tsx
function AdminHomeWebView() {
  return <WebViewScreen initialPath="/pet" />;
}
```

- `isPushed = false` → TopBar 숨김
- 하단 탭바가 표시됨
- 루트 레벨 화면으로 동작

### 2. navigation.push로 열림 (initialPath 없음)

```tsx
// 다른 화면에서
navigation.push('Main', { path: '/pet/123' });
```

- `isPushed = true` → TopBar 표시 (뒤로가기 버튼)
- 하단 탭바 숨김
- 스택에 쌓인 화면으로 동작

---

## 통신 프로토콜

### 웹 → 앱 (postMessage)

웹에서 `native-bridge.ts`의 함수를 호출하면 앱의 `handleMessage`에서 처리됩니다.

```tsx
// 웹 (native-bridge.ts)
sendToNative({ type: 'NAVIGATE', path: '/pet/123' });

// 앱 (index.tsx)
const handleMessage = (event) => {
  const message = JSON.parse(event.nativeEvent.data);
  switch (message.type) {
    case 'NAVIGATE': ...
  }
};
```

### 앱 → 웹 (injectedJavaScript)

앱에서 웹 페이지 로드 전/후에 JavaScript를 주입합니다.

```tsx
<WebView
  injectedJavaScriptBeforeContentLoaded={...}  // 페이지 로드 전
  injectedJavaScript={...}                      // 페이지 로드 후
/>
```

---

## 메시지 타입 상세

### LOGOUT
로그아웃 처리 후 로그인 화면으로 이동

```tsx
// 웹에서 호출
sendToNative({ type: 'LOGOUT' });

// 앱에서 처리
case 'LOGOUT':
  clear();  // 인증 정보 삭제
  navigation.reset({
    index: 1,
    routes: [{ name: 'Tabs' }, { name: 'Login' }],
  });
```

### NAVIGATE
화면 이동 요청 (WebView 경로 또는 네이티브 화면)

```tsx
// 웹에서 호출
navigate({ path: '/pet/123' });                    // WebView 페이지
navigate({ screen: 'Login' });                     // 네이티브 화면
navigate({ path: '/home', options: { replace: true } });  // 현재 화면 교체
navigate({ path: '/home', options: { popToTop: true } }); // 스택 초기화 후 이동

// 앱에서 처리
case 'NAVIGATE':
  if (options?.popToTop) navigation.popToTop();

  if (screen) {
    // 네이티브 화면으로 이동
    navigation.navigate(screen, params);
  } else if (path) {
    // WebView 페이지로 이동 (새 스택에 push)
    navigation.push('Main', { path: pathWithParam });
  }
```

### GO_BACK
네이티브 네비게이션 뒤로가기

```tsx
// 웹에서 호출
requestGoBack();

// 앱에서 처리
case 'GO_BACK':
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
```

### POP_TO_ROOT
네비게이션 스택 초기화 (루트로 이동)

```tsx
// 웹에서 호출
requestPopToRoot();

// 앱에서 처리
case 'POP_TO_ROOT':
  navigation.popToTop();
```

### SET_USER_DATA
유저 정보 동기화 (웹 → 앱)

```tsx
// 웹에서 호출
syncUserToNative(user);

// 앱에서 처리
case 'SET_USER_DATA':
  setUser(message.user);
```

### SET_THEME
테마 변경

```tsx
// 웹에서 호출
requestSetTheme('dark');

// 앱에서 처리
case 'SET_THEME':
  setTheme(message.theme);
```

### TOAST
네이티브 토스트 메시지 표시

```tsx
// 웹에서 호출
requestToast('저장되었습니다', 'success');

// 앱에서 처리
case 'TOAST':
  Toast.show(message.message);
```

### LOG
웹 콘솔 로그를 앱으로 전달 (디버깅용)

```tsx
// 웹에서 console.log() 호출 시 자동 전달
console.log('디버그 메시지');

// 앱에서 처리
case 'LOG':
  console[message.level]('[WebView]', ...message.args);
  // 개발 환경에서 Toast로 표시
  if (__DEV__) Toast.show(`[${message.level}] ${logContent}`);
```

### TOKEN_REFRESH_FAILED
토큰 갱신 실패 시 인증 정보를 삭제하고 로그인 화면으로 이동

```tsx
// 웹에서 호출
notifyTokenRefreshFailed();

// 앱에서 처리
case 'TOKEN_REFRESH_FAILED':
  clear();  // 인증 정보 삭제
  navigation.reset({
    index: 1,
    routes: [{ name: 'Tabs' }, { name: 'Login' }],
  });
```

### READY
WebView 준비 완료 알림

```tsx
// 주입 스크립트에서 자동 호출
window.sendToApp({ type: 'READY' });

// 앱에서 처리
case 'READY':
  console.log('WebView is ready');
```

---

## 주입 스크립트 상세

### injectedJavaScriptBeforeContentLoaded (scripts.ts)

페이지 로드 **전**에 실행되는 스크립트입니다.

#### 1. 토큰 주입
```javascript
var token = '앱에서_전달받은_토큰';
if (token) {
  localStorage.setItem('accessToken', token);
}
```

#### 2. 앱 환경 표시
```javascript
window.isNativeApp = true;
```

#### 3. 헬퍼 함수 등록
```javascript
window.sendToApp = function(message) {
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
};
```

#### 4. 콘솔 인터셉터
```javascript
['log', 'info', 'warn', 'error'].forEach(function(level) {
  var original = console[level];
  console[level] = function() {
    original.apply(console, arguments);
    window.sendToApp({ type: 'LOG', level, args: [...arguments] });
  };
});
```

#### 5. 링크 인터셉터
내부 링크 클릭 시 WebView 내부 이동 대신 네이티브 네비게이션으로 처리합니다.

```javascript
document.addEventListener('click', function(e) {
  // <a> 태그 찾기
  // 같은 origin의 내부 링크면 가로채기
  e.preventDefault();
  window.sendToApp({ type: 'NAVIGATE', path: path });
}, true);
```

> **참고**: `data-no-intercept` 속성이 있는 링크는 가로채지 않습니다.

### injectedJsForNoZoom (scripts.ts)

페이지 로드 **후**에 실행되는 스크립트입니다.

#### 1. 줌 방지
```javascript
// viewport 설정
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

// 핀치 줌 방지
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 더블탭 줌 방지
document.addEventListener('touchend', (e) => {
  if (now - lastTouchEnd <= 300) e.preventDefault();
});
```

#### 2. 콘솔 인터셉터 재설정
Next.js hydration 후 콘솔 인터셉터가 초기화될 수 있어 다시 설정합니다.

---

## Android 뒤로가기 처리

Android 하드웨어 뒤로가기 버튼을 처리합니다.

```tsx
useFocusEffect(
  useCallback(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();  // WebView 내부 뒤로가기
        return true;  // 이벤트 소비
      }
      return false;  // 기본 동작 (앱 종료 또는 네이티브 뒤로가기)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack])
);
```

---

## Pull-to-Refresh

### iOS
```tsx
<WebView pullToRefreshEnabled />
```

### Android
ScrollView로 감싸서 RefreshControl 사용

```tsx
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  <WebView nestedScrollEnabled />
</ScrollView>
```

---

## 에러 처리

로드 실패 시 에러 화면을 표시하고 재시도 버튼을 제공합니다.

```tsx
onError={(e) => setError(`로드 실패: ${e.nativeEvent.description}`)}
onHttpError={(e) => setError(`HTTP 에러: ${e.nativeEvent.statusCode}`)}

{error && (
  <View style={styles.errorContainer}>
    <Text>{error}</Text>
    <TouchableOpacity onPress={() => {
      setError(null);
      webViewRef.current?.reload();
    }}>
      <Text>다시 시도</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## 웹에서 네이티브 기능 사용하기

### native-bridge.ts 사용 예시

```tsx
import {
  isNativeApp,
  navigate,
  requestGoBack,
  requestToast,
  requestSetTheme,
  syncUserToNative,
} from '@/lib/native-bridge';

// 앱 환경인지 확인
if (isNativeApp()) {
  // 페이지 이동
  navigate({ path: '/pet/123' });

  // 네이티브 화면으로 이동
  navigate({ screen: 'Login' });

  // 뒤로가기
  requestGoBack();

  // 토스트 표시
  requestToast('저장되었습니다', 'success');

  // 테마 변경
  requestSetTheme('dark');

  // 유저 정보 동기화
  syncUserToNative(user);
}
```

### 링크 인터셉터 우회

특정 링크가 네이티브 네비게이션으로 처리되지 않도록 하려면:

```html
<a href="/external-page" data-no-intercept>외부 링크</a>
```

---

## 주의사항

1. **토큰 동기화**: 앱에서 로그인 후 WebView 로드 시 토큰이 자동 주입됩니다. 웹에서 로그인/로그아웃 시 앱과 동기화해야 합니다.

2. **네비게이션 일관성**: 웹 내부 라우팅(`router.push`)과 네이티브 네비게이션(`navigation.push`)이 혼용되면 히스토리가 꼬일 수 있습니다. 가능하면 `native-bridge.ts`의 `navigate()`를 사용하세요.

3. **콘솔 로그**: 프로덕션에서는 민감한 정보가 로그에 포함되지 않도록 주의하세요.

4. **링크 인터셉터**: 내부 링크는 자동으로 가로채지만, 외부 링크나 특수한 경우 `data-no-intercept` 속성을 사용하세요.
