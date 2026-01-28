import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import Navigation from './src/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from './src/utils/apiSetup';
import { useAuthStore } from './src/store/auth';
import Toast from '@/components/common/Toast';
import Loading from '@/components/common/Loading';
import Popup from '@/components/common/Popup';
import { RootStackParamList } from '@/types/navigation';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import usePushNotification from './src/hooks/usePushNotification';
import NotificationBanner from './src/components/NotificationBanner';
import { useNotificationStore } from './src/store/notification';

// Google Sign-In 초기화
GoogleSignin.configure({
  iosClientId: Config.GOOGLE_CLIENT_ID_IOS,
  webClientId: Config.GOOGLE_CLIENT_ID_WEB, // Android용
});

const queryClient = new QueryClient();

function App() {
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);
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
    if (notification?.notificationId) {
      navigationRef.current?.navigate('Main', {
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

  useEffect(() => {
    if (hydrated) {
      setupApiClient();
      BootSplash.hide({ fade: true });
    }
  }, [hydrated]);

  // 백그라운드 알림 클릭으로 앱 열렸을 때 해당 알림으로 이동
  useEffect(() => {
    if (isNavigationReady && pendingNotificationId) {
      navigationRef.current?.navigate('Main', {
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
            onReady={() => setIsNavigationReady(true)}
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
});

export default App;
