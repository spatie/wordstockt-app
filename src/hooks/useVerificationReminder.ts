import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';
import { useResendVerification } from '../api/queries/useAuth';
import {
  isInGracePeriod,
  getDaysRemainingInGracePeriod,
} from '../utils/emailVerification';

const STORAGE_KEY = 'verification-reminder-shown-at';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function useVerificationReminder() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const hasCheckedRef = useRef(false);
  const { mutate: resend } = useResendVerification();

  useEffect(() => {
    if (!user || isGuest || hasCheckedRef.current) {
      return;
    }

    if (!isInGracePeriod(user)) {
      return;
    }

    hasCheckedRef.current = true;
    const currentUser = user;

    async function checkAndShowReminder() {
      const lastShownAt = await AsyncStorage.getItem(STORAGE_KEY);

      if (lastShownAt) {
        const elapsed = Date.now() - parseInt(lastShownAt, 10);
        if (elapsed < ONE_DAY_MS) {
          return;
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());

      const daysRemaining = getDaysRemainingInGracePeriod(currentUser);
      const dayText = daysRemaining === 1 ? 'day' : 'days';

      Alert.alert(
        'Verify Your Email',
        `We've sent a verification email to ${currentUser.email}. Please click the link in the email to verify your account.\n\nYou have ${daysRemaining} ${dayText} remaining.`,
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Resend Email',
            onPress: () => resend(),
          },
        ]
      );
    }

    checkAndShowReminder();
  }, [user, isGuest, resend]);
}
