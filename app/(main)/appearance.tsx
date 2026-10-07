import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemePicker } from '../../src/components/profile/ThemePicker';
import { LAYOUT } from '../../src/config/constants';

export default function AppearanceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <ThemePicker showHeading={false} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: LAYOUT.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
});
