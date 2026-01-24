import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { FadeSlideIn } from './FadeSlideIn';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

interface RematchModalProps {
  visible: boolean;
  opponent: {
    username: string;
    avatar: string | null;
    avatarColor: string | null;
  } | null;
  onRematch: () => void;
  onDismiss: () => void;
  isLoading: boolean;
  error: string | null;
}

export function RematchModal({
  visible,
  opponent,
  onRematch,
  onDismiss,
  isLoading,
  error,
}: RematchModalProps) {
  if (!opponent) return null;

  return (
    <BaseModal
      visible={visible}
      onClose={onDismiss}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.content}>
        <FadeSlideIn delay={0} visible={visible}>
          <Avatar
            uri={opponent.avatar}
            name={opponent.username}
            size={80}
            backgroundColor={opponent.avatarColor ?? undefined}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={80} visible={visible}>
          <Text style={styles.title}>Rematch?</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={160} visible={visible}>
          <Text style={styles.message}>
            Challenge {opponent.username} to another game with the same board?
          </Text>
        </FadeSlideIn>
        {error && (
          <FadeSlideIn delay={160} visible={visible}>
            <Text style={styles.error}>{error}</Text>
          </FadeSlideIn>
        )}
        <FadeSlideIn delay={240} visible={visible} fullWidth>
          <View style={styles.buttons}>
            <Button
              label="Maybe Later"
              onPress={onDismiss}
              variant="outline"
              fullWidth
              rounded
              size="lg"
              disabled={isLoading}
            />
            <Button
              label="Rematch"
              onPress={onRematch}
              color="#27AE60"
              fullWidth
              rounded
              size="lg"
              loading={isLoading}
            />
          </View>
        </FadeSlideIn>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: SPACING.xxxl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  buttons: {
    width: '100%',
    gap: SPACING.md,
  },
});
