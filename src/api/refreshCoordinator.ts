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

    private initializationPromise: Promise<void> | null = null;
    private initResolver: (() => void) | null = null;

    private constructor() {
        this.initializationPromise = new Promise((resolve) => {
            this.initResolver = resolve;
        });

        // 🛡️ [v105.8] Institutional Initialization Deadlock Guard (5s)
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                if (this.state === AuthState.INITIALIZING) {
                    logger.warn('[Forensic:Trace] 🛡️ ADMIN_INIT_DEADLOCK_DETECTED (5s). Forcing DEGRADED state.');
                    this.transitionTo(AuthState.DEGRADED);
                    this.initResolver?.();
                }
            }, 5000);
        }

        if (this.channel) {
            this.channel.onmessage = (event) => this.handleSyncEvent(event);
        }
    }

    public static getInstance(): AdminRefreshCoordinator {
        if (!AdminRefreshCoordinator.instance) {
            AdminRefreshCoordinator.instance = new AdminRefreshCoordinator();
        }
        return AdminRefreshCoordinator.instance;
    }

    public async refresh(context: string = 'UNKNOWN'): Promise<RefreshResult> {
        // 🛡️ [v105.8] Initialization Gating
        if (this.state === AuthState.INITIALIZING) {
            logger.debug(`[AdminRefresh] requested during INITIALIZING. Waiting for boot epoch...`);
            await this.initializationPromise;
        }

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
            // 🛡️ [FIX] Every refresh failure used to go straight to
            // TERMINAL_FAILURE — a one-way state with zero legal exits
            // (see transitionTo's legalTransitions map). Since axios.ts
            // short-circuits every subsequent 401 straight to a forced
            // /login redirect once TERMINAL_FAILURE is set, a single
            // transient failure (network blip, the refresh-rate-limiter's
            // 429, auth.service.ts's 503/409 "DB unready"/"concurrent
            // refresh, please retry" responses) permanently logged the
            // vendor out of the whole session on the very next 401,
            // regardless of whether the backend had already recovered.
            // auth.controller.ts's refresh() only ever returns 401 for a
            // definitively dead session (expired/revoked/invalid refresh
            // token, version mismatch, absolute lifetime exceeded) — every
            // other status it can return (403/409/429/503, or no response
            // at all for a pure network failure) is explicitly retryable
            // by its own error messages ("please retry", "try again").
            // DEGRADED is the one state that can both receive this failure
            // and legally transition back to REFRESHING on the next call,
            // so only a genuine 401 earns the permanent lock.
            const status = err?.response?.status;
            const isDefinitivelyDead = status === 401;
            this.transitionTo(isDefinitivelyDead ? AuthState.TERMINAL_FAILURE : AuthState.DEGRADED);
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
        const legalTransitions: Record<AuthState, AuthState[]> = {
            [AuthState.INITIALIZING]: [AuthState.REFRESHING, AuthState.AUTHENTICATED, AuthState.DEGRADED, AuthState.TERMINAL_FAILURE],
            [AuthState.AUTHENTICATED]: [AuthState.REFRESHING, AuthState.DEGRADED, AuthState.TERMINAL_FAILURE],
            [AuthState.REFRESHING]: [AuthState.AUTHENTICATED, AuthState.DEGRADED, AuthState.TERMINAL_FAILURE],
            [AuthState.DEGRADED]: [AuthState.REFRESHING, AuthState.TERMINAL_FAILURE],
            [AuthState.TERMINAL_FAILURE]: [] 
        };

        if (!legalTransitions[this.state]?.includes(newState)) {
            logger.error(`[Admin:Identity] 🚨 ILLEGAL_STATE_TRANSITION: ${this.state} -> ${newState}`);
            return;
        }

        logger.debug(`[AdminRefresh] State Transition: ${this.state} -> ${newState}`);
        this.state = newState;

        // Resolve initialization gating on first successful state exit
        if (newState !== AuthState.INITIALIZING) {
            this.initResolver?.();
        }
    }

    public getState(): AuthState {
        return this.state;
    }
}

export const refreshCoordinator = AdminRefreshCoordinator.getInstance();
