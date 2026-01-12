import React from 'react';
import { Snackbar } from 'react-native-paper';

interface ErrorSnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export function ErrorSnackbar({
  visible,
  message,
  onDismiss,
}: ErrorSnackbarProps) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={4000}
      action={{
        label: 'Dismiss',
        onPress: onDismiss,
      }}
    >
      {message}
    </Snackbar>
  );
}
