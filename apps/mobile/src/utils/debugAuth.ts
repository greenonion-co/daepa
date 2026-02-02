import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth';

/**
 * 인증 관련 AsyncStorage와 Store 데이터를 콘솔에 출력
 * 개발 모드에서만 사용
 */
export const debugAuthState = async () => {
  if (!__DEV__) {
    console.log('Debug only available in development mode');
    return;
  }

  console.log('\n========== AUTH DEBUG START ==========\n');

  // 1. Zustand Store 현재 상태
  const storeState = useAuthStore.getState();
  console.log('📦 [Zustand Store State]');
  console.log(
    '- accessToken:',
    storeState.accessToken
      ? `${storeState.accessToken.substring(0, 20)}...`
      : null,
  );
  console.log('- user:', JSON.stringify(storeState.user, null, 2));

  // 2. AsyncStorage에 저장된 데이터
  console.log('\n💾 [AsyncStorage Data]');
  try {
    const authStoreData = await AsyncStorage.getItem('auth-store');
    if (authStoreData) {
      const parsed = JSON.parse(authStoreData);
      console.log('- auth-store:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('- auth-store: null (not saved)');
    }
  } catch (e) {
    console.log('- auth-store: Error reading', e);
  }

  // 3. 모든 AsyncStorage 키 출력
  console.log('\n🔑 [All AsyncStorage Keys]');
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('- Keys:', allKeys);

    // 각 키의 값도 출력
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`\n  [${key}]:`);
      try {
        const parsed = JSON.parse(value || '');
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log(value);
      }
    }
  } catch (e) {
    console.log('- Error getting keys:', e);
  }

  // 4. Hydration 상태
  console.log('\n💧 [Hydration Status]');
  console.log(
    '- hasHydrated:',
    useAuthStore.persist?.hasHydrated?.() ?? 'unknown',
  );

  console.log('\n========== AUTH DEBUG END ==========\n');
};

/**
 * AsyncStorage 전체 초기화 (주의: 모든 데이터 삭제)
 */
export const clearAllAsyncStorage = async () => {
  if (!__DEV__) {
    console.log('Debug only available in development mode');
    return;
  }

  try {
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');
  } catch (e) {
    console.error('❌ Failed to clear AsyncStorage:', e);
  }
};

/**
 * 토큰만 삭제하고 user는 유지 (이슈 재현용)
 */
export const clearTokenOnly = async () => {
  if (!__DEV__) {
    console.log('Debug only available in development mode');
    return;
  }

  try {
    const authData = await AsyncStorage.getItem('auth-store');
    if (authData) {
      const parsed = JSON.parse(authData);
      parsed.state.accessToken = null;
      await AsyncStorage.setItem('auth-store', JSON.stringify(parsed));
      console.log('✅ Token cleared, user preserved');
      console.log('Restart the app to see the effect');
    }
  } catch (e) {
    console.error('❌ Failed to clear token:', e);
  }
};

/**
 * user만 삭제하고 token은 유지 (반대 케이스 테스트용)
 */
export const clearUserOnly = async () => {
  if (!__DEV__) {
    console.log('Debug only available in development mode');
    return;
  }

  try {
    const authData = await AsyncStorage.getItem('auth-store');
    if (authData) {
      const parsed = JSON.parse(authData);
      parsed.state.user = null;
      await AsyncStorage.setItem('auth-store', JSON.stringify(parsed));
      console.log('✅ User cleared, token preserved');
      console.log('Restart the app to see the effect');
    }
  } catch (e) {
    console.error('❌ Failed to clear user:', e);
  }
};
