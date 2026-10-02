import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useRegisterPushToken } from '../api/queries/useAuth';
import { useAuthStore } from '../stores/authStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useNotificationStore } from '../stores/notificationStore';
import { syncFromPush } from '../api/syncFromPush';
import { ROUTES } from '../config/routes';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Suppress notification if user is already viewing the game it's about
      const notificationGameUlid = notification.request.content.data?.game_ulid;
      const currentlyViewedGameUlid =
        useNavigationStore.getState().currentlyViewedGameUlid;

      if (
        notificationGameUlid &&
        notificationGameUlid === currentlyViewedGameUlid
      ) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return token.data;
}

export function usePushNotifications() {
  const router = useRouter();
  const authToken = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  const sessionRevision = useAuthStore((s) => s.sessionRevision);
  const { mutateAsync: registerToken } = useRegisterPushToken();

  // Read the latest registerToken/router via refs so the effect does not
  // re-run (churning listeners) when their identities change.
  const registerTokenRef = useRef(registerToken);
  const routerRef = useRef(router);
  registerTokenRef.current = registerToken;
  routerRef.current = router;

  useEffect(() => {
    // Guest accounts do not register a device token. Conversion to a full
    // account changes isGuest and starts this lifecycle without a new login.
    if (!authToken || isGuest) return;

    let isActive = true;
    let registeredToken: string | null = null;
    let registrationInFlight: Promise<void> | null = null;

    const checkAndRegister = () => {
      if (registrationInFlight) return;
      registrationInFlight = (async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (!isActive || !token || token === registeredToken) return;

          await registerTokenRef.current({
            token,
            deviceName: Device.deviceName ?? undefined,
            authToken,
          });
          if (isActive) registeredToken = token;
        } catch (error) {
          console.log('[Push] Token registration failed:', error);
        } finally {
          registrationInFlight = null;
        }
      })();
    };

    checkAndRegister();

    // Re-check when app comes to foreground (user may have enabled notifications in settings)
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          checkAndRegister();
        }
      }
    );

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Pushes are the only live updates, so refresh what they're about
        syncFromPush(notification.request.content.data);

        const gameUlid = notification.request.content.data?.game_ulid;
        if (gameUlid && typeof gameUlid === 'string') {
          useNotificationStore
            .getState()
            .addNotification(notification.request.identifier, gameUlid);
        }
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        // The notification decides where to go, not the app resume state
        useNavigationStore.getState().clearLastGameUlid();

        if (data?.type === 'invitation') {
          routerRef.current.dismissTo(ROUTES.HOME);
        } else if (typeof data?.game_ulid === 'string') {
          // The games list is always the initial route underneath, so back
          // works. `navigate` reuses the game screen if it's already open.
          routerRef.current.navigate(ROUTES.GAME(data.game_ulid));
        }
      });

    return () => {
      isActive = false;
      appStateSubscription.remove();
      notificationListener.remove();
      responseListener.remove();
    };
  }, [authToken, isGuest, sessionRevision]);
}
