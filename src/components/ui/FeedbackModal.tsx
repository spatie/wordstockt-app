import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { FadeSlideIn } from './FadeSlideIn';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

export type FeedbackType = 'error' | 'warning' | 'success' | 'lost';

const typeConfig: Record<
  FeedbackType,
  { icon: string; color: string; defaultTitle: string; defaultButton: string }
> = {
  error: {
    icon: '!',
    color: '#E74C3C',
    defaultTitle: 'Invalid Move',
    defaultButton: 'OK',
  },
  warning: {
    icon: '!',
    color: '#F39C12',
    defaultTitle: 'Warning',
    defaultButton: 'Got it',
  },
  success: {
    icon: '\u2713',
    color: '#27AE60',
    defaultTitle: 'Success',
    defaultButton: 'Awesome!',
  },
  lost: {
    icon: '',
    color: '#5D6D7E',
    defaultTitle: 'Game Over',
    defaultButton: 'OK',
  },
};

interface FeedbackModalProps {
  visible: boolean;
  type?: FeedbackType;
  title?: string;
  message: string;
  onDismiss: () => void;
  buttonText?: string;
}

export function FeedbackModal({
  visible,
  type = 'error',
  title,
  message,
  onDismiss,
  buttonText,
}: FeedbackModalProps) {
  // Keep the last non-empty message so it stays visible during the fade-out
  // (when the parent clears `message` while closing). Using a ref avoids an
  // extra render / stale frame compared to mirroring the prop into state.
  const lastMessageRef = useRef(message);
  if (message) {
    lastMessageRef.current = message;
  }
  const displayMessage = message || lastMessageRef.current;

  const config = typeConfig[type];
  const showIcon = type !== 'lost';
  const baseDelay = showIcon ? 0 : -80;

  return (
    <BaseModal
      visible={visible}
      onClose={onDismiss}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.content}>
        {showIcon && (
          <FadeSlideIn delay={baseDelay} visible={visible}>
            <View
              style={[styles.iconCircle, { backgroundColor: config.color }]}
            >
              <Text style={styles.iconText}>{config.icon}</Text>
            </View>
          </FadeSlideIn>
        )}
        <FadeSlideIn delay={baseDelay + 80} visible={visible}>
          <Text style={styles.title}>{title ?? config.defaultTitle}</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={baseDelay + 160} visible={visible}>
          <Text style={styles.message}>{displayMessage}</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={baseDelay + 240} visible={visible} fullWidth>
          <Button
            label={buttonText ?? config.defaultButton}
            onPress={onDismiss}
            color={config.color}
            fullWidth
            rounded
            size="lg"
          />
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
});
