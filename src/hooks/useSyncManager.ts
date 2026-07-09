import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

export type SyncState = 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'RETRY_FAILED';
export type ConflictPolicy = 'KEEP_SERVER' | 'KEEP_LOCAL' | 'MERGE' | 'MANUAL' | 'DOMAIN_HANDLER';

export interface QueueItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
  conflictPolicy: ConflictPolicy;
}

/**
 * Offline Sync Manager
 * Handles strictly ordered FIFO queuing, domain-specific conflict resolution, and offline inspection.
 */
class SyncManagerService {
  private static instance: SyncManagerService;
  private queue: QueueItem[] = [];
  private syncListeners: Set<(state: SyncState, queue: QueueItem[]) => void> = new Set();
  private currentState: SyncState = navigator.onLine ? 'SYNCED' : 'OFFLINE';
  
  private readonly MAX_RETRIES = 5;
  private isProcessing = false;

  private constructor() {
    this.loadQueue();
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  public static getInstance(): SyncManagerService {
    if (!SyncManagerService.instance) {
      SyncManagerService.instance = new SyncManagerService();
    }
    return SyncManagerService.instance;
  }

  public subscribe(listener: (state: SyncState, queue: QueueItem[]) => void) {
    this.syncListeners.add(listener);
    listener(this.currentState, [...this.queue]);
    return () => this.syncListeners.delete(listener);
  }

  private setState(newState: SyncState) {
    this.currentState = newState;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.syncListeners.forEach(listener => listener(this.currentState, [...this.queue]));
  }

  private loadQueue() {
    const saved = localStorage.getItem('shopvia_admin_offline_queue');
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
        if (this.queue.length > 0 && navigator.onLine) {
          this.processQueue();
        }
      } catch (e) {
        logger.error('Failed to load offline queue', e);
      }
    }
  }

  private saveQueue() {
    localStorage.setItem('shopvia_admin_offline_queue', JSON.stringify(this.queue));
    this.notifyListeners();
  }

  public enqueueRequest(
    url: string, 
    method: 'POST' | 'PUT' | 'DELETE', 
    payload: any, 
    conflictPolicy: ConflictPolicy = 'DOMAIN_HANDLER'
  ) {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      url,
      method,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      conflictPolicy
    };

    this.queue.push(item);
    this.saveQueue();

    if (navigator.onLine) {
      this.processQueue();
    } else {
      toast('Saved offline. Will sync when connected.', { icon: '📴' });
    }
  }
  
  public removeQueueItem(id: string) {
    this.queue = this.queue.filter(i => i.id !== id);
    this.saveQueue();
  }

  private handleOnline() {
    if (this.queue.length > 0) {
      this.processQueue();
    } else {
      this.setState('SYNCED');
      toast.success('Back Online');
    }
  }

  private handleOffline() {
    this.setState('OFFLINE');
    toast.error('You are currently offline');
  }

  private auditConflict(item: QueueItem, resolution: string, serverData?: any) {
    logger.info('Conflict Audit Log', {
      who: 'SystemSync', // Would be currentUser in a real app
      when: new Date().toISOString(),
      strategy: item.conflictPolicy,
      old: serverData,
      new: item.payload,
      resolution
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) return;
    
    this.isProcessing = true;
    this.setState('SYNCING');

    // Strict FIFO processing
    while (this.queue.length > 0) {
      const item = this.queue[0]; // peek head of queue

      try {
        const response = await api.request({
          url: item.url,
          method: item.method,
          data: item.payload,
          headers: {
            'X-Conflict-Policy': item.conflictPolicy,
            'X-Client-Timestamp': item.timestamp.toString()
          }
        });
        
        // Success or successfully merged/handled by domain handler
        if (response.headers['x-conflict-resolved']) {
           this.auditConflict(item, 'resolved-by-backend');
        }

        this.queue.shift();
        this.saveQueue();
      } catch (error: any) {
        if (!navigator.onLine) {
          this.setState('OFFLINE');
          break;
        }

        // If backend returns a 409 Conflict and policy is MANUAL, we freeze the queue.
        if (error.response?.status === 409 && item.conflictPolicy === 'MANUAL') {
          this.setState('RETRY_FAILED');
          toast.error('Manual conflict resolution required. Queue halted.');
          break; // Stop processing to preserve FIFO until manual intervention
        }

        item.retryCount++;
        
        if (item.retryCount > this.MAX_RETRIES) {
          this.auditConflict(item, 'dropped-max-retries');
          this.queue.shift();
          this.saveQueue();
          logger.error(`Dropped request after ${this.MAX_RETRIES} retries`, item);
          this.setState('RETRY_FAILED');
          toast.error('Some offline changes could not be synced.');
        } else {
          // Exponential backoff
          const backoffTime = Math.pow(2, item.retryCount) * 1000;
          this.saveQueue();
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    this.isProcessing = false;
    if (this.queue.length === 0 && navigator.onLine) {
      this.setState('SYNCED');
      toast.success('All changes synced');
    }
  }
}

export const syncManager = SyncManagerService.getInstance();

export function useSyncManager() {
  const [syncState, setSyncState] = useState<SyncState>('SYNCED');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state, q) => {
      setSyncState(state);
      setQueue(q);
    });
    return () => { unsubscribe(); };
  }, []);

  return {
    syncState,
    queue,
    enqueue: syncManager.enqueueRequest.bind(syncManager),
    removeQueueItem: syncManager.removeQueueItem.bind(syncManager)
  };
}
