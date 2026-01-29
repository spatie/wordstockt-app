import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AnimatedLogoTile } from './AnimatedLogoTile';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

export function HeaderLogo() {
  const logoAnimationTrigger = useSharedValue(0);

  const handleLogoPress = useCallback(() => {
    logoAnimationTrigger.set(logoAnimationTrigger.get() === 0 ? 1 : 0);
    setTimeout(() => {
      logoAnimationTrigger.set(0);
    }, 600);
  }, [logoAnimationTrigger]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={handleLogoPress}
    >
      <AnimatedLogoTile
        letter="W"
        size="small"
        animationTrigger={logoAnimationTrigger}
        delay={0}
      />
      <AnimatedLogoTile
        letter="S"
        size="small"
        animationTrigger={logoAnimationTrigger}
        delay={50}
      />
      <Text style={styles.title}>WordStockt</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: SPACING.sm,
    lineHeight: 24,
  },
});
