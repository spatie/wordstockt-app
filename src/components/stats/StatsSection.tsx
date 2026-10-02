import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function StatsSection({ title, children }: StatsSectionProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      padding: 16,
      paddingBottom: 8,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });
