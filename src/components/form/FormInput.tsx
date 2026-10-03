import type { ThemeColors } from '../../config/theme';
import {
  useThemeBlurTint,
  useThemeColors,
  useThemedStyles,
} from '../../hooks/useThemeColors';
import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
  const blurTint = useThemeBlurTint();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <View style={[styles.containerOuter, error && styles.containerError]}>
        <BlurView intensity={25} tint={blurTint} style={styles.blur}>
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      marginBottom: SPACING.lg,
    },
    containerOuter: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.controlBorder,
      overflow: 'hidden',
    },
    blur: {
      backgroundColor: colors.backgroundLight,
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
