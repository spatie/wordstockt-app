import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button label="Retry" onPress={onRetry} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  message: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontSize: 16,
    color: colors.textSecondary,
  },
  button: {
    marginTop: SPACING.sm,
  },
});
