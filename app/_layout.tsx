import React from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { theme, colors } from '../src/config/theme';
import { useAuthStore } from '../src/stores/authStore';
import { useNavigationStore } from '../src/stores/navigationStore';
import { LoadingView } from '../src/components/ui/LoadingView';
import { LogoutOverlay } from '../src/components/ui/LogoutOverlay';
import { SnackbarProvider } from '../src/components/ui/SnackbarProvider';
import {
  usePushNotifications,
  useDeepLinks,
  useVerificationReminder,
} from '../src/hooks';
import { isGracePeriodExpired } from '../src/utils/emailVerification';
import { initSentry } from '../src/config/sentry';

// Initialize Sentry as early as possible
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isNavigationHydrated = useNavigationStore((s) => s.isHydrated);
  const segments = useSegments();

  usePushNotifications();
  useDeepLinks();
  useVerificationReminder();

  // Wait for both auth and navigation stores to hydrate
  if (isLoading || !isNavigationHydrated) {
    return <LoadingView />;
  }

  const inAuthGroup = segments[0] === '(auth)';
  const isOnVerifyScreen = segments[1] === 'verify-email';

  // Redirect based on auth state
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but grace period expired - force verification screen
  if (isAuthenticated && isGracePeriodExpired(user) && !isOnVerifyScreen) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // Authenticated with valid status - go to main (but not if on verify screen)
  if (isAuthenticated && inAuthGroup && !isOnVerifyScreen) {
    return <Redirect href="/(main)" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
      <LogoutOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SnackbarProvider>
              <RootLayoutNav />
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
