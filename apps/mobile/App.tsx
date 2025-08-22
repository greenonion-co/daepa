import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from './src/utils/apiSetup';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
