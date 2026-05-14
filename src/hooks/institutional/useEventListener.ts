import { useEffect } from 'react';
import { useStableCallback } from './useStableCallback';

/**
 * 🏛️ [INSTITUTIONAL] Passive DOM Observer (v1.0)
 */
export function useEventListener(
  eventName: string,
  handler: (event: any) => void,
  element: Window | Document | HTMLElement | null | undefined = typeof window !== 'undefined' ? window : null,
  options?: boolean | AddEventListenerOptions
) {
  const stableHandler = useStableCallback(handler);
  const optionsStr = JSON.stringify(options ?? { passive: true });

  useEffect(() => {
    if (!element || !element.addEventListener) return;
    const parsedOptions = JSON.parse(optionsStr);
    element.addEventListener(eventName, stableHandler as EventListener, parsedOptions);
    return () => {
      element.removeEventListener(eventName, stableHandler as EventListener, parsedOptions);
    };
  }, [eventName, element, optionsStr, stableHandler]);
}
