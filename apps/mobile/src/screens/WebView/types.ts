import { ThemeMode } from '@/store/theme';
import { RootStackParamList, WebViewParams } from '@/types/navigation';

export type NavigateOptions = {
  replace?: boolean;
  popToTop?: boolean;
};

export type WebViewMessage =
  | { type: 'LOGOUT' }
  | {
      type: 'NAVIGATE';
      path?: string;
      screen?: keyof RootStackParamList;
      params?: object;
      options?: NavigateOptions;
    }
  | { type: 'GO_BACK' }
  | { type: 'POP_TO_ROOT' }
  | { type: 'RESET_TO_HOME' }
  | { type: 'READY' }
  | { type: 'LOG'; level: 'log' | 'info' | 'warn' | 'error'; args: unknown[] }
  | { type: 'TOKEN_REFRESH_FAILED' }
  | { type: 'SET_USER_DATA'; user: unknown }
  | { type: 'SET_ACCESS_TOKEN'; token: string }
  | { type: 'SET_THEME'; theme: ThemeMode }
  | {
      type: 'TOAST';
      message: string;
      variant: 'success' | 'error' | 'info' | 'warning';
    }
  | { type: 'SET_PULL_TO_REFRESH'; enabled: boolean }
  | { type: 'SET_TOP_BAR_VISIBLE'; visible: boolean }
  | { type: 'SHOW_LOADING' }
  | { type: 'HIDE_LOADING' };

export type WebViewRouteParams = {
  WebView: WebViewParams | undefined;
};

export interface WebViewScreenProps {
  initialPath?: string;
  backgroundColor?: string;
}
