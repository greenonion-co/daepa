import React, { useEffect, useRef, useState } from 'react';
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={styles.container}>
          <NavigationContainer ref={navigationRef}>
            <Navigation />
          </NavigationContainer>
          <Toast ref={Toast.setRef} />
          <Loading ref={Loading.setRef} />
          <Popup ref={Popup.setRef} />
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
