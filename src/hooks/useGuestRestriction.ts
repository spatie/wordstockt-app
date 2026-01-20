import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../config/routes';

type RestrictedFeature =
  | 'friends'
  | 'leaderboard'
  | 'achievements'
  | 'stats'
  | 'invite';

const FEATURE_MESSAGES: Record<RestrictedFeature, string> = {
  friends: 'see your friends',
  leaderboard: 'view the leaderboard',
  achievements: 'track your achievements',
  stats: 'view your stats',
  invite: 'send game invitations',
};

export function useGuestRestriction() {
  const isGuest = useAuthStore((s) => s.isGuest);

  const checkAccess = useCallback(
    (feature: RestrictedFeature): boolean => {
      return !isGuest;
    },
    [isGuest]
  );

  const showUpgradePrompt = useCallback((feature?: RestrictedFeature) => {
    const featureText = feature
      ? FEATURE_MESSAGES[feature]
      : 'access this feature';

    Alert.alert(
      'Create a Free Account',
      `To ${featureText}, create a free account. No ads, no spam, your data stays private.`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Sign Up Free',
          onPress: () => router.push(ROUTES.CONVERT_ACCOUNT),
        },
      ]
    );
  }, []);

  const showGameLimitPrompt = useCallback(() => {
    Alert.alert(
      "You're on a roll!",
      "Guests can play up to 3 games at a time. Create a free account for unlimited games - it's quick and completely free!",
      [
        { text: 'Got it', style: 'cancel' },
        {
          text: 'Create Free Account',
          onPress: () => router.push(ROUTES.CONVERT_ACCOUNT),
        },
      ]
    );
  }, []);

  const showFirstWinCelebration = useCallback(() => {
    Alert.alert(
      'Nice win!',
      'Want to keep track of your victories? Create a free account - it only takes a few seconds. No ads, no data selling, just word games.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Create Free Account',
          onPress: () => router.push(ROUTES.CONVERT_ACCOUNT),
        },
      ]
    );
  }, []);

  return {
    isGuest,
    checkAccess,
    showUpgradePrompt,
    showGameLimitPrompt,
    showFirstWinCelebration,
  };
}
