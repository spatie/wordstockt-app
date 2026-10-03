import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../../config/typography';

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
      ...typography.sectionLabel,
      color: colors.textSecondary,
      padding: 16,
      paddingBottom: 8,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });
