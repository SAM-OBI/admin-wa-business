import { useEffect, type DependencyList } from 'react';

type AbortableEffectCallback = (signal: AbortSignal) => void | (() => void);

/**
 * 🏛️ [INSTITUTIONAL] Cancellation-Safe Orchestration (v1.0)
 */
export function useAbortableEffect(effect: AbortableEffectCallback, deps?: DependencyList) {
  useEffect(() => {
    const controller = new AbortController();
    const cleanup = effect(controller.signal);

    return () => {
      controller.abort();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
