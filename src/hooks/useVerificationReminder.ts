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
      `We've sent a verification email to ${user.email}. Please click the link in the email to verify your account.\n\nYou have ${daysRemaining} ${dayText} remaining.`,
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
