import React, { memo } from 'react';

/**
 * MetricValue Component
 * Standardized display for numeric metrics with ARIA support
 */
interface MetricValueProps {
    value: string | number;
    prefix?: string;
    suffix?: string;
    label: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

export const MetricValue: React.FC<MetricValueProps> = memo(({ 
    value, prefix = '', suffix = '', label, trend, color = 'text-white' 
}) => {
    return (
        <div className="flex flex-col" aria-label={`${label}: ${prefix}${value}${suffix}`}>
            <span className={`text-2xl font-black ${color} tracking-tight`}>
                {prefix}{value}{suffix}
            </span>
            {trend && (
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                    trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-zinc-500'
                }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} Baseline
                </span>
            )}
        </div>
    );
});

/**
 * StatusBadge Component
 * Accessible status indicators with consistent styling
 */
interface StatusBadgeProps {
    status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMERGENCY' | 'PENDING' | 'SUCCESS';
    label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = memo(({ status, label }) => {
    const getStyles = () => {
        switch (status) {
            case 'NORMAL':
            case 'SUCCESS':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'WARNING':
            case 'PENDING':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'CRITICAL':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'EMERGENCY':
                return 'bg-red-600 text-white border-red-700 animate-pulse';
            default:
                return 'bg-zinc-800 text-zinc-500 border-white/5';
        }
    };

    return (
        <span 
            role="status"
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStyles()}`}
        >
            {label || status}
        </span>
    );
});
