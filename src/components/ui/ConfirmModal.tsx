import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = colors.primary,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: '#F39C12' }]}>
          <Text style={styles.iconText}>?</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttons}>
        <Button
          label={cancelText}
          onPress={onCancel}
          variant="secondary"
          rounded
          size="lg"
          disabled={isLoading}
          style={styles.button}
        />
        <Button
          label={confirmText}
          onPress={onConfirm}
          color={confirmColor}
          rounded
          size="lg"
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
