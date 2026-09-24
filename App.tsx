import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { I18nProvider, deviceLocale, localeFromLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function LocalizedApp() {
  const { user } = useAuth();
  const fallback = useMemo(() => deviceLocale(), []);
  const locale = localeFromLanguage(user?.language, fallback);
  return (
    <I18nProvider locale={locale}>
      <RootNavigator />
    </I18nProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocalizedApp />
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
