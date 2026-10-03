import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { BaseModal } from '../ui/BaseModal';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Button } from '../ui/Button';
import { useDeclineInvitation } from '../../api/queries/useInvitations';
import { getApiError } from '../../api/client';
import { SPACING } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import type { GameInvitation } from '../../types/invitation';

interface InvitationDialogProps {
  invitation: GameInvitation | null;
  onClose: () => void;
}

export function InvitationDialog({
  invitation,
  onClose,
}: InvitationDialogProps) {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const declineMutation = useDeclineInvitation();

  // Navigate once the dialog has finished closing, so the push doesn't
  // animate underneath a fading modal
  const pendingNavigation = useRef<string | null>(null);

  const handleView = () => {
    if (!invitation) return;
    pendingNavigation.current = `${ROUTES.GAME(invitation.game.ulid)}?invitation=${invitation.ulid}`;
    onClose();
  };

  const handleClosed = () => {
    const target = pendingNavigation.current;
    pendingNavigation.current = null;

    if (target) {
      router.push(target as Href);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !invitation.ulid) {
      Alert.alert('Error', 'Invalid invitation');
      return;
    }

    try {
      await declineMutation.mutateAsync(invitation.ulid);
      onClose();
    } catch (error) {
      const apiError = getApiError(error);
      Alert.alert('Error', apiError.message);
    }
  };

  const isLoading = declineMutation.isPending;

  if (!invitation) return null;

  return (
    <BaseModal
      visible={!!invitation}
      onClose={onClose}
      onClosed={handleClosed}
      backdropBlur
    >
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <SmartAvatar
            userUlid={invitation.inviter.ulid}
            uri={invitation.inviter.avatar}
            name={invitation.inviter.username}
            size={64}
            backgroundColor={invitation.inviter.avatarColor ?? undefined}
          />
        </View>

        <Text style={styles.title}>Game Invitation</Text>

        <Text style={styles.message}>
          <Text style={styles.username}>{invitation.inviter.username}</Text>
          {' wants to play with you!'}
        </Text>

        <View style={styles.languageContainer}>
          <Text style={styles.languageLabel}>Language</Text>
          <Text style={styles.languageValue}>
            {invitation.game.language === 'nl' ? 'Dutch' : 'English'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label="Decline"
            onPress={handleDecline}
            variant="outline"
            disabled={isLoading}
            loading={declineMutation.isPending}
            style={styles.button}
          />
          <Button
            label="View"
            onPress={handleView}
            disabled={isLoading}
            style={styles.button}
          />
        </View>
      </View>
    </BaseModal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    avatarContainer: {
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    username: {
      color: colors.primary,
      fontWeight: '600',
    },
    languageContainer: {
      backgroundColor: colors.border,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.xl,
    },
    languageLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    languageValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: SPACING.md,
      width: '100%',
    },
    button: {
      flex: 1,
    },
  });
