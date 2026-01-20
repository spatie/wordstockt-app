import { useState, useCallback } from 'react';
import { getApiError } from '../api/client';

interface UseApiErrorReturn {
  errorMessage: string | null;
  setError: (error: unknown) => void;
  setErrorMessage: (message: string) => void;
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
  const [errorMessage, setErrorMessageState] = useState<string | null>(null);

  const setError = useCallback((error: unknown) => {
    setErrorMessageState(getApiError(error).message);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    setErrorMessageState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessageState(null);
  }, []);

  return { errorMessage, setError, setErrorMessage, clearError };
}
