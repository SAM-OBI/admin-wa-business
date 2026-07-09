/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '../../utils/logger';

// --- Telemetry & Business Metrics (User Timing API & Web Vitals) ---
export const BusinessMetrics = {
  markStart: (name: string) => performance.mark(`${name}_start`),
  markEnd: (name: string) => {
    const endMark = `${name}_end`;
    performance.mark(endMark);
    try {
      performance.measure(name, `${name}_start`, endMark);
      const entry = performance.getEntriesByName(name).pop();
      logger.info(`[Performance] ${name} took ${entry?.duration.toFixed(2)}ms`);
      // In production, this would send to Datadog/NewRelic
    } catch {
      // Ignore if start mark wasn't found
    }
  }
};

// Core Web Vitals (mock integration)
export function reportWebVitals() {
  if ('PerformanceObserver' in window) {
    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      logger.info(`[WebVital] LCP: ${lastEntry.startTime}ms`);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      logger.info(`[WebVital] CLS: ${clsValue}`);
    }).observe({ type: 'layout-shift', buffered: true });

    // Long Tasks
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logger.warn(`[Performance] Long Task detected: ${entry.duration}ms`);
      }
    }).observe({ type: 'longtask', buffered: true });
  }
}

// --- Feature Flags Context ---
interface FeatureFlags {
  enableNewWorkflowEditor: boolean;
  enableAgentPresence: boolean;
  enableOmnichannel: boolean;
}

const defaultFlags: FeatureFlags = {
  enableNewWorkflowEditor: true,
  enableAgentPresence: true,
  enableOmnichannel: false,
};

const FeatureFlagContext = createContext<FeatureFlags>(defaultFlags);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

  useEffect(() => {
    // Report vitals on boot
    reportWebVitals();

    // Mock fetching remote feature flags
    setTimeout(() => {
      setFlags({
        ...defaultFlags,
        enableOmnichannel: true // Gradual rollout
      });
    }, 1000);
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
