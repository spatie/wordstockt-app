import React, { useEffect } from 'react';
import { Stack, ThemeProvider } from 'expo-router';
import { Appearance, Platform } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/api/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  getNavigationTheme,
  getPaperTheme,
  isLightAppearance,
  palettes,
} from '../src/config/theme';
import { useAuthStore } from '../src/stores/authStore';
import { useNavigationStore } from '../src/stores/navigationStore';
import { useAppearanceStore } from '../src/stores/appearanceStore';
import { useAppearance } from '../src/hooks/useThemeColors';
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

// Keep the native splash up until the app is ready, then fade it out to
// reveal the first screen that's already rendered underneath.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

// Once the app has been ready this session, never block rendering again
// (e.g. if auth briefly reloads after logout)
let hasBeenReady = false;

function RootLayoutNav() {
  const appearance = useAppearance();
  const colors = palettes[appearance];
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const needsVerification = isAuthenticated && isGracePeriodExpired(user);

  // The first screen is rendered by now, so the splash can fade away
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  usePushNotifications();
  useDeepLinks();
  useVerificationReminder();
  useOTAUpdates();
  useCurrentUser();

  // The guards are mutually exclusive: when auth state changes, the navigator
  // moves to the one group that is allowed and fades between them.
  return (
    <ThemeProvider value={getNavigationTheme(appearance)}>
      <StatusBar style={isLightAppearance(appearance) ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={needsVerification}>
          <Stack.Screen name="verify-email" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && !needsVerification}>
          <Stack.Screen name="(main)" />
        </Stack.Protected>
      </Stack>
      <LogoutOverlay />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const appearance = useAppearance();
  const followSystem = useAppearanceStore((s) => s.followSystem);
  const isAppearanceHydrated = useAppearanceStore((s) => s.isHydrated);
  const colors = palettes[appearance];
  const isLoading = useAuthStore((s) => s.isLoading);
  const isNavigationHydrated = useNavigationStore((s) => s.isHydrated);

  const isAppReady =
    hasBeenReady ||
    (!isLoading && isNavigationHydrated && isAppearanceHydrated);

  useEffect(() => {
    if (isAppReady) {
      hasBeenReady = true;
    }
  }, [isAppReady]);

  // iOS native UI follows the app's theme. Changing Android's native color
  // scheme reloads app resources and can block the UI during startup.
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (followSystem) {
      Appearance.setColorScheme('unspecified');
      return;
    }

    Appearance.setColorScheme(isLightAppearance(appearance) ? 'light' : 'dark');
  }, [appearance, followSystem]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={getPaperTheme(appearance)}>
            <SnackbarProvider>
              {isAppReady && <RootLayoutNav />}
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
