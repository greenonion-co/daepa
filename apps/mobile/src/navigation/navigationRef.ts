import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

/**
 * 모듈 레벨 navigation ref — 컴포넌트 트리 밖(axios 인터셉터 등)에서도
 * 네비게이션을 트리거할 수 있도록 공유.
 */
export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

/**
 * NavigationContainer가 아직 ready 되기 전에 navigation 액션이 요청될 수 있다.
 * 예: cold start 직후 만료된 토큰으로 API 호출 → 401 → onAuthError → resetToLogin이
 *     NavigationContainer.onReady보다 먼저 실행됨 → isReady()가 false라 액션이 유실.
 *
 * ready 이전에 들어온 마지막 액션을 보관했다가 `flushPendingNavigation()`에서 실행.
 * 중복 요청은 마지막 것만 유지 (reset이 여러 번 들어와도 최종 결과는 동일).
 */
let pendingAction: (() => void) | null = null;

const runOrQueue = (action: () => void) => {
  if (navigationRef.isReady()) {
    action();
    pendingAction = null;
  } else {
    pendingAction = action;
  }
};

/**
 * App.tsx의 NavigationContainer `onReady`에서 호출 — ready 이전에 쌓인 액션을 실행.
 */
export const flushPendingNavigation = () => {
  if (pendingAction && navigationRef.isReady()) {
    const action = pendingAction;
    pendingAction = null;
    action();
  }
};

/**
 * 인증 실패(refresh 실패·권한 부족) 시 Tabs + Login 스택으로 reset.
 * WebView의 TOKEN_REFRESH_FAILED 처리와 동일한 구조를 유지해 UX 일관성 확보.
 *
 * NavigationContainer가 아직 준비되지 않았으면 대기 큐에 저장 후 ready 시점에 실행.
 */
export const resetToLogin = () => {
  runOrQueue(() =>
    navigationRef.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'Login' }],
      }),
    ),
  );
};
