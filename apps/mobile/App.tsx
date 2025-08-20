import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from './src/utils/apiSetup';
import Toast from '@/components/common/Toast';
import Loading from '@/components/common/Loading';
import Popup from '@/components/common/Popup';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Toast ref={(ref: Toast | null) => Toast.setRef(ref)} />
          <Loading ref={(ref: Loading | null) => Loading.setRef(ref)} />
          <Popup ref={(ref: Popup | null) => Popup.setRef(ref)} />

          <Navigation />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
