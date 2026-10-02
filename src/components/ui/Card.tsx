import React, { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { shadows } from '../../config/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';
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
  // Memoize style to prevent re-renders in list items
  const accentStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: color,
      borderTopLeftRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
    }),
    [color, borderRadius]
  );

  return <View style={accentStyle} />;
}

export function Card({
  children,
  onPress,
  padding = 'lg',
  borderRadius = 'xl',
  marginBottom = 'md',
  accentColor,
  showAccent = false,
  elevated = true,
  style,
  testID,
}: CardProps) {
  const colors = useThemeColors();
  const appearance = useAppearanceStore((state) => state.appearance);
  const { wrapperStyles, contentStyles } = splitStyles(style);
  const tint = appearance === 'paper' ? 'light' : 'dark';

  const radiusValue = RADIUS[borderRadius];

  const baseWrapperStyle: ViewStyle = {
    borderRadius: radiusValue,
    marginBottom: SPACING[marginBottom],
    overflow: 'hidden',
    ...(elevated && shadows.md),
  };

  const blurContentStyle: ViewStyle = {
    padding: SPACING[padding],
    backgroundColor:
      appearance === 'navy' ? 'rgba(27, 40, 56, 0.5)' : colors.backgroundLight,
    ...contentStyles,
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          baseWrapperStyle,
          wrapperStyles,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={onPress}
        testID={testID}
      >
        <BlurView intensity={40} tint={tint} style={blurContentStyle}>
          {children}
        </BlurView>
        {showAccent && (
          <AccentBar
            color={accentColor ?? colors.primary}
            borderRadius={radiusValue}
          />
        )}
      </Pressable>
    );
  }

  return (
    <View style={[baseWrapperStyle, wrapperStyles]} testID={testID}>
      <BlurView intensity={40} tint={tint} style={blurContentStyle}>
        {children}
      </BlurView>
      {showAccent && (
        <AccentBar
          color={accentColor ?? colors.primary}
          borderRadius={radiusValue}
        />
      )}
    </View>
  );
}
