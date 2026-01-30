import { NativeModules, Platform, Vibration } from 'react-native';

const { HapticFeedback } = NativeModules;

// 디버그: 네이티브 모듈 확인
console.log('[Haptic] HapticFeedback module:', HapticFeedback);
console.log('[Haptic] Available NativeModules:', Object.keys(NativeModules));

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
export type NotificationType = 'success' | 'warning' | 'error';

/**
 * 임팩트 햅틱 피드백
 * iOS: UIImpactFeedbackGenerator 사용
 * Android: 짧은 진동 사용
 */
export const impactHaptic = (style: ImpactStyle = 'light') => {
  console.log('[Haptic] impactHaptic called with style:', style, 'HapticFeedback:', !!HapticFeedback);
  if (Platform.OS === 'ios' && HapticFeedback) {
    console.log('[Haptic] Calling native impact');
    HapticFeedback.impact(style);
  } else if (Platform.OS === 'android') {
    // Android는 스타일에 따라 진동 강도 조절
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
    // Android는 타입에 따라 다른 진동 패턴
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
