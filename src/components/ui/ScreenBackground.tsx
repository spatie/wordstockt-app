import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
// expo-router bundles React Navigation's elements but doesn't re-export this hook
import { useHeaderHeight } from 'expo-router/build/react-navigation/elements';
import { GlowingBackground } from './GlowingBackground';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Opaque background for every stack screen. Each screen paints its own
 * background (and glow) so screens never show through each other during
 * push, pop and the swipe-back gesture. Content is padded below the
 * transparent native header, which floats over the glow.
 */
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const isFocused = useIsFocused();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlowingBackground paused={!isFocused} />
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
