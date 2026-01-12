const useProduction = process.env.EXPO_PUBLIC_USE_PRODUCTION === 'true';
const isDev = __DEV__ && !useProduction;

export const API_BASE_URL = isDev
  ? 'https://wordstockt.com.test/api'
  : 'https://wordstockt.com/api';

export const WS_URL = isDev ? 'ws://localhost:8080' : 'wss://ws.wordstockt.com';

// React Query configuration
export const QUERY_CONFIG = {
  staleTime: 30_000, // 30 seconds
  retry: 2,
} as const;
