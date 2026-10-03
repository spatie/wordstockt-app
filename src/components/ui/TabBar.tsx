import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {
  useIsLightAppearance,
  useThemeColors,
} from '../../hooks/useThemeColors';
import { SPACING } from '../../config/constants';

export interface Tab<T extends string> {
  value: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

// A native segmented control (UISegmentedControl on iOS)
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  style,
}: TabBarProps<T>) {
  const colors = useThemeColors();
  const isLight = useIsLightAppearance();

  return (
    <View style={[styles.container, style]}>
      <SegmentedControl
        values={tabs.map((tab) => tab.label)}
        selectedIndex={Math.max(
          0,
          tabs.findIndex((tab) => tab.value === value)
        )}
        onChange={(event) => {
          const tab = tabs[event.nativeEvent.selectedSegmentIndex];
          if (tab) {
            onChange(tab.value);
          }
        }}
        appearance={isLight ? 'light' : 'dark'}
        fontStyle={{ color: colors.textSecondary }}
        activeFontStyle={{ color: colors.textPrimary, fontWeight: '600' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
});
