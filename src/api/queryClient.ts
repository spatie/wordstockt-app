import { QueryClient } from '@tanstack/react-query';

// Shared singleton so non-React code (e.g. the axios 401 interceptor in
// client.ts) can reset the cache using the same instance the provider uses.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});
