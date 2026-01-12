import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useResendVerification } from '../api/queries/useAuth';
import {
  isInGracePeriod,
  getDaysRemainingInGracePeriod,
} from '../utils/emailVerification';

export function useVerificationReminder() {
  const user = useAuthStore((s) => s.user);
  const hasShownRef = useRef(false);
  const { mutate: resend } = useResendVerification();

  useEffect(() => {
    if (!user || hasShownRef.current) {
      return;
    }

    if (!isInGracePeriod(user)) {
      return;
    }

    hasShownRef.current = true;

    const daysRemaining = getDaysRemainingInGracePeriod(user);
    const dayText = daysRemaining === 1 ? 'day' : 'days';

    Alert.alert(
      'Verify Your Email',
      `Please verify your email address to keep your account.\n\nYou have ${daysRemaining} ${dayText} remaining.`,
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
  }, [user, resend]);
}
