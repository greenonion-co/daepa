# Haptic Feedback 구현 가이드

> Commit: `75d8ad42d0f4ebdd37e0c53316af871e977f9a40`

## 개요

React Native에서 iOS/Android 네이티브 햅틱 피드백을 사용하기 위한 구현입니다.

- **iOS**: `UIImpactFeedbackGenerator`, `UISelectionFeedbackGenerator`, `UINotificationFeedbackGenerator` 사용
- **Android**: `Vibration` API 사용

## 파일 구조

```
apps/mobile/
├── ios/
│   ├── HapticFeedback.swift        # iOS 네이티브 모듈
│   ├── HapticFeedback.m            # React Native 브릿지
│   └── mobile-Bridging-Header.h    # Swift-ObjC 브릿징 헤더
└── src/
    └── utils/
        └── haptic.ts               # JS/TS 유틸리티 함수
```

## iOS 네이티브 모듈

### HapticFeedback.swift

```swift
import UIKit

@objc(HapticFeedback)
class HapticFeedback: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  /// 임팩트 햅틱 피드백 (light, medium, heavy, soft, rigid)
  @objc
  func impact(_ style: String) {
    DispatchQueue.main.async {
      let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle

      switch style {
      case "light":
        feedbackStyle = .light
      case "medium":
        feedbackStyle = .medium
      case "heavy":
        feedbackStyle = .heavy
      case "soft":
        if #available(iOS 13.0, *) {
          feedbackStyle = .soft
        } else {
          feedbackStyle = .light
        }
      case "rigid":
        if #available(iOS 13.0, *) {
          feedbackStyle = .rigid
        } else {
          feedbackStyle = .heavy
        }
      default:
        feedbackStyle = .light
      }

      let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
      generator.prepare()
      generator.impactOccurred()
    }
  }

  /// 선택 햅틱 피드백 (탭/선택 시 사용)
  @objc
  func selection() {
    DispatchQueue.main.async {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
  }

  /// 알림 햅틱 피드백 (success, warning, error)
  @objc
  func notification(_ type: String) {
    DispatchQueue.main.async {
      let feedbackType: UINotificationFeedbackGenerator.FeedbackType

      switch type {
      case "success":
        feedbackType = .success
      case "warning":
        feedbackType = .warning
      case "error":
        feedbackType = .error
      default:
        feedbackType = .success
      }

      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(feedbackType)
    }
  }
}
```

### HapticFeedback.m (React Native Bridge)

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HapticFeedback, NSObject)

RCT_EXTERN_METHOD(impact:(NSString *)style)
RCT_EXTERN_METHOD(selection)
RCT_EXTERN_METHOD(notification:(NSString *)type)

@end
```

## TypeScript 유틸리티

### haptic.ts

```typescript
import { NativeModules, Platform, Vibration } from 'react-native';

const { HapticFeedback } = NativeModules;

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
export type NotificationType = 'success' | 'warning' | 'error';

/**
 * 임팩트 햅틱 피드백
 * iOS: UIImpactFeedbackGenerator 사용
 * Android: 짧은 진동 사용
 */
export const impactHaptic = (style: ImpactStyle = 'light') => {
  if (Platform.OS === 'ios' && HapticFeedback) {
    HapticFeedback.impact(style);
  } else if (Platform.OS === 'android') {
    const duration = style === 'heavy' || style === 'rigid' ? 10 : 5;
    Vibration.vibrate(duration);
  }
};

/**
 * 선택 햅틱 피드백 (탭/선택 시 사용)
 * iOS: UISelectionFeedbackGenerator 사용
 * Android: 아주 짧은 진동 사용
 */
export const selectionHaptic = () => {
  if (Platform.OS === 'ios' && HapticFeedback) {
    HapticFeedback.selection();
  } else if (Platform.OS === 'android') {
    Vibration.vibrate(1);
  }
};

/**
 * 알림 햅틱 피드백
 * iOS: UINotificationFeedbackGenerator 사용
 * Android: 진동 패턴 사용
 */
export const notificationHaptic = (type: NotificationType = 'success') => {
  if (Platform.OS === 'ios' && HapticFeedback) {
    HapticFeedback.notification(type);
  } else if (Platform.OS === 'android') {
    switch (type) {
      case 'success':
        Vibration.vibrate([0, 5, 50, 5]);
        break;
      case 'warning':
        Vibration.vibrate([0, 10, 100, 10]);
        break;
      case 'error':
        Vibration.vibrate([0, 15, 50, 15, 50, 15]);
        break;
    }
  }
};
```

## 사용법

```typescript
import { impactHaptic, selectionHaptic, notificationHaptic } from '@/utils/haptic';

// 버튼 탭 시
const handlePress = () => {
  impactHaptic('light');
  // ...
};

// 리스트 아이템 선택 시
const handleSelect = () => {
  selectionHaptic();
  // ...
};

// 작업 완료/실패 시
const handleComplete = () => {
  notificationHaptic('success');
  // ...
};

const handleError = () => {
  notificationHaptic('error');
  // ...
};
```

## 햅틱 스타일 가이드

| 타입 | 스타일 | 사용 사례 |
|------|--------|----------|
| Impact | `light` | 가벼운 탭, 토글 |
| Impact | `medium` | 일반 버튼 탭 |
| Impact | `heavy` | 강조 액션, 삭제 |
| Impact | `soft` | 부드러운 전환 (iOS 13+) |
| Impact | `rigid` | 딱딱한 느낌의 피드백 (iOS 13+) |
| Selection | - | 리스트 선택, 스와이프 |
| Notification | `success` | 작업 성공 |
| Notification | `warning` | 경고 알림 |
| Notification | `error` | 오류 발생 |

## Android 권한

`AndroidManifest.xml`에 진동 권한이 필요합니다:

```xml
<uses-permission android:name="android.permission.VIBRATE" />
```

## 주의사항

1. **iOS 시뮬레이터**: 햅틱 피드백이 동작하지 않습니다. 실제 기기에서 테스트하세요.
2. **iOS 13 미만**: `soft`, `rigid` 스타일은 각각 `light`, `heavy`로 폴백됩니다.
3. **Main Queue**: iOS에서 UI 관련 작업은 반드시 Main Queue에서 실행해야 합니다.
