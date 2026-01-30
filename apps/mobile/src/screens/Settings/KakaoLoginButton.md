# KakaoLoginButton

카카오 소셜 로그인 버튼 컴포넌트입니다.

## 사용 라이브러리

- `@react-native-seoul/kakao-login`

## 시퀀스 다이어그램

```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as 앱 (RN)
    participant KakaoSDK as Kakao SDK
    participant Kakao as Kakao 서버
    participant Server as 우리 서버

    User->>App: 버튼 클릭
    App->>KakaoSDK: login()
    KakaoSDK->>User: 카카오 로그인 UI 표시
    User->>KakaoSDK: 로그인 정보 입력
    KakaoSDK->>Kakao: 인증 요청
    Kakao-->>KakaoSDK: accessToken, refreshToken
    KakaoSDK-->>App: 로그인 결과
    App->>KakaoSDK: getProfile()
    KakaoSDK->>Kakao: 프로필 조회
    Kakao-->>KakaoSDK: email, id 등
    KakaoSDK-->>App: 프로필 정보
    App->>Server: authControllerKakaoNative (email, id, refreshToken)
    Server->>Kakao: 토큰 검증 (선택적)
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
    C --> D[Loading 표시]
    D --> E[login - 카카오 로그인]
    E --> F[getProfile - 프로필 조회]
    F --> G{email 존재?}
    G -->|No| H[Toast: 오류 발생]
    G -->|Yes| I[서버 API 호출]
    I --> J[authControllerKakaoNative]
    J --> K[navigateByStatus]
    K --> L[화면 이동]

    H --> M[isLoading = false]
    L --> M
    M --> N[Loading 닫기]

    E -->|Error| O{SdkError?}
    O -->|Yes| M
    O -->|No| P[Toast: 로그인 실패]
    P --> M
```

## 플로우 설명

1. `login()`으로 카카오 로그인 수행 (클라이언트 → Kakao)
2. `getProfile()`로 사용자 정보 조회 (클라이언트 → Kakao)
3. 서버 API (`authControllerKakaoNative`) 호출 (클라이언트 → 우리 서버)
4. 서버가 JWT refreshToken 생성 후 **HTTP-only 쿠키**로 설정
5. 응답 body로 `{ user, accessToken, status }` 반환
6. `navigateByStatus()`로 응답 상태에 따라 화면 이동

## 서버 요청 데이터

```typescript
// 클라이언트 → 서버
{
  email: string;
  id: string;
  refreshToken: string;  // 카카오 refreshToken
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

- `KakaoSDKCommon.SdkError` 포함 에러는 사용자 취소로 간주하여 Toast 미표시
- 중복 클릭 방지를 위한 `isLoading` 상태 관리
- `TouchableOpacity`에 `disabled={isLoading}` 적용

## 파일 위치

`src/screens/Settings/KakaoLoginButton.tsx`
