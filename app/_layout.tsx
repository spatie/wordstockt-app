import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { theme, colors } from '../src/config/theme';
import { useAuthStore } from '../src/stores/authStore';
import { useNavigationStore } from '../src/stores/navigationStore';
import { AnimatedSplash } from '../src/components/ui/AnimatedSplash';
import { LogoutOverlay } from '../src/components/ui/LogoutOverlay';
import { SnackbarProvider } from '../src/components/ui/SnackbarProvider';
import {
  usePushNotifications,
  useDeepLinks,
  useVerificationReminder,
} from '../src/hooks';
import { isGracePeriodExpired } from '../src/utils/emailVerification';
import { initSentry } from '../src/config/sentry';

initSentry();

SplashScreen.preventAutoHideAsync();

// Track splash completion at module level to prevent showing on navigation
let hasSplashCompleted = false;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();

  usePushNotifications();
  useDeepLinks();
  useVerificationReminder();

  const inAuthGroup = segments[0] === '(auth)';
  const isOnVerifyScreen = segments[1] === 'verify-email';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && isGracePeriodExpired(user) && !isOnVerifyScreen) {
    return <Redirect href="/(auth)/verify-email" />;
  }

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
  const [splashAnimationComplete, setSplashAnimationComplete] =
    useState(hasSplashCompleted);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isNavigationHydrated = useNavigationStore((s) => s.isHydrated);

  const isAppReady = !isLoading && isNavigationHydrated;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleAnimationComplete = useCallback(() => {
    hasSplashCompleted = true;
    setSplashAnimationComplete(true);
  }, []);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SnackbarProvider>
              {splashAnimationComplete ? (
                <RootLayoutNav />
              ) : (
                <AnimatedSplash
                  isReady={isAppReady}
                  onAnimationComplete={handleAnimationComplete}
                />
              )}
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
