import { useState, useEffect } from 'react';

// In a real enterprise system, this would connect to LaunchDarkly, Statsig, or a backend API.
// For now, it evaluates a local or environment-based flag configuration.
const defaultFlags: Record<string, boolean> = {
  'admin.dashboard.v2': true, // Enabling the new V2 experience by default
};

export function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultFlags[flagKey] || false);

  useEffect(() => {
    // Simulated remote fetch for flag status
    const fetchFlag = async () => {
      try {
        const storedOverride = localStorage.getItem(`ff_${flagKey}`);
        if (storedOverride !== null) {
          setIsEnabled(storedOverride === 'true');
        }
      } catch {
        // Fallback to default safely
      }
    };
    fetchFlag();
  }, [flagKey]);

  return isEnabled;
}

export function setFeatureFlagOverride(flagKey: string, value: boolean) {
  localStorage.setItem(`ff_${flagKey}`, value.toString());
  // Need to reload to take effect immediately in this basic implementation
  window.location.reload();
}
