import axios from 'axios';
import { logger } from '../utils/logger';

const AuthState = {
    INITIALIZING: 'INITIALIZING',
    AUTHENTICATED: 'AUTHENTICATED',
    REFRESHING: 'REFRESHING',
    DEGRADED: 'DEGRADED',
    TERMINAL_FAILURE: 'TERMINAL_FAILURE'
} as const;

type AuthState = typeof AuthState[keyof typeof AuthState];

interface RefreshResult {
    accessToken: string;
}

/**
 * 🏛️ [INSTITUTIONAL] Admin Refresh Coordinator (v105.5)
 * 
 * Central authority for identity rotation in the Admin Dashboard.
 * Implements monotonic epoch reconciliation and state machine governance.
 */
class AdminRefreshCoordinator {
    private static instance: AdminRefreshCoordinator;
    private inflight: Promise<RefreshResult> | null = null;
    private state: AuthState = AuthState.INITIALIZING;
    private currentEpoch = 0;
    
    // Broadcast for multi-tab synchronization
    private channel = typeof window !== 'undefined' ? new BroadcastChannel('shopvia_admin_identity_sync_v1') : null;

    private constructor() {
        if (this.channel) {
            this.channel.onmessage = (event) => this.handleSyncEvent(event);
        }
        this.state = AuthState.AUTHENTICATED;
    }

    public static getInstance(): AdminRefreshCoordinator {
        if (!AdminRefreshCoordinator.instance) {
            AdminRefreshCoordinator.instance = new AdminRefreshCoordinator();
        }
        return AdminRefreshCoordinator.instance;
    }

    public async refresh(context: string = 'UNKNOWN'): Promise<RefreshResult> {
        if (this.state === AuthState.REFRESHING && this.inflight) {
            return this.inflight;
        }

        if (this.state === AuthState.TERMINAL_FAILURE) {
            throw new Error('Admin session is terminal.');
        }

        this.transitionTo(AuthState.REFRESHING);
        
        this.inflight = this.executeRefresh(context);
        
        try {
            const result = await this.inflight;
            this.transitionTo(AuthState.AUTHENTICATED);
            return result;
        } catch (err: any) {
            this.transitionTo(AuthState.TERMINAL_FAILURE);
            throw err;
        } finally {
            this.inflight = null;
        }
    }

    private async executeRefresh(context: string): Promise<RefreshResult> {
        const epoch = ++this.currentEpoch;
        logger.info(`[AdminRefresh] Initiating Epoch ${epoch} from ${context}`);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://api.shopvia.ng/api/v1';
            const { data } = await axios.post(`${baseUrl}/auth/refresh`, {}, { withCredentials: true });
            
            const accessToken = data.data?.accessToken || data.accessToken;
            if (!accessToken) throw new Error('No token in refresh response');

            // Sync other tabs
            this.channel?.postMessage({
                type: 'IDENTITY_ROTATED',
                token: accessToken,
                epoch,
                timestamp: Date.now()
            });

            return { accessToken };
        } catch (err) {
            logger.error(`[AdminRefresh] Epoch ${epoch} Failed`, err);
            throw err;
        }
    }

    private handleSyncEvent(event: MessageEvent) {
        if (event.data.type === 'IDENTITY_ROTATED') {
            const { token, epoch } = event.data;
            if (epoch > this.currentEpoch) {
                logger.info(`[AdminRefresh] Synchronizing with Epoch ${epoch} from other tab`);
                this.currentEpoch = epoch;
                sessionStorage.setItem('token', token);
                this.state = AuthState.AUTHENTICATED;
            }
        }
    }

    private transitionTo(newState: AuthState) {
        logger.debug(`[AdminRefresh] State Transition: ${this.state} -> ${newState}`);
        this.state = newState;
    }
}

export const refreshCoordinator = AdminRefreshCoordinator.getInstance();
