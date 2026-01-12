import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { colors } from '../../config/theme';
import { DIMENSIONS, RADIUS, SPACING } from '../../config/constants';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  error?: string;
  rightElement?: React.ReactNode;
}

export function FormInput({
  error,
  rightElement,
  ...inputProps
}: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, error && styles.containerError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          {...inputProps}
        />
        {rightElement}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING.lg,
    height: DIMENSIONS.inputHeight,
  },
  containerError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
