import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AnimatedLogoTile } from './AnimatedLogoTile';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

export function HeaderLogo() {
  const logoAnimationTrigger = useSharedValue(0);

  const handleLogoPress = useCallback(() => {
    logoAnimationTrigger.value = logoAnimationTrigger.value === 0 ? 1 : 0;
    setTimeout(() => {
      logoAnimationTrigger.value = 0;
    }, 600);
  }, [logoAnimationTrigger]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleLogoPress}
      activeOpacity={0.8}
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
    </TouchableOpacity>
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
