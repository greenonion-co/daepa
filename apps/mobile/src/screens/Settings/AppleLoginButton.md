# AppleLoginButton

Apple 소셜 로그인 버튼 컴포넌트입니다.

## 사용 라이브러리

- `@invertase/react-native-apple-authentication`

## 시퀀스 다이어그램

```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as 앱 (RN)
    participant iOS as iOS Native
    participant Apple as Apple 서버
    participant Server as 우리 서버

    User->>App: 버튼 클릭
    App->>iOS: appleAuth.performRequest()
    iOS->>User: Apple 로그인 UI 표시
    User->>iOS: Face ID / Touch ID 인증
    iOS->>Apple: 인증 요청
    Apple-->>iOS: identityToken, authorizationCode, nonce
    iOS-->>App: 토큰 반환
    App->>Server: authControllerAppleNative (토큰 전송)
    Server->>Apple: 토큰 검증
    Apple-->>Server: 검증 결과
    Note over Server: JWT refreshToken 생성
    Server-->>App: Set-Cookie: refreshToken (HTTP-only)
    Server-->>App: Response: { user, accessToken, status }
    App->>App: navigateByStatus()
    App-->>User: 화면 이동
```

## 플로우 다이어그램

```mermaid
flowchart TD
    A[버튼 클릭] --> B{isLoading?}
    B -->|Yes| Z[무시]
    B -->|No| C[isLoading = true]
    C --> D{Platform?}
    D -->|Android| E[Toast: 미지원]
    D -->|iOS| F[Loading 표시]
    F --> G[appleAuth.performRequest]
    G --> H{identityToken 존재?}
    H -->|No| I[Toast: 로그인 실패]
    H -->|Yes| J{authorizationCode & nonce 존재?}
    J -->|No| I
    J -->|Yes| K[서버 API 호출]
    K --> L[authControllerAppleNative]
    L --> M[navigateByStatus]
    M --> N[화면 이동]

    E --> O[isLoading = false]
    I --> O
    N --> O
    O --> P[Loading 닫기]
```

## 플로우 설명

### iOS

1. `appleAuth.performRequest()`로 Apple 인증 요청 (클라이언트 → Apple)
   - `requestedOperation`: LOGIN
   - `requestedScopes`: EMAIL
   - `nonceEnabled`: true
2. Apple이 `identityToken`, `authorizationCode`, `nonce` 반환 (클라이언트로)
3. 서버 API (`authControllerAppleNative`) 호출 (클라이언트 → 우리 서버)
4. 서버에서 Apple에 토큰 검증 (우리 서버 → Apple)
5. 서버가 JWT refreshToken 생성 후 **HTTP-only 쿠키**로 설정
6. 응답 body로 `{ user, accessToken, status }` 반환
7. `navigateByStatus()`로 응답 상태에 따라 화면 이동

### Android

- 현재 미지원 (Toast 메시지 표시)

## 서버 요청 데이터

```typescript
// 클라이언트 → 서버
{
  identityToken: string;
  email?: string;
  authorizationCode?: string;
  nonce?: string;
}
```

## 서버 응답 데이터

```typescript
// 서버 → 클라이언트
// Header: Set-Cookie: refreshToken=xxx (HTTP-only, 180일)
// Body:
{
  ...user,           // 사용자 정보
  accessToken: string;
  status: string;    // 사용자 상태
}
```

## 에러 처리

- 중복 클릭 방지를 위한 `isLoading` 상태 관리
- `TouchableOpacity`에 `disabled={isLoading}` 적용

## 파일 위치

`src/screens/Settings/AppleLoginButton.tsx`
