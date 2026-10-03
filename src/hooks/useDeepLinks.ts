import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { usePendingInviteStore } from '../stores/pendingInviteStore';
import { useVerifyEmail } from '../api/queries/useAuth';
import { ROUTES } from '../config/routes';

/**
 * Handles the parts of deep links that are actions rather than screens.
 * Routing itself happens in `app/+native-intent.tsx`.
 */
export function useDeepLinks() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pendingInviteCode = usePendingInviteStore((s) => s.code);
  const { mutate: verifyEmail } = useVerifyEmail();

  // Keep the latest mutate in a ref so the link subscription can use it
  // without re-subscribing (which would re-process the initial URL).
  const verifyEmailRef = useRef(verifyEmail);
  verifyEmailRef.current = verifyEmail;

  // Open a parked invite as soon as the user is signed in
  useEffect(() => {
    if (!isAuthenticated || !pendingInviteCode) {
      return;
    }

    usePendingInviteStore.getState().clear();
    router.push(ROUTES.INVITE(pendingInviteCode));
  }, [isAuthenticated, pendingInviteCode, router]);

  // Verify email links. Once verified, the root navigator's guards move the
  // user out of the verify screen on their own.
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);

      if (parsed.path === 'verify' && parsed.queryParams?.url) {
        verifyEmailRef.current(parsed.queryParams.url as string);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Only process the initial URL once on mount.
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);
}
