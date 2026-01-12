import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../config/theme';
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  onPress,
  padding = 'lg',
  borderRadius = 'xl',
  marginBottom = 'md',
  accentColor = colors.primary,
  showAccent = false,
  style,
  testID,
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.backgroundLight,
    borderRadius: RADIUS[borderRadius],
    padding: SPACING[padding],
    marginBottom: SPACING[marginBottom],
    ...(showAccent && {
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.base, cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
