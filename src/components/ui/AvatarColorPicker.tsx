import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';

// Colors chosen for good contrast with white text (WCAG AA compliant)
export const AVATAR_COLORS = [
  '#4A90D9', // Blue
  '#9B59B6', // Purple
  '#27AE60', // Green
  '#E67E22', // Orange
  '#E74C3C', // Red
  '#1ABC9C', // Teal
] as const;

interface AvatarColorPickerProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
}

export function AvatarColorPicker({
  selectedColor,
  onSelectColor,
}: AvatarColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Avatar Color</Text>
      <View style={styles.colorGrid}>
        {AVATAR_COLORS.map((color) => {
          const isSelected = selectedColor === color;
          return (
            <Pressable
              key={color}
              style={({ pressed }) => [
                styles.colorSwatch,
                { backgroundColor: color },
                isSelected && styles.colorSwatchSelected,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => onSelectColor(color)}
            >
              {isSelected && (
                <MaterialCommunityIcons name="check" size={20} color="#FFF" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
