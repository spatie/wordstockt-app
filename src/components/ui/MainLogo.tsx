import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const LOGO_SIZE = 140;

export function MainLogo() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/logo-source.png')}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    },
  });
