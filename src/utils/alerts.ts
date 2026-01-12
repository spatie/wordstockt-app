import { Alert } from 'react-native';
import { isWeb } from './platform';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Show a platform-aware alert dialog
 */
export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
): void {
  if (isWeb) {
    if (buttons && buttons.length > 1) {
      // Confirmation dialog
      const confirmButton = buttons.find((b) => b.style !== 'cancel');
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        confirmButton?.onPress?.();
      } else {
        const cancelButton = buttons.find((b) => b.style === 'cancel');
        cancelButton?.onPress?.();
      }
    } else {
      // Simple alert
      window.alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(
      title,
      message,
      buttons?.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: b.onPress,
      }))
    );
  }
}

/**
 * Show a confirmation dialog with Cancel and Confirm buttons
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirm',
  confirmStyle: 'default' | 'destructive' = 'default'
): void {
  showAlert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: confirmStyle, onPress: onConfirm },
  ]);
}
