import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
      <View style={[styles.containerOuter, error && styles.containerError]}>
        <BlurView intensity={25} tint="dark" style={styles.blur}>
          <View style={styles.container}>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              {...inputProps}
            />
            {rightElement}
          </View>
        </BlurView>
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
  containerOuter: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  blur: {
    backgroundColor: 'rgba(27, 40, 56, 0.7)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
