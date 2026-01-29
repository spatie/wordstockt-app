import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../config/theme';

type IconButtonLayout = 'vertical' | 'horizontal';

interface IconButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  layout?: IconButtonLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
  layout = 'vertical',
  style,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        layout === 'horizontal' && styles.horizontal,
        { opacity: pressed && !disabled ? 0.7 : disabled ? 0.5 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={[styles.icon, disabled && styles.textDisabled]}>{icon}</Text>
      {label && (
        <Text style={[styles.label, disabled && styles.textDisabled]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  horizontal: {
    flexDirection: 'row',
    gap: 6,
  },
  icon: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
