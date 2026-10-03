import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { appearances, palettes } from '../../config/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  APPEARANCE_NAMES,
  useAppearanceStore,
} from '../../stores/appearanceStore';

export function ThemePicker() {
  const appearance = useAppearanceStore((state) => state.appearance);
  const setAppearance = useAppearanceStore((state) => state.setAppearance);
  const followSystem = useAppearanceStore((state) => state.followSystem);
  const setFollowSystem = useAppearanceStore((state) => state.setFollowSystem);
  const colors = useThemeColors();

  return (
    <View style={{ gap: 12, marginBottom: 28 }}>
      <Text
        style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}
      >
        Appearance
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        Choose how the app looks on this device.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.backgroundLight,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
            Match system
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Paper in light mode, Navy in dark mode
          </Text>
        </View>
        <Switch
          accessibilityLabel="Match system appearance"
          value={followSystem}
          onValueChange={setFollowSystem}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          rowGap: 14,
          marginHorizontal: -5,
        }}
      >
        {APPEARANCE_NAMES.map((name) => {
          const { label } = appearances[name];
          const preview = palettes[name];
          const selected = !followSystem && appearance === name;

          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityLabel={`${label} theme`}
              accessibilityState={{ checked: selected }}
              onPress={() => setAppearance(name)}
              style={{ width: '33.333%', paddingHorizontal: 5, gap: 7 }}
            >
              <View
                style={{
                  height: 68,
                  borderRadius: 12,
                  backgroundColor: preview.background,
                  borderWidth: selected ? 3 : 1,
                  borderColor: selected ? colors.primary : colors.border,
                  padding: 10,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: '72%',
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: preview.primary,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[0, 1, 2].map((index) => (
                    <View
                      key={index}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: preview.tileBackground,
                        borderWidth: 1,
                        borderColor: preview.tileBorder,
                      }}
                    />
                  ))}
                </View>
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 13,
                  fontWeight: selected ? '700' : '500',
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
