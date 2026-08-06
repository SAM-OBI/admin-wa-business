import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface QueryOptions<TData> {
  queryKey: string[];
  queryFn: () => Promise<TData>;
  staleTime?: number;
  refetchInterval?: number;
  enabled?: boolean;
}

interface QueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: number;
}

const queryCache = new Map<string, { data: any, timestamp: number }>();

/**
 * A lightweight alternative to React Query for environments where installation is restricted.
 * Implements Stale-While-Revalidate (SWR) and polling.
 */
export function useQuery<TData = any>({ 
  queryKey, 
  queryFn, 
  staleTime = 0, 
  refetchInterval = 0,
  enabled = true 
}: QueryOptions<TData>): QueryResult<TData> {
  const cacheKey = JSON.stringify(queryKey);
  
  const [data, setData] = useState<TData | undefined>(() => {
    const cached = queryCache.get(cacheKey);
    return cached ? cached.data : undefined;
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(!queryCache.has(cacheKey));
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(() => {
      const cached = queryCache.get(cacheKey);
      return cached ? cached.timestamp : 0;
  });

  const mountedRef = useRef(true);

  const fetchQuery = useCallback(async (ignoreStaleTime = false) => {
    if (!enabled) return;

    const cached = queryCache.get(cacheKey);
    const isStale = !cached || (Date.now() - cached.timestamp > staleTime);

    if (!isStale && !ignoreStaleTime) {
        return;
    }

    setIsFetching(true);
    setIsError(false);
    setError(null);

    try {
      const res = await queryFn();
      if (mountedRef.current) {
        setData(res);
        setLastUpdated(Date.now());
        queryCache.set(cacheKey, { data: res, timestamp: Date.now() });
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setIsError(true);
        setError(err);
        logger.error(`[useQuery] Query failed: ${cacheKey}`, err);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [cacheKey, enabled, queryFn, staleTime]);

  useEffect(() => {
    mountedRef.current = true;
    fetchQuery();

    let intervalId: any;
    if (refetchInterval > 0 && enabled) {
        intervalId = setInterval(() => {
            fetchQuery(true); // Ignore stale time on explicit polling
        }, refetchInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchQuery, refetchInterval, enabled]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: () => fetchQuery(true),
    lastUpdated
  };
}
