import { useState, useEffect } from 'react';

import { logger } from '../utils/logger';

export type Capability = 
  | 'VIEW_DASHBOARD'
  | 'MANAGE_WORKFLOWS'
  | 'OVERRIDE_SLA'
  | 'REPLY_TICKET'
  | 'ESCALATE_TICKET'
  | 'MANAGE_USERS'
  | 'MANAGE_FINANCE';

interface CapabilitiesManifest {
  userId: string;
  capabilities: Capability[];
  expiresAt: string;
}

let cachedManifest: CapabilitiesManifest | null = null;
let fetchPromise: Promise<CapabilitiesManifest> | null = null;

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<Capability[]>(cachedManifest?.capabilities || []);
  const [loading, setLoading] = useState<boolean>(!cachedManifest);

  useEffect(() => {
    let isMounted = true;

    const fetchManifest = async () => {
      // Check cache validity (invalidate if expired)
      if (cachedManifest && new Date(cachedManifest.expiresAt) > new Date()) {
        setCapabilities(cachedManifest.capabilities);
        setLoading(false);
        return;
      }

      // Prevent concurrent identical fetches
      if (!fetchPromise) {
        fetchPromise = new Promise((resolve, reject) => {
          (async () => {
            try {
              // Mock API fetching the capability manifest from the backend
            // const res = await api.get('/cop/auth/capabilities');
            const mockResponse: CapabilitiesManifest = {
              userId: 'admin-123',
              capabilities: ['VIEW_DASHBOARD', 'MANAGE_WORKFLOWS', 'OVERRIDE_SLA', 'REPLY_TICKET', 'ESCALATE_TICKET'],
              expiresAt: new Date(Date.now() + 15 * 60000).toISOString() // Cache for 15 minutes
            };
            
            setTimeout(() => {
              cachedManifest = mockResponse;
              resolve(mockResponse);
            }, 300);
          } catch (err) {
            logger.error('Failed to fetch capabilities manifest', err);
            reject(err);
          }
        })();
        });
      }

      try {
        const manifest = await fetchPromise;
        if (isMounted) {
          setCapabilities(manifest.capabilities);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      } finally {
        fetchPromise = null;
      }
    };

    fetchManifest();

    return () => { isMounted = false; };
  }, []);

  const hasCapability = (cap: Capability) => capabilities.includes(cap);
  
  const invalidateCache = () => {
    cachedManifest = null;
  };

  return { capabilities, hasCapability, loading, invalidateCache };
}
