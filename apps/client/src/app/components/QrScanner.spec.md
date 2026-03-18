# QR Scanner 구현 스펙

## 아키텍처

```
[버튼 클릭] → getUserMedia (유저 제스처) → stream 획득 → Dialog 열기 → QrScanner에 stream 전달
                                                                         ↓
[네이티브 앱] → sendToNative("OPEN_QR_SCANNER") → 네이티브 카메라 스캐너 (react-native-vision-camera)
```

## 환경별 동작

| 환경 | 방식 | 파일 |
|------|------|------|
| 네이티브 앱 (iOS/Android) | `react-native-vision-camera` + `useCodeScanner` | `apps/mobile/src/screens/QrScanner/index.tsx` |
| 모바일 웹 (Safari, Android Chrome) | `getUserMedia` + `jsQR` | `apps/client/src/app/components/QrScanner.tsx` |
| iOS Chrome | **미지원** — 버튼 비노출 (`CriOS` UA 감지) | `QrScannerButton.tsx` |
| 데스크톱 웹 | 동일 (getUserMedia + jsQR) | `QrScanner.tsx` |

## 핵심 설계 결정

### 1. getUserMedia를 버튼 클릭 핸들러에서 호출
- `useEffect`에서 호출하면 유저 제스처 체인이 끊겨 `NotAllowedError` 발생
- `QrScannerButton.openQrScanner()` (onClick) → `getUserMedia` → stream을 props로 전달

### 2. jsQR 선택 이유
- `html5-qrcode`: 모바일 브라우저 호환성 문제 ("Camera streaming is not supported")
- `BarcodeDetector`: iOS Safari 미지원
- `jsQR`: 순수 JS, 모든 브라우저 동작, ~45KB

### 3. iOS Chrome 비노출
- iOS의 모든 서드파티 브라우저는 WKWebView 사용
- WKWebView는 `navigator.mediaDevices.getUserMedia`를 지원하지 않음
- `CriOS` UA 패턴으로 감지하여 버튼 자체를 렌더링하지 않음

## 성능 최적화

| 항목 | 값 | 이유 |
|------|-----|------|
| 스캔 루프 | `requestAnimationFrame` + 80ms throttle | 브라우저 렌더 사이클 동기화 + ~12fps 스캔 |
| 디코딩 해상도 | 320x320px | 카메라 원본 대비 처리량 대폭 감소, QR 인식에 충분 |
| canvas 옵션 | `willReadFrequently: true` | `getImageData` 반복 호출 시 GPU→CPU 전송 최적화 |
| 스캔 성공 시 | rAF 루프 즉시 `return` 종료 | 불필요한 프레임 처리 제거 |

## QR URL 파싱 규칙 (`extractPathFromQrUrl`)

| 입력 | 결과 |
|------|------|
| `https://breedy.kr/pet/123` | `/pet/123` |
| `https://www.breedy.kr/pet/123?tab=info` | `/pet/123?tab=info` |
| `https://google.com/something` | `null` (프로덕션) / 경로 추출 (개발) |
| `/pet/123` | `/pet/123` (상대 경로 허용) |
| `hello world` | `null` |

- 개발 환경(`NODE_ENV=development`): 도메인 체크 우회 (localhost, IP 주소 QR 지원)
- 네이티브 모바일(`__DEV__`): 동일하게 도메인 체크 우회

## stream 생명주기

```
획득: QrScannerButton onClick → getUserMedia
해제 (3곳 중 하나):
  1. 스캔 성공 → handleScanSuccess → stream.stop() → router.push → onClose
  2. 다이얼로그 닫기 → onOpenChange(false) → stream.stop() → close
  3. 컴포넌트 언마운트 → useEffect cleanup → stream.stop()
```

## 파일 구조

```
apps/client/src/app/components/
├── QrScannerButton.tsx   # 플로팅 버튼 + stream 획득 + Dialog 오픈
├── QrScanner.tsx          # video + canvas + jsQR 스캔 루프
└── AppShell.tsx           # 버튼 배치 (모바일만, 가계도/쇼케이스/로그인 제외)

apps/mobile/src/screens/QrScanner/
└── index.tsx              # 네이티브 카메라 스캐너 (react-native-vision-camera)
```

## 버튼 위치

- 네이티브: `right-4 bottom-24` (하단 네비 위)
- 모바일 웹: `right-4 bottom-[92px]` (AddPetButton 위)

## 주의사항

- **HTTPS 필수**: `getUserMedia`는 Secure Context에서만 동작. 개발 시 `pnpm --filter client dev:https` 또는 mkcert 사용
- **iOS Chrome 미지원**: WKWebView 제한으로 카메라 API 사용 불가. 버튼 비노출로 대응
- **html5-qrcode 미사용**: package.json에 남아있으나 실제 사용하지 않음. 정리 필요
