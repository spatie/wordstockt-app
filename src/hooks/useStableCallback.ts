import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * A function with a stable identity that always calls the latest `callback`.
 * Pass it to memoized children so they don't re-render just because a parent
 * recreated its handler.
 */
export function useStableCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result
): (...args: Args) => Result {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
