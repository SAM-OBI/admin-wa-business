import { useEffect, useLayoutEffect } from 'react';

/**
 * 🏛️ [INSTITUTIONAL] SSR-Safe Layout Effect
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
