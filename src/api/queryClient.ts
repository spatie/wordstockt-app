import { AppState, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

// React Native has no window focus events. Treat the app coming to the
// foreground as focus, so open screens (games list, open game, move history)
// refetch and interval polling pauses while the app is in the background.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (status) => {
      handleFocus(status === 'active');
    });

    return () => subscription.remove();
  });
}

// Shared singleton so non-React code (e.g. the axios 401 interceptor in
// client.ts) can reset the cache using the same instance the provider uses.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      // Without realtime updates, always refresh what's on screen when the
      // app comes back, even if the data isn't stale yet
      refetchOnWindowFocus: 'always',
    },
  },
});
