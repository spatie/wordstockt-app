import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, shadows } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';

type SpacingKey = keyof typeof SPACING;
type RadiusKey = keyof typeof RADIUS;

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: SpacingKey;
  borderRadius?: RadiusKey;
  marginBottom?: SpacingKey;
  accentColor?: string;
  showAccent?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Extract border-related styles for the wrapper, rest goes to content
function splitStyles(style: StyleProp<ViewStyle>): {
  wrapperStyles: ViewStyle;
  contentStyles: ViewStyle;
} {
  if (!style) {
    return { wrapperStyles: {}, contentStyles: {} };
  }

  const flatStyle = StyleSheet.flatten(style) || {};
  const wrapperStyles: ViewStyle = {};
  const contentStyles: ViewStyle = {};

  const wrapperKeys = [
    'borderWidth',
    'borderColor',
    'borderTopWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'borderStyle',
  ];

  for (const [key, value] of Object.entries(flatStyle)) {
    if (wrapperKeys.includes(key)) {
      (wrapperStyles as Record<string, unknown>)[key] = value;
    } else {
      (contentStyles as Record<string, unknown>)[key] = value;
    }
  }

  return { wrapperStyles, contentStyles };
}

function AccentBar({
  color,
  borderRadius,
}: {
  color: string;
  borderRadius: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: color,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
      }}
    />
  );
}

export function Card({
  children,
  onPress,
  padding = 'lg',
  borderRadius = 'xl',
  marginBottom = 'md',
  accentColor = colors.primary,
  showAccent = false,
  elevated = true,
  style,
  testID,
}: CardProps) {
  const { wrapperStyles, contentStyles } = splitStyles(style);

  const radiusValue = RADIUS[borderRadius];

  const baseWrapperStyle: ViewStyle = {
    borderRadius: radiusValue,
    marginBottom: SPACING[marginBottom],
    overflow: 'hidden',
    ...(elevated && shadows.md),
  };

  const blurContentStyle: ViewStyle = {
    padding: SPACING[padding],
    backgroundColor: 'rgba(27, 40, 56, 0.5)',
    ...contentStyles,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[baseWrapperStyle, wrapperStyles]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        <BlurView intensity={40} tint="dark" style={blurContentStyle}>
          {children}
        </BlurView>
        {showAccent && (
          <AccentBar color={accentColor} borderRadius={radiusValue} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[baseWrapperStyle, wrapperStyles]} testID={testID}>
      <BlurView intensity={40} tint="dark" style={blurContentStyle}>
        {children}
      </BlurView>
      {showAccent && (
        <AccentBar color={accentColor} borderRadius={radiusValue} />
      )}
    </View>
  );
}
