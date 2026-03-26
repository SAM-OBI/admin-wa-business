import React, { useEffect, useState, useCallback } from 'react';
import { socketClient } from '../api/socket';

interface Props {
    onPulse: (data: any) => void;
    fallbackAction: () => Promise<any>;
    intervalMs?: number;
}

export const ResilientSocketWatcher: React.FC<Props> = ({ onPulse, fallbackAction, intervalMs = 30000 }) => {
    const [status, setStatus] = useState<'LIVE' | 'OFFLINE' | 'DEGRADED'>('OFFLINE');
    const [lastPulse, setLastPulse] = useState<Date | null>(null);

    const runFallback = useCallback(async () => {
        try {
            const data = await fallbackAction();
            onPulse(data);
            setLastPulse(new Date());
            setStatus('DEGRADED'); // Using polling
        } catch (err) {
            console.error('Fallback polling failed:', err);
            setStatus('OFFLINE');
        }
    }, [fallbackAction, onPulse]);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const socket = socketClient.connect(token || undefined);

        socket.on('connect', () => setStatus('LIVE'));
        socket.on('disconnect', () => setStatus('OFFLINE'));
        socket.on('TREASURY_PULSE', (data) => {
            onPulse(data);
            setLastPulse(new Date());
            setStatus('LIVE');
        });

        // Resilience: Watchdog for stale data
        const watchdog = setInterval(() => {
            const now = new Date();
            if (!lastPulse || (now.getTime() - lastPulse.getTime() > intervalMs + 5000)) {
                console.warn('Socket pulse stale. Triggering fallback polling...');
                runFallback();
            }
        }, intervalMs);

        return () => {
            socket.off('TREASURY_PULSE');
            clearInterval(watchdog);
        };
    }, [onPulse, fallbackAction, intervalMs, lastPulse, runFallback]);

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
