import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../src/config/theme';
import { SPACING, RADIUS } from '../../../src/config/constants';
import { ROUTES } from '../../../src/config/routes';
import {
  useInviteLinkDetails,
  useRedeemInviteLink,
} from '../../../src/api/queries/useInviteLink';
import { getApiError } from '../../../src/api/client';
import { Button } from '../../../src/components/ui/Button';
import { SmartAvatar } from '../../../src/components/ui/SmartAvatar';

export default function InviteConfirmScreen() {
  const { code: codeParam } = useLocalSearchParams<{ code: string | string[] }>();
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const router = useRouter();
  const { data: inviteLink, isLoading, error } = useInviteLinkDetails(code);
  const redeemInviteLink = useRedeemInviteLink();

  const handleJoinGame = async () => {
    if (!code) return;

    try {
      const result = await redeemInviteLink.mutateAsync(code);
      router.replace(ROUTES.GAME(result.ulid));
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.HOME);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </View>
      </View>
    );
  }

  if (error || !inviteLink) {
    const errorMessage = error
      ? getApiError(error).message
      : 'Invitation not found';

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Invalid Invitation</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Button
            label="Go to Home"
            onPress={handleGoBack}
            fullWidth
            rounded
            size="lg"
          />
        </View>
      </View>
    );
  }

  const redeemError = redeemInviteLink.error
    ? getApiError(redeemInviteLink.error).message
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <SmartAvatar
          uri={inviteLink.inviter.avatar}
          name={inviteLink.inviter.username}
          size={80}
          disabled
        />

        <Text style={styles.title}>Game Invitation</Text>

        <Text style={styles.inviterText}>
          <Text style={styles.inviterName}>{inviteLink.inviter.username}</Text>
          {' invited you to play!'}
        </Text>

        <View style={styles.languageBadge}>
          <Text style={styles.languageText}>
            {inviteLink.game.language === 'nl' ? 'Dutch' : 'English'}
          </Text>
        </View>

        {redeemError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{redeemError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            label="Join Game"
            onPress={handleJoinGame}
            loading={redeemInviteLink.isPending}
            fullWidth
            rounded
            size="lg"
          />
          <Button
            label="Cancel"
            onPress={handleGoBack}
            variant="secondary"
            fullWidth
            rounded
            size="lg"
            disabled={redeemInviteLink.isPending}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: SPACING.lg,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  inviterText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  inviterName: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  languageBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
});
