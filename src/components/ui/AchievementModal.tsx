import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';
import type { Achievement } from '../../types';

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

interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementModal({
  visible,
  achievement,
  onDismiss,
}: AchievementModalProps) {
  if (!achievement) return null;

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
          <Text style={styles.achievementLabel}>Achievement Unlocked!</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={80} visible={visible}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{achievement.icon}</Text>
          </View>
        </FadeSlideIn>
        <FadeSlideIn delay={160} visible={visible}>
          <Text style={styles.title}>{achievement.name}</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={240} visible={visible}>
          <Text style={styles.description}>{achievement.description}</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={320} visible={visible} fullWidth>
          <Button
            label="Awesome!"
            onPress={onDismiss}
            color={colors.primary}
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
  achievementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
});
