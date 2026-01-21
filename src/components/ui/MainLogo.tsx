import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LOGO_SIZE = 140;

export function MainLogo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/logo-source.png')}
        style={styles.image}
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
