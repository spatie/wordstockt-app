import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderLogo } from './HeaderLogo';
import { HeaderMenu } from './HeaderMenu';
import { HeaderControlSurface } from './HeaderControlSurface';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';

interface MainNavigationHeaderProps {
  canGoBack: boolean;
  onBack?: () => void;
  showMenu?: boolean;
}

export function MainNavigationHeader({
  canGoBack,
  onBack,
  showMenu = true,
}: MainNavigationHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isNavy = useAppearanceStore((state) => state.appearance === 'navy');

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isNavy
            ? 'rgba(13, 27, 42, 0.48)'
            : colors.background,
          borderBottomColor: isNavy ? 'transparent' : colors.border,
          paddingTop: insets.top,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        },
      ]}
    >
      <View style={styles.side}>
        {canGoBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={4}
            style={({ pressed }) => [
              styles.control,
              pressed && styles.controlPressed,
            ]}
          >
            <HeaderControlSurface>
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </HeaderControlSurface>
          </Pressable>
        )}
      </View>

      <View style={styles.title}>
        <HeaderLogo />
      </View>

      <View style={styles.side}>{showMenu && <HeaderMenu />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 44,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  control: {
    width: 40,
    height: 40,
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
