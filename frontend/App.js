import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import store from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { paperTheme } from './src/theme/theme';
import ErrorBoundary from './src/components/common/ErrorBoundary';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <PaperProvider theme={paperTheme}>
              <StatusBar style="dark" />
              <AppNavigator />
            </PaperProvider>
          </QueryClientProvider>
        </ReduxProvider>
      </View>
    </ErrorBoundary>
  );
}
