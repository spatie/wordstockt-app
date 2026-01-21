import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Redirect, useSegments, useRouter } from 'expo-router';
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
  useOTAUpdates,
} from '../src/hooks';
import { useCurrentUser } from '../src/api/queries/useAuth';
import { isGracePeriodExpired } from '../src/utils/emailVerification';
import { initSentry } from '../src/config/sentry';

initSentry();

SplashScreen.preventAutoHideAsync();

// Track splash completion at module level - once true, never show splash again this session
let hasSplashCompleted = false;

// Track if we've ever had auth loaded - helps distinguish cold start from logout
let hasEverLoadedAuth = false;

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
  const router = useRouter();

  usePushNotifications();
  useDeepLinks();
  useVerificationReminder();
  useOTAUpdates();
  useCurrentUser();

  const inAuthGroup = segments[0] === '(auth)';
  const isOnVerifyScreen = segments[1] === 'verify-email';

  useEffect(() => {
    if (isAuthenticated && inAuthGroup && !isOnVerifyScreen) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, inAuthGroup, isOnVerifyScreen, router]);

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && isGracePeriodExpired(user) && !isOnVerifyScreen) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'none',
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

  // Track when auth has loaded at least once (distinguishes cold start from logout)
  useEffect(() => {
    if (!isLoading) {
      hasEverLoadedAuth = true;
    }
  }, [isLoading]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleAnimationComplete = useCallback(() => {
    hasSplashCompleted = true;
    setSplashAnimationComplete(true);
  }, []);

  // Only show splash on true cold start (first load, auth still loading)
  // Never show splash if auth has previously loaded (e.g., after logout)
  const shouldShowSplash = !splashAnimationComplete && !hasEverLoadedAuth;

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SnackbarProvider>
              {shouldShowSplash ? (
                <AnimatedSplash
                  isReady={isAppReady}
                  onAnimationComplete={handleAnimationComplete}
                />
              ) : (
                <RootLayoutNav />
              )}
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
