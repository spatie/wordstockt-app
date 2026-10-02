const useProduction = process.env.EXPO_PUBLIC_USE_PRODUCTION === 'true';
const isDev = __DEV__ && !useProduction;

export const API_BASE_URL = isDev
  ? 'https://wordstockt.com.test/api'
  : 'https://wordstockt.com/api';

export const WS_URL = isDev
  ? 'ws://localhost:8080'
  : 'wss://ws-a2e28c05-9860-48dc-acab-696497096468-reverb.laravel.cloud';

export const WS_APP_KEY = isDev ? 'wordstockt-key' : 'ZdALnHoTvbIlMlXNqNYU';

// React Query configuration
export const QUERY_CONFIG = {
  staleTime: 30_000, // 30 seconds
  retry: 2,
} as const;
