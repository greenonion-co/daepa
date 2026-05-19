import type { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import type { RootStackParamList } from '@/types/navigation';

export const APP_LINK_HOST = 'breedy.kr';
export const CUSTOM_SCHEME = 'breedy';

/**
 * Universal Link(`https://breedy.kr/...`) / App Link / Custom Scheme(`breedy://...`)
 * 전부 이 prefix와 매칭되어 linking 시스템이 처리한다.
 *
 * 카카오 OAuth 콜백 `kakao{KEY}://oauth`는 prefix와 일치하지 않으므로
 * React Navigation이 자동으로 무시하고 기존 카카오 SDK 핸들러가 처리한다.
 */
export const linkingPrefixes = [
  `https://${APP_LINK_HOST}`,
  `${CUSTOM_SCHEME}://`,
];

/**
 * 모든 URL은 Main(WebView) 스크린의 path param으로 위임된다.
 * 웹 클라이언트가 동일 path를 렌더하므로 RN 쪽에서 페이지별 분기는 불필요.
 *
 * 예) `https://breedy.kr/pet/abc?ref=share` → `Main { path: '/pet/abc?ref=share' }`
 */
export function normalizePath(rawPath: string): string {
  if (!rawPath) return '/';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: linkingPrefixes,

  getStateFromPath: path => {
    const normalized = normalizePath(path);
    return {
      routes: [
        { name: 'Tabs' as const, params: undefined },
        { name: 'Main' as const, params: { path: normalized } },
      ],
      index: 1,
    };
  },

  getInitialURL: async () => {
    return Linking.getInitialURL();
  },

  subscribe: listener => {
    const sub = Linking.addEventListener('url', ({ url }) => listener(url));
    return () => sub.remove();
  },
};
