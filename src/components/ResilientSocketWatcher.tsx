import React, { useEffect, useState, useCallback, useRef } from 'react';
import { socketClient } from '../api/socket';

interface Props {
    onPulse: (data: any) => void;
    fallbackAction: () => Promise<any>;
    intervalMs?: number;
}

export const ResilientSocketWatcher: React.FC<Props> = ({ onPulse, fallbackAction, intervalMs = 30000 }) => {
    const [status, setStatus] = useState<'LIVE' | 'OFFLINE' | 'DEGRADED'>('OFFLINE');
    // 🛡️ [BATCH-10] The effect below used to depend on `lastPulse` (a piece
    // of state it also set), plus `onPulse`/`fallbackAction`, which
    // FinancialAudit.tsx passed as new inline arrow functions on every
    // render — together this tore down and re-ran the whole socket
    // subscription (reconnect + new watchdog interval) on essentially every
    // render. A ref lets the watchdog read the latest pulse time without the
    // effect needing to depend on it, and without triggering a re-render on
    // every pulse (lastPulse was never rendered).
    const lastPulseRef = useRef<Date | null>(null);

    const runFallback = useCallback(async () => {
        try {
            const data = await fallbackAction();
            onPulse(data);
            lastPulseRef.current = new Date();
            setStatus('DEGRADED'); // Using polling
        } catch (err) {
            console.error('Fallback polling failed:', err);
            setStatus('OFFLINE');
        }
    }, [fallbackAction, onPulse]);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const socket = socketClient.connect(token || undefined);

        const handleConnect = () => setStatus('LIVE');
        const handleDisconnect = () => setStatus('OFFLINE');
        const handlePulse = (data: any) => {
            onPulse(data);
            lastPulseRef.current = new Date();
            setStatus('LIVE');
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('TREASURY_PULSE', handlePulse);

        // Resilience: Watchdog for stale data
        const watchdog = setInterval(() => {
            const now = new Date();
            const last = lastPulseRef.current;
            if (!last || (now.getTime() - last.getTime() > intervalMs + 5000)) {
                console.warn('Socket pulse stale. Triggering fallback polling...');
                runFallback();
            }
        }, intervalMs);

        return () => {
            // 🛡️ [BATCH-10] Cleanup used to only remove the TREASURY_PULSE
            // listener — connect/disconnect listeners were never removed,
            // so they accumulated unboundedly across every re-subscription.
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('TREASURY_PULSE', handlePulse);
            clearInterval(watchdog);
        };
    }, [onPulse, fallbackAction, intervalMs, runFallback]);

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
                status === 'LIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 
                status === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                System: {status}
            </span>
        </div>
    );
};
