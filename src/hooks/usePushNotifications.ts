import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useRegisterPushToken } from '../api/queries/useAuth';
import { useAuthStore } from '../stores/authStore';
import { useNavigationStore } from '../stores/navigationStore';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: registerToken } = useRegisterPushToken();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRegister = () => {
      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            console.log(
              '[Push] Registering token:',
              token.substring(0, 20) + '...'
            );
            registerToken(
              {
                token,
                deviceName: Device.deviceName ?? undefined,
              },
              {
                onSuccess: () => {
                  console.log('[Push] Token registered successfully');
                },
                onError: (error) => {
                  console.log('[Push] Token registration failed:', error);
                },
              }
            );
          } else {
            console.log(
              '[Push] No token received (permission denied or not a device)'
            );
          }
        })
        .catch((error) => {
          console.log('[Push] Failed to get push token:', error);
        });
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

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'invitation') {
          router.push('/(main)');
        } else if (data?.game_ulid) {
          router.push(`/(main)/game/${data.game_ulid}`);
        }
      });

    return () => {
      appStateSubscription.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, registerToken, router]);
}
