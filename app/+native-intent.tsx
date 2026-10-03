import * as Linking from 'expo-linking';
import { usePendingInviteStore } from '../src/stores/pendingInviteStore';

/**
 * Rewrites incoming deep links before expo-router matches them.
 *
 * - Invite links are parked and opened by `useDeepLinks` once the user is
 *   signed in, so a signed-out user gets the invite right after logging in.
 * - Email verification links are an action, not a screen: `useDeepLinks`
 *   verifies them, and the router goes to the app root instead of showing
 *   an unmatched route.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const { path: linkPath } = Linking.parse(path);

    const inviteCode = linkPath?.match(/^invite\/([^/]+)$/)?.[1];
    if (inviteCode) {
      usePendingInviteStore.getState().setCode(inviteCode);
      return '/';
    }

    if (linkPath === 'verify') {
      return '/';
    }
  } catch {
    // Fall through and let the router handle the original path
  }

  return path;
}
