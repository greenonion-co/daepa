import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AppConfig from './src/utils/config';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import Navigation from './src/navigation';
import {
  flushPendingNavigation,
  navigationRef,
} from './src/navigation/navigationRef';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from './src/utils/apiSetup';
import { useAuthStore } from './src/store/auth';
import { userControllerGetUserProfile } from '@repo/api-client';
import Toast from '@/components/common/Toast';
import Loading from '@/components/common/Loading';
import Popup from '@/components/common/Popup';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import usePushNotification from './src/hooks/usePushNotification';
import NotificationBanner from './src/components/NotificationBanner';
import { useNotificationStore } from './src/store/notification';
import { debugAuthState } from './src/utils/debugAuth';

// Google Sign-In 초기화
GoogleSignin.configure({
  iosClientId: Config.GOOGLE_CLIENT_ID_IOS,
  webClientId: Config.GOOGLE_CLIENT_ID_WEB, // Android용
});

const queryClient = new QueryClient();

// 개발 환경 여부 확인 (로컬 IP 또는 localhost 사용 시)
const serverUrl = AppConfig.SERVER_BASE_URL ?? '';
const isDev =
  serverUrl.includes('192.168') ||
  serverUrl.includes('localhost') ||
  serverUrl.includes('10.0.');

function App() {
  const [hydrated, setHydrated] = useState(
    useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  // 푸시 알림 초기화
  usePushNotification();

  // 인앱 알림 배너
  const { visible, notification, hideNotification } = useNotificationStore();

  // 백그라운드 알림 클릭 처리
  const pendingNotificationId = useNotificationStore(
    state => state.pendingNotificationId,
  );
  const clearPendingNotificationId = useNotificationStore(
    state => state.clearPendingNotificationId,
  );
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 알림 배너 클릭 시 해당 알림으로 이동
  const handleNotificationPress = useCallback(() => {
    if (notification?.notificationId && navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        path: `/notifications?id=${notification.notificationId}&_nativeTopBar=1`,
      });
    }
  }, [notification?.notificationId]);

  useEffect(() => {
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });
    return () => {
      unsub?.();
    };
  }, []);

  // accessToken 변경 시 자동으로 user 정보 업데이트
  const accessToken = useAuthStore(state => state.accessToken);
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    if (hydrated) {
      setupApiClient();
      BootSplash.hide({ fade: true });

      // 개발 모드에서 인증 상태 디버그 출력
      if (__DEV__) {
        debugAuthState();
      }
    }
  }, [hydrated]);

  // accessToken이 변경되면 user 정보를 자동으로 가져옴
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accessToken && hydrated) {
        try {
          const { data } = await userControllerGetUserProfile();
          setUser(data.data);
        } catch (error) {
          if (__DEV__) {
            console.error('Failed to fetch user profile:', error);
          }
        }
      } else if (!accessToken) {
        setUser(null);
      }
    };
    fetchUserProfile();
  }, [accessToken, hydrated, setUser]);

  // 백그라운드 알림 클릭으로 앱 열렸을 때 해당 알림으로 이동
  useEffect(() => {
    if (isNavigationReady && pendingNotificationId && navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        path: `/notifications?id=${pendingNotificationId}&_nativeTopBar=1`,
      });
      clearPendingNotificationId();
    }
  }, [isNavigationReady, pendingNotificationId, clearPendingNotificationId]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={styles.container}>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              setIsNavigationReady(true);
              // ready 이전에 인터셉터 등이 요청한 navigation 액션(resetToLogin 등)을 실행
              flushPendingNavigation();
            }}
          >
            <Navigation />
          </NavigationContainer>
          <Toast ref={Toast.setRef} />
          <Loading ref={Loading.setRef} />
          <Popup ref={Popup.setRef} />
          <NotificationBanner
            visible={visible}
            title={notification?.title ?? ''}
            body={notification?.body ?? ''}
            onPress={handleNotificationPress}
            onDismiss={hideNotification}
          />
          {isDev && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV</Text>
            </View>
          )}
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  devBadge: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    opacity: 0.9,
  },
  devBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default App;
