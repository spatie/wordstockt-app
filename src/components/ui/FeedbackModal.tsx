import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
    icon: '',
    color: '#5D6D7E',
    defaultTitle: 'Game Over',
    defaultButton: 'OK',
  },
};

function FadeSlideIn({
  children,
  delay = 0,
  visible,
  fullWidth = false,
}: {
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
  fullWidth?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(16);

      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.spring(opacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [delay, opacity, translateY, visible]);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }], alignItems: 'center' },
        fullWidth && { width: '100%' },
      ]}
    >
      {children}
    </Animated.View>
  );
}

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
            <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
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
