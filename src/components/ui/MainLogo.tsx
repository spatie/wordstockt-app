import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const LOGO_SIZE = 140;

export function MainLogo() {
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
