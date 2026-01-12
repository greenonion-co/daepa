import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from './src/utils/apiSetup';
import { useAuthStore } from './src/store/auth';
import Toast from '@/components/common/Toast';
import Loading from '@/components/common/Loading';
import Popup from '@/components/common/Popup';

const queryClient = new QueryClient();

function App() {
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
    }
  }, [hydrated]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {hydrated ? (
          <View style={styles.container}>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
            <Toast ref={Toast.setRef} />
            <Loading ref={Loading.setRef} />
            <Popup ref={Popup.setRef} />
          </View>
        ) : null}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
