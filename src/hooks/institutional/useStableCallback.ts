import { useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * 🏛️ [INSTITUTIONAL] Stable Callback Identity (v1.0)
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T | undefined): T {
  const callbackRef = useRef(callback);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: any[]) => {
    return callbackRef.current?.(...args);
  }, []) as T;
}
