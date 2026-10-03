import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { shadows } from '../../config/theme';
import {
  useIsLightAppearance,
  useThemeBlurTint,
  useThemeColors,
} from '../../hooks/useThemeColors';
import { RADIUS, SPACING } from '../../config/constants';
import { withAlpha } from '../../utils/color';

type SpacingKey = keyof typeof SPACING;
type RadiusKey = keyof typeof RADIUS;

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
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

// A soft wash of the accent color fading down from the top edge
function AccentWash({ color }: { color: string }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[withAlpha(color, 0.18), withAlpha(color, 0)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.7 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

// Light catching the top edge of the glass, giving dark cards depth
// without an outline
function GlassSheen() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

// Light surfaces read best on a wide, faint shadow instead of a border
const lightShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 14,
  elevation: 2,
};

export function Card({
  children,
  onPress,
  onPressIn,
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
  const tint = useThemeBlurTint();
  const isLight = useIsLightAppearance();
  const { wrapperStyles, contentStyles } = splitStyles(style);
  const accent = showAccent ? (accentColor ?? colors.primary) : null;
  const radius = RADIUS[borderRadius];

  // The shadow lives on an outer view: iOS doesn't draw shadows on a view
  // that clips its content.
  const shadowStyle: ViewStyle = {
    borderRadius: radius,
    marginBottom: SPACING[marginBottom],
    ...(elevated && (isLight ? lightShadow : shadows.md)),
  };

  const clipStyle: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
  };

  const blurContentStyle: ViewStyle = {
    padding: SPACING[padding],
    backgroundColor: colors.cardSurface,
    ...contentStyles,
  };

  const surface = (
    <View style={[clipStyle, wrapperStyles]}>
      <BlurView intensity={40} tint={tint} style={blurContentStyle}>
        {!isLight && <GlassSheen />}
        {accent && <AccentWash color={accent} />}
        {children}
      </BlurView>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          shadowStyle,
          pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        testID={testID}
      >
        {surface}
      </Pressable>
    );
  }

  return (
    <View style={shadowStyle} testID={testID}>
      {surface}
    </View>
  );
}
