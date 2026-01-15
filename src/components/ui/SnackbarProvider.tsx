import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';

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

const SNACKBAR_DURATION = 3000;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = 'info') => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState({ visible: true, message, type });
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setState((prev) => ({ ...prev, visible: false }));
    });
  }, [translateY, opacity]);

  useEffect(() => {
    if (state.visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timeoutRef.current = setTimeout(hideSnackbar, SNACKBAR_DURATION);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.visible, state.message, translateY, opacity, hideSnackbar]);

  const config = {
    success: {
      icon: 'checkmark-circle' as const,
      accentColor: '#22C55E',
    },
    error: {
      icon: 'alert-circle' as const,
      accentColor: '#EF4444',
    },
    info: {
      icon: 'information-circle' as const,
      accentColor: colors.primary,
    },
  }[state.type];

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {state.visible && (
        <Animated.View
          style={[
            styles.container,
            {
              top: insets.top + SPACING.md,
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[styles.snackbar, { borderLeftColor: config.accentColor }]}
          >
            <Ionicons
              name={config.icon}
              size={20}
              color={config.accentColor}
              style={styles.icon}
            />
            <Text style={styles.message}>{state.message}</Text>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      web: {
        pointerEvents: 'none',
      },
    }),
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
  },
  icon: {
    marginRight: SPACING.md,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
});
