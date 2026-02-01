import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
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
import { useNavigationStore } from '@/store/navigation';
import { RootStackNavigationProp } from '@/types/navigation';
import Config from '@/utils/config';
import LottieLoading from '@/components/common/LottieLoading';
import TopBar from '@/components/common/TopBar';
import Toast from '@/components/common/Toast';
import Loading from '@/components/common/Loading';
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
  const [isAtTop, setIsAtTop] = useState(true); // WebView 스크롤 위치 추적
  const [pullToRefreshEnabled, setPullToRefreshEnabled] = useState(true); // 기본 활성화
  const [pullToRefreshManuallyDisabled, setPullToRefreshManuallyDisabled] =
    useState(false); // 웹에서 명시적으로 비활성화한 경우
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [topBarVisible, setTopBarVisible] = useState(true); // TopBar 표시 여부
  const insets = useSafeAreaInsets();

  const accessToken = useAuthStore(state => state.accessToken);
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
  const showTopBar = isPushed && !hideTopBar && topBarVisible;

  if (__DEV__) {
    console.log('[WebView] Loading URL:', webViewUrl);
  }

  // 페이지 로드 전에 실행되는 스크립트 (매 페이지마다 실행됨)
  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => createInjectedJavaScriptBeforeContentLoaded(accessToken),
    [accessToken],
  );

  // 테마 변경 시 WebView에 메시지 전송
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'THEME_CHANGE', theme }),
      );
    }
  }, [theme]);

  // 컴포넌트 언마운트 시 로딩 닫기
  useEffect(() => {
    return () => {
      Loading.close();
    };
  }, []);

  // initialPath를 route name으로 매핑
  const getRouteNameFromPath = (path: string): string => {
    // 쿼리 파라미터와 해시 제거
    const pathname = path.split(/[?#]/)[0];

    if (pathname === '/' || pathname === '') return 'Home';
    if (pathname === '/pet') return 'Home'; // Admin 모드의 Home
    if (pathname === '/hatching') return 'Hatching';
    if (pathname === '/adoption') return 'Adoption';
    if (pathname === '/settings') return 'Settings';
    return pathname;
  };

  // 스크롤 투 탑 트리거 감지
  const scrollToTopTrigger = useNavigationStore(
    state => state.scrollToTopTrigger[getRouteNameFromPath(initialPath)],
  );

  useEffect(() => {
    if (scrollToTopTrigger && webViewRef.current) {
      // WebView에 스크롤 투 탑 JS 주입
      webViewRef.current.injectJavaScript(`
        window.scrollTo({ top: 0, behavior: 'smooth' });
        true;
      `);
    }
  }, [scrollToTopTrigger]);

  // 웹에서 앱으로 오는 메시지 처리
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'LOGOUT':
          clear();
          navigation.reset({
            index: 1,
            routes: [{ name: 'Tabs' }, { name: 'Login' }],
          });
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
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          break;
        case 'POP_TO_ROOT':
          // 기존 화면 유지하며 홈으로 이동 (펫 등록 등 일반적인 경우)
          navigation.popToTop();
          break;
        case 'RESET_TO_HOME':
          // 홈을 새로 마운트하여 최신 토큰으로 로드 (회원가입 등 토큰 동기화 필요한 경우)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs', key: `tabs-${Date.now()}` }],
          });
          break;
        case 'READY':
          console.log('WebView is ready');
          break;
        case 'TOKEN_REFRESH_FAILED':
          clear();
          navigation.reset({
            index: 1,
            routes: [{ name: 'Tabs' }, { name: 'Login' }],
          });
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
        case 'TOAST':
          Toast.show(message.message);
          break;
        case 'SET_THEME':
          setTheme(message.theme);
          break;
        case 'SET_PULL_TO_REFRESH':
          setPullToRefreshManuallyDisabled(!message.enabled);
          setPullToRefreshEnabled(message.enabled);
          break;
        case 'SET_TOP_BAR_VISIBLE':
          setTopBarVisible(message.visible);
          break;
        case 'SHOW_LOADING':
          Loading.show();
          break;
        case 'HIDE_LOADING':
          Loading.close();
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

  // TopBar 뒤로가기 버튼 처리 (WebView 내부 히스토리 우선)
  const handleTopBarBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [canGoBack, navigation]);

  // Pull-to-refresh 핸들러
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    // WebView가 로드 완료되면 refreshing을 false로 설정
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // WebView 스크롤 위치 추적 (Android)
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    // 스크롤이 최상단(y <= 0)이면 RefreshControl 활성화
    setIsAtTop(contentOffset.y <= 0);
  }, []);

  // 로딩 진행률 처리
  const handleLoadProgress = useCallback(
    (event: { nativeEvent: { progress: number } }) => {
      const progress = event.nativeEvent.progress;
      setLoadingProgress(progress);
      setIsLoading(progress < 1);
    },
    [],
  );

  // 동적 컨테이너 스타일
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom:
          Platform.OS === 'ios' ? insets.bottom : isPushed ? insets.bottom : 0,
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
      {showTopBar && <TopBar onBackPress={handleTopBarBackPress} />}
      {/* 로딩 Progress Bar */}
      {isLoading && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: `${loadingProgress * 100}%`,
                backgroundColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
              },
            ]}
          />
        </View>
      )}
      {Platform.OS === 'android' ? (
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          scrollEnabled={isAtTop}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              enabled={pullToRefreshEnabled && isAtTop}
              colors={[theme === 'dark' ? '#fff' : '#000']}
              progressBackgroundColor={colors.background}
            />
          }
        >
          <WebView
            ref={webViewRef}
            source={{ uri: webViewUrl }}
            style={[styles.webview, { backgroundColor: colors.background }]}
            injectedJavaScriptBeforeContentLoaded={
              injectedJavaScriptBeforeContentLoaded
            }
            injectedJavaScript={injectedJsForNoZoom}
            onMessage={handleMessage}
            onNavigationStateChange={navState => {
              setCanGoBack(navState.canGoBack);
            }}
            onLoadStart={() => {
              setIsLoading(true);
              setLoadingProgress(0);
            }}
            onLoadEnd={() => {
              setRefreshing(false);
              setIsLoading(false);
              if (!pullToRefreshManuallyDisabled) {
                setPullToRefreshEnabled(true);
              }
            }}
            onLoadProgress={handleLoadProgress}
            onScroll={handleScroll}
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
          style={[styles.webview, { backgroundColor: colors.background }]}
          injectedJavaScriptBeforeContentLoaded={
            injectedJavaScriptBeforeContentLoaded
          }
          injectedJavaScript={injectedJsForNoZoom}
          onMessage={handleMessage}
          onNavigationStateChange={navState => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            setIsLoading(true);
            setLoadingProgress(0);
          }}
          onLoadEnd={() => {
            setRefreshing(false);
            setIsLoading(false);
            if (!pullToRefreshManuallyDisabled) {
              setPullToRefreshEnabled(true);
            }
          }}
          onLoadProgress={handleLoadProgress}
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
          pullToRefreshEnabled={pullToRefreshEnabled}
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
          {/* <Text style={errorUrlStyle}>URL: {webViewUrl}</Text> */}
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
  progressBarContainer: {
    height: 2,
    backgroundColor: 'transparent',
    width: '100%',
  },
  progressBar: {
    height: '100%',
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
