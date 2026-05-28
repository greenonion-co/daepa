import { useEffect, useCallback, useRef } from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { useNotificationStore } from '../store/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { AXIOS_INSTANCE } from '@repo/api-client';

const FCM_TOKEN_KEY = 'fcm_token';
const DEVICE_ID_KEY = 'device_id';

// 고유한 기기 ID 생성
const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${Platform.OS}-${timestamp}-${randomStr}`;
};

// 기기 ID 가져오기 (없으면 생성)
const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const usePushNotification = () => {
  const { accessToken } = useAuth();
  const showNotification = useNotificationStore(state => state.showNotification);
  const setPendingNotificationId = useNotificationStore(
    state => state.setPendingNotificationId,
  );
  const setPendingDeepLinkPath = useNotificationStore(
    state => state.setPendingDeepLinkPath,
  );
  const isRegistering = useRef(false);

  // FCM 토큰 서버에 등록
  const registerFcmToken = useCallback(
    async (token: string) => {
      if (!accessToken || isRegistering.current) {
        return;
      }

      isRegistering.current = true;

      try {
        const deviceId = await getDeviceId();
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        await AXIOS_INSTANCE.post('/api/v1/fcm/token', {
          token,
          deviceId,
          platform,
        });

        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        if (__DEV__) console.log('[FCM] Token registered successfully');
      } catch (error) {
        if (__DEV__) console.error('[FCM] Failed to register token:', error);
      } finally {
        isRegistering.current = false;
      }
    },
    [accessToken],
  );

  // Android 알림 권한 요청
  const requestAndroidPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    // Android 13 이상
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };

  // iOS 알림 권한 요청
  const requestIOSPermission =
    async (): Promise<FirebaseMessagingTypes.AuthorizationStatus> => {
      const authStatus = await messaging().requestPermission();
      return authStatus;
    };

  // 알림 권한 요청 및 토큰 등록
  const requestPermissionAndRegisterToken = useCallback(async () => {
    if (__DEV__) console.log('[FCM] requestPermissionAndRegisterToken called');
    if (!accessToken) {
      if (__DEV__) console.log('[FCM] No accessToken, skipping');
      return;
    }

    try {
      // 권한 요청
      if (Platform.OS === 'ios') {
        const authStatus = await requestIOSPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          if (__DEV__) console.log('[FCM] iOS permission denied');
          return;
        }

        // iOS: 원격 메시지 등록 (getToken 전에 필수)
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
        }
      } else {
        const granted = await requestAndroidPermission();
        if (!granted) {
          if (__DEV__) console.log('[FCM] Android permission denied');
          return;
        }
      }

      // FCM 토큰 가져오기
      const token = await messaging().getToken();
      if (__DEV__) console.log('[FCM] Got token');
      if (token) {
        // 로그인 시 항상 서버에 토큰 등록 (서버에서 upsert 처리)
        await registerFcmToken(token);
      }
    } catch (error) {
      if (__DEV__) console.error('[FCM] Error requesting permission:', error);
    }
  }, [accessToken, registerFcmToken]);

  // 토큰 갱신 리스너
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const unsubscribe = messaging().onTokenRefresh(newToken => {
      if (__DEV__) console.log('[FCM] Token refreshed');
      registerFcmToken(newToken);
    });

    return () => unsubscribe();
  }, [accessToken, registerFcmToken]);

  // 포그라운드 메시지 리스너
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (__DEV__) console.log('[FCM] Foreground message received');

      // 포그라운드에서는 인앱 배너로 알림 표시
      if (remoteMessage.notification) {
        showNotification({
          title: remoteMessage.notification.title ?? '알림',
          body: remoteMessage.notification.body ?? '',
          notificationId: remoteMessage.data?.notificationId as string,
          data: remoteMessage.data,
        });
      }
    });

    return () => unsubscribe();
  }, [showNotification]);

  // 백그라운드/종료 상태에서 알림 클릭 시
  useEffect(() => {
    // 백그라운드에서 알림 클릭으로 앱 열림
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (__DEV__) console.log('[FCM] Notification opened app');
      const notificationId = remoteMessage.data?.notificationId as string;
      const path = remoteMessage.data?.path as string | undefined;
      if (path) {
        setPendingDeepLinkPath(path);
      } else if (notificationId) {
        setPendingNotificationId(notificationId);
      }
    });

    // 종료 상태에서 알림 클릭으로 앱 열림
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          if (__DEV__) console.log('[FCM] App opened from quit state');
          const notificationId = remoteMessage.data?.notificationId as string;
          const path = remoteMessage.data?.path as string | undefined;
          if (path) {
            setPendingDeepLinkPath(path);
          } else if (notificationId) {
            setPendingNotificationId(notificationId);
          }
        }
      });

    return () => unsubscribe();
  }, [setPendingNotificationId, setPendingDeepLinkPath]);

  // 로그인 상태 변경 시 토큰 등록
  useEffect(() => {
    if (accessToken) {
      requestPermissionAndRegisterToken();
    }
  }, [accessToken, requestPermissionAndRegisterToken]);

  return {
    requestPermissionAndRegisterToken,
  };
};

export default usePushNotification;
