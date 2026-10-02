import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';

export function HeaderControlSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  const isNavy = useAppearanceStore((state) => state.appearance === 'navy');

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: isNavy
            ? 'rgba(26, 35, 47, 0.7)'
            : colors.backgroundLight,
          borderColor: isNavy ? 'rgba(255, 255, 255, 0.22)' : colors.border,
        },
      ]}
    >
      {isNavy && Platform.OS === 'ios' && (
        <BlurView
          pointerEvents="none"
          tint="dark"
          intensity={45}
          style={StyleSheet.absoluteFill}
        />
      )}
      {isNavy && (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
