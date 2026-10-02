import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { palettes } from '../../config/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  useAppearanceStore,
  type AppearanceName,
} from '../../stores/appearanceStore';

const choices: { name: AppearanceName; label: string }[] = [
  { name: 'navy', label: 'Navy' },
  { name: 'paper', label: 'Paper' },
  { name: 'contrast', label: 'Contrast' },
];

export function ThemePicker() {
  const appearance = useAppearanceStore((state) => state.appearance);
  const setAppearance = useAppearanceStore((state) => state.setAppearance);
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
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {choices.map(({ name, label }) => {
          const preview = palettes[name];
          const selected = appearance === name;

          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityLabel={`${label} theme`}
              accessibilityState={{ checked: selected }}
              onPress={() => setAppearance(name)}
              style={{ flex: 1, gap: 7 }}
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
