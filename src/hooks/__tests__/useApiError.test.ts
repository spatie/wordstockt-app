import { renderHook, act } from '@testing-library/react-native';
import { useApiError } from '../useApiError';

// Mock the API client
jest.mock('../../api/client', () => ({
  getApiError: jest.fn((error: unknown) => {
    if (error instanceof Error) {
      return { message: error.message, status: 500 };
    }
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      return {
        message: axiosError.response?.data?.message ?? 'Network error',
        status: axiosError.response?.status ?? 500,
      };
    }
    return { message: 'Unknown error', status: 500 };
  }),
}));

describe('useApiError', () => {
  it('should have null errorMessage initially', () => {
    const { result } = renderHook(() => useApiError());

    expect(result.current.errorMessage).toBeNull();
  });

  it('should set error message when setError is called with Error', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.setError(new Error('Test error message'));
    });

    expect(result.current.errorMessage).toBe('Test error message');
  });

  it('should set error message from axios-like error', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.setError({
        response: {
          data: { message: 'Server validation failed' },
          status: 400,
        },
      });
    });

    expect(result.current.errorMessage).toBe('Server validation failed');
  });

  it('should clear error message when clearError is called', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.setError(new Error('Some error'));
    });
    expect(result.current.errorMessage).toBe('Some error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.errorMessage).toBeNull();
  });

  it('should handle unknown error types', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.setError('string error');
    });

    expect(result.current.errorMessage).toBe('Unknown error');
  });

  it('should allow setting multiple errors sequentially', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.setError(new Error('First error'));
    });
    expect(result.current.errorMessage).toBe('First error');

    act(() => {
      result.current.setError(new Error('Second error'));
    });
    expect(result.current.errorMessage).toBe('Second error');
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useApiError());

    const firstSetError = result.current.setError;
    const firstClearError = result.current.clearError;

    rerender({});

    expect(result.current.setError).toBe(firstSetError);
    expect(result.current.clearError).toBe(firstClearError);
  });
});
