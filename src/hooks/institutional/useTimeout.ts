import { useEffect, useRef } from 'react';
import { useStableCallback } from './useStableCallback';

/**
 * 🏛️ [INSTITUTIONAL] Deterministic Timeout (v1.0)
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const stableCallback = useStableCallback(callback);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (delay === null) return;
    
    timeoutRef.current = setTimeout(stableCallback, delay);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delay, stableCallback]);
}
