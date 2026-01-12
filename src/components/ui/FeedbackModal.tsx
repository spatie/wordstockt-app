import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
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
    icon: '\u2639',
    color: '#7F8C8D',
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
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (visible && message) {
      setDisplayMessage(message);
    }
  }, [visible, message]);

  const config = typeConfig[type];

  return (
    <BaseModal
      visible={visible}
      onClose={onDismiss}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title ?? config.defaultTitle}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      <Button
        label={buttonText ?? config.defaultButton}
        onPress={onDismiss}
        color={config.color}
        fullWidth
        rounded
        size="lg"
      />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 32,
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
