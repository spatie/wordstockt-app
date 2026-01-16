import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, shadows } from '../../config/theme';
import { RADIUS, DIMENSIONS } from '../../config/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const SIZE_STYLES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: {
    height: DIMENSIONS.buttonHeightSm,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  md: {
    height: DIMENSIONS.buttonHeightMd,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  lg: {
    height: DIMENSIONS.buttonHeightLg,
    paddingHorizontal: 24,
    fontSize: 16,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  rounded = false,
  color,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary' && !color;
  const borderRadius = rounded ? RADIUS.round : RADIUS.md;

  const getBackgroundColor = () => {
    if (isPrimary) return 'transparent';
    if (variant === 'outline') return 'transparent';
    if (color) return color;
    if (variant === 'secondary') return colors.buttonSecondary;
    return colors.primary;
  };

  const getTextColor = () => {
    if (isDisabled) return colors.textMuted;
    if (variant === 'outline') return color ?? colors.primary;
    return colors.textPrimary;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return color ?? colors.primary;
    return 'transparent';
  };

  const buttonContent = loading ? (
    <ActivityIndicator color={getTextColor()} size="small" />
  ) : (
    <Text
      style={[
        styles.text,
        {
          fontSize: sizeStyle.fontSize,
          color: getTextColor(),
        },
        textStyle,
      ]}
    >
      {label}
    </Text>
  );

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderRadius,
          opacity: isDisabled ? 0.6 : 1,
        },
        variant === 'outline' && styles.outline,
        fullWidth && styles.fullWidth,
        isPrimary && shadows.sm,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {isPrimary && (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outline: {
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
