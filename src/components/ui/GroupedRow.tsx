import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../../config/theme';
import { useThemeColors, useThemedStyles } from '../../hooks/useThemeColors';

const RADIUS = 14;

interface GroupedRowProps {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  onPress?: () => void;
  // Where the separator starts, so it lines up with the text, not the avatar
  separatorInset?: number;
  showChevron?: boolean;
}

/**
 * One row of an inset grouped list (like iOS Settings). Rows of the same list
 * render as a single rounded group with hairline separators between them.
 */
export function GroupedRow({
  children,
  isFirst,
  isLast,
  onPress,
  separatorInset = 16,
  showChevron = Boolean(onPress),
}: GroupedRowProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.first,
        isLast && styles.last,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>{children}</View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
      {!isLast && <View style={[styles.separator, { left: separatorInset }]} />}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundLight,
    },
    first: {
      borderTopLeftRadius: RADIUS,
      borderTopRightRadius: RADIUS,
    },
    last: {
      borderBottomLeftRadius: RADIUS,
      borderBottomRightRadius: RADIUS,
    },
    pressed: {
      backgroundColor: colors.border,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    separator: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
