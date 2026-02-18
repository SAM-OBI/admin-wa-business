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
    value, prefix = '', suffix = '', label, trend, color = 'text-gray-900' 
}) => {
    return (
        <div className="flex flex-col" aria-label={`${label}: ${prefix}${value}${suffix}`}>
            <span className={`text-2xl font-black ${color} tracking-tight`}>
                {prefix}{value}{suffix}
            </span>
            {trend && (
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
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
                return 'bg-green-100 text-green-700 border-green-200';
            case 'WARNING':
            case 'PENDING':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CRITICAL':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'EMERGENCY':
                return 'bg-red-600 text-white border-red-700 animate-pulse';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
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
