import { useState, useCallback } from 'react';
import { getApiError } from '../api/client';

interface UseApiErrorReturn {
  errorMessage: string | null;
  setError: (error: unknown) => void;
  clearError: () => void;
}

/**
 * Hook for consistent API error handling across the app.
 *
 * Usage:
 * ```tsx
 * const { errorMessage, setError, clearError } = useApiError();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await mutation.mutateAsync(data);
 *   } catch (err) {
 *     setError(err);
 *   }
 * };
 * ```
 */
export function useApiError(): UseApiErrorReturn {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setError = useCallback((error: unknown) => {
    setErrorMessage(getApiError(error).message);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return { errorMessage, setError, clearError };
}
