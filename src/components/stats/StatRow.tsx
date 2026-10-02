import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatRowProps {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}

export function StatRow({ label, value, suffix, highlight }: StatRowProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, highlight && styles.valueHighlight]}>
          {value}
        </Text>
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    value: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    valueHighlight: {
      color: colors.primary,
    },
    suffix: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: 4,
    },
  });
