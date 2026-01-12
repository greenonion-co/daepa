import React, { useRef, useCallback, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, themeColors } from '@/store/theme';
import { RootStackNavigationProp } from '@/types/navigation';
import Config from '@/utils/config';
import LottieLoading from '@/components/common/LottieLoading';
import TopBar from '@/components/common/TopBar';
import Toast from '@/components/common/Toast';
import {
  WebViewMessage,
  WebViewRouteParams,
  WebViewScreenProps,
} from './types';
import {
  injectedJsForNoZoom,
  createInjectedJavaScriptBeforeContentLoaded,
} from './scripts';

const CLIENT_BASE_URL = Config.CLIENT_BASE_URL;

const WebViewScreen: React.FC<WebViewScreenProps> = ({
  initialPath: propPath,
}) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<WebViewRouteParams, 'WebView'>>();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const accessToken = useAuthStore(state => state.accessToken);
  const setUser = useAuthStore(state => state.setUser);
  const clear = useAuthStore(state => state.clear);

  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  const colors = themeColors[theme];

  // prop이 있으면 prop 사용, 없으면 route params 사용
  const initialPath = propPath || route.params?.path || '/';
  const webViewUrl = `${CLIENT_BASE_URL}${initialPath}`;

  // propPath가 없으면 navigation.push로 열린 것 (TopBar 표시)
  const isPushed = !propPath && !!route.params?.path;

  // URL 파라미터에서 _hideTopBar 체크
  const hideTopBar = initialPath.includes('_hideTopBar=1');
  const showTopBar = isPushed && !hideTopBar;

  console.log('[WebView] Loading URL:', webViewUrl);
  console.log('[WebView] CLIENT_BASE_URL:', CLIENT_BASE_URL);

  // 페이지 로드 전에 실행되는 스크립트 (매 페이지마다 실행됨)
  const injectedJavaScriptBeforeContentLoaded =
    createInjectedJavaScriptBeforeContentLoaded(accessToken);

  // 웹에서 앱으로 오는 메시지 처리
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'LOGOUT':
          clear();
          navigation.replace('Login');
          break;
        case 'NAVIGATE': {
          const { path, screen, params, options } = message;

          // 옵션: 먼저 스택 최상위로 이동
          if (options?.popToTop) {
            navigation.popToTop();
          }

          // 네이티브 화면 이동
          if (screen) {
            console.log('[WebView] Navigate to native screen:', screen);
            if (options?.replace) {
              navigation.replace(screen as any, params as any);
            } else {
              navigation.navigate(screen as any, params as any);
            }
          }
          // WebView 페이지 이동
          else if (path) {
            console.log('[WebView] Navigate to path:', path);
            const separator = path.includes('?') ? '&' : '?';
            const pathWithParam = `${path}${separator}_nativeTopBar=1`;

            if (options?.replace) {
              navigation.replace('Main', { path: pathWithParam });
            } else {
              navigation.push('Main', { path: pathWithParam });
            }
          }
          break;
        }
        case 'GO_BACK':
          if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
          }
          break;
        case 'POP_TO_ROOT':
          navigation.popToTop();
          break;
        case 'READY':
          console.log('WebView is ready');
          break;
        case 'TOKEN_REFRESH_FAILED':
          clear();

          break;
        case 'LOG': {
          const prefix = '[WebView]';
          switch (message.level) {
            case 'error':
              console.error(prefix, ...message.args);
              break;
            case 'warn':
              console.warn(prefix, ...message.args);
              break;
            case 'info':
              console.info(prefix, ...message.args);
              break;
            default:
              console.log(prefix, ...message.args);
          }

          // 개발 환경에서만 Toast로 표시
          if (__DEV__ && message.level === 'log') {
            const logContent = message.args
              .map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
              )
              .join(' ');
            Toast.show(`[${message.level}] ${logContent}`);
          }
          break;
        }
        case 'SET_USER_DATA':
          if (message.user) {
            setUser(message.user as Parameters<typeof setUser>[0]);
          }
          break;
        case 'TOAST':
          Toast.show(message.message);
          break;
        case 'SET_THEME':
          setTheme(message.theme);
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [canGoBack]),
  );

  // Pull-to-refresh 핸들러
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    // WebView가 로드 완료되면 refreshing을 false로 설정
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 동적 컨테이너 스타일
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        // 하단 탭바가 없는 경우(push된 화면)에만 paddingBottom 적용
        paddingTop: insets.top,
        paddingBottom: isPushed ? insets.bottom : 0,
        backgroundColor: colors.background,
      },
    ],
    [insets.top, insets.bottom, isPushed, colors.background],
  );

  // 동적 로딩 스타일
  const loadingStyle = useMemo(
    () => [styles.loadingContainer, { backgroundColor: colors.background }],
    [colors.background],
  );

  // 동적 에러 스타일
  const errorContainerStyle = useMemo(
    () => [styles.errorContainer, { backgroundColor: colors.background }],
    [colors.background],
  );

  const errorUrlStyle = useMemo(
    () => [styles.errorUrl, { color: theme === 'dark' ? '#999' : '#666' }],
    [theme],
  );

  const retryButtonStyle = useMemo(
    () => [
      styles.retryButton,
      { backgroundColor: theme === 'dark' ? '#fff' : '#000' },
    ],
    [theme],
  );

  const retryTextStyle = useMemo(
    () => [styles.retryText, { color: theme === 'dark' ? '#000' : '#fff' }],
    [theme],
  );

  return (
    <View style={containerStyle}>
      {showTopBar && <TopBar />}
      {Platform.OS === 'android' ? (
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme === 'dark' ? '#fff' : '#000']}
              progressBackgroundColor={colors.background}
            />
          }
        >
          <WebView
            ref={webViewRef}
            source={{ uri: webViewUrl }}
            style={styles.webview}
            injectedJavaScriptBeforeContentLoaded={
              injectedJavaScriptBeforeContentLoaded
            }
            injectedJavaScript={injectedJsForNoZoom}
            onMessage={handleMessage}
            onNavigationStateChange={navState => {
              setCanGoBack(navState.canGoBack);
            }}
            onLoadEnd={() => setRefreshing(false)}
            // 성능 및 기능 설정
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            // 캐시 설정
            cacheEnabled
            // ScrollView와 함께 사용할 때 스크롤 처리
            nestedScrollEnabled
            // 에러 처리
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setError(
                `로드 실패: ${nativeEvent.description || 'Unknown error'}`,
              );
            }}
            onHttpError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent.statusCode);
              setError(`HTTP 에러: ${nativeEvent.statusCode}`);
            }}
            renderLoading={() => (
              <View style={loadingStyle}>
                <LottieLoading status="loading" />
              </View>
            )}
          />
        </ScrollView>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={
            injectedJavaScriptBeforeContentLoaded
          }
          injectedJavaScript={injectedJsForNoZoom}
          onMessage={handleMessage}
          onNavigationStateChange={navState => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadEnd={() => setRefreshing(false)}
          // 성능 및 기능 설정
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          // 캐시 설정
          cacheEnabled
          // iOS Pull-to-refresh
          pullToRefreshEnabled
          // 에러 처리
          onError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setError(
              `로드 실패: ${nativeEvent.description || 'Unknown error'}`,
            );
          }}
          onHttpError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent.statusCode);
            setError(`HTTP 에러: ${nativeEvent.statusCode}`);
          }}
          renderLoading={() => (
            <View style={loadingStyle}>
              <LottieLoading status="loading" />
            </View>
          )}
        />
      )}
      {error && (
        <View style={errorContainerStyle}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={errorUrlStyle}>URL: {webViewUrl}</Text>
          <TouchableOpacity
            style={retryButtonStyle}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
          >
            <Text style={retryTextStyle}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default WebViewScreen;
