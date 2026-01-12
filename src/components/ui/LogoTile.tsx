import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';

type LogoTileSize = 'small' | 'medium' | 'large';

interface LogoTileProps {
  letter: string;
  size?: LogoTileSize;
}

const SIZES = {
  small: { tile: 24, font: 14 },
  medium: { tile: 28, font: 16 },
  large: { tile: 100, font: 48 },
} as const;

export function LogoTile({ letter, size = 'medium' }: LogoTileProps) {
  const dimensions = SIZES[size];

  return (
    <View
      style={[
        styles.tile,
        {
          width: dimensions.tile,
          height: dimensions.tile,
          borderRadius: size === 'large' ? 16 : 4,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: dimensions.font }]}>
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontWeight: '700',
    color: '#FFF',
  },
});
