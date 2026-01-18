import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

export interface Tab<T extends string> {
  value: T;
  label: string;
}

interface TabLayout {
  x: number;
  width: number;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: TabBarProps<T>) {
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const handleTabLayout = (tabValue: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [tabValue]: { x, width } }));
  };

  useEffect(() => {
    const layout = tabLayouts[value];
    if (layout) {
      indicatorX.value = withTiming(layout.x, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      indicatorWidth.value = withTiming(layout.width, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [value, tabLayouts, indicatorX, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={styles.tab}
          onPress={() => onChange(tab.value)}
          onLayout={(e) => handleTabLayout(tab.value, e)}
        >
          <Text
            style={[
              styles.tabText,
              value === tab.value && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
      <Animated.View style={[styles.indicator, indicatorStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
});
