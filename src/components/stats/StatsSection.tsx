import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';

interface StatsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function StatsSection({ title, children }: StatsSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
