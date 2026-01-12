import React, { createContext, useContext, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { colors } from '../../config/theme';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = 'info') => {
      setState({ visible: true, message, type });
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const backgroundColor = {
    success: '#27AE60',
    error: '#E74C3C',
    info: colors.primary,
  }[state.type];

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={state.visible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={[styles.snackbar, { backgroundColor }]}
        action={{
          label: 'OK',
          textColor: '#FFFFFF',
          onPress: hideSnackbar,
        }}
      >
        {state.message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 20,
  },
});
