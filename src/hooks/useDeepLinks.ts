import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useVerifyEmail } from '../api/queries/useAuth';

// Store pending invite code for after authentication
let pendingInviteCode: string | null = null;

export function useDeepLinks() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: verifyEmail } = useVerifyEmail();
  const wasAuthenticatedRef = useRef(isAuthenticated);

  // Handle redirect to invite screen after authentication
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticatedRef.current && pendingInviteCode) {
      const code = pendingInviteCode;
      pendingInviteCode = null;
      router.push({
        pathname: '/(main)/invite/[code]',
        params: { code },
      });
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);

      // Handle email verification links
      if (parsed.path === 'verify' && parsed.queryParams?.url) {
        const verificationUrl = parsed.queryParams.url as string;
        verifyEmail(verificationUrl);

        if (isAuthenticated) {
          router.replace('/(main)');
        }
        return;
      }

      // Handle invite links: /invite/{code} or wordstockt://invite/{code}
      const inviteMatch = parsed.path?.match(/^invite\/([^/]+)$/);
      if (inviteMatch && inviteMatch[1]) {
        const code = inviteMatch[1];
        if (isAuthenticated) {
          router.push({
            pathname: '/(main)/invite/[code]',
            params: { code },
          });
        } else {
          // Store for after login
          pendingInviteCode = code;
        }
        return;
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, verifyEmail, router]);
}
