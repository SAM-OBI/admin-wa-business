import React from 'react';
import { TreasuryHealth } from '../types';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

interface Props {
    health: TreasuryHealth;
}

// Explicit static lookup — previously built via `bg-${color}-50/30`-style
// template-literal interpolation, which Tailwind's build-time class scanner
// cannot see. It only worked because the same literal class names happened
// to appear elsewhere in the codebase, keeping them from being purged. Each
// status here is a genuine business-meaning state (treasury health), so the
// success/warning/danger mapping is semantic, not an arbitrary re-skin.
const STATUS_STYLES: Record<'HEALTHY' | 'WARNING' | 'CRITICAL', {
    container: string;
    iconChip: string;
    statusText: string;
    drilldownBorder: string;
    drilldownIcon: string;
}> = {
    HEALTHY: {
        container: 'border-sv-success/30 bg-sv-success-soft',
        iconChip: 'bg-sv-success-soft text-sv-success',
        statusText: 'text-sv-success',
        drilldownBorder: 'border-sv-success',
        drilldownIcon: 'text-sv-success',
    },
    WARNING: {
        container: 'border-sv-warning/30 bg-sv-warning-soft',
        iconChip: 'bg-sv-warning-soft text-sv-warning',
        statusText: 'text-sv-warning',
        drilldownBorder: 'border-sv-warning',
        drilldownIcon: 'text-sv-warning',
    },
    CRITICAL: {
        container: 'border-sv-danger/30 bg-sv-danger-soft',
        iconChip: 'bg-sv-danger-soft text-sv-danger',
        statusText: 'text-sv-danger',
        drilldownBorder: 'border-sv-danger',
        drilldownIcon: 'text-sv-danger',
    },
};

export const TreasuryPulseChart: React.FC<Props> = ({ health }) => {
    const status = (health.interpretedStatus || 'HEALTHY') as keyof typeof STATUS_STYLES;
    const style = STATUS_STYLES[status] || STATUS_STYLES.HEALTHY;

    return (
        <div className={`p-6 rounded-[5px] border transition-all duration-500 ${style.container}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${style.iconChip}`}>
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sv-text-muted">Treasury Guard Status</h3>
                        <p className={`text-xl font-black ${style.statusText}`}>{status}</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[9px] font-bold text-sv-text-muted uppercase">Liquidity Ratio</p>
                    <p className="text-2xl font-black font-mono text-sv-text-primary">{health.liquidityRatio?.toFixed(2) || '0.00'}</p>
                </div>
            </div>

            {/* Drilldown Panel - Decision Transparency */}
            {health.drilldown && health.drilldown.mainCause !== 'NONE' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-[5px] bg-sv-surface/50 border-l-4 ${style.drilldownBorder}`}
                >
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className={`mt-1 ${style.drilldownIcon}`} />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-sv-text-secondary">Decision Context</p>
                            <p className="text-sm text-sv-text-secondary">
                                <span className="font-bold">Root Cause:</span> {health.drilldown.mainCause.replace(/_/g, ' ')}
                            </p>
                            <div className="mt-2 text-[10px] p-2 bg-sv-danger-soft text-sv-danger font-black rounded uppercase">
                                RECOMMENDED ACTION: {health.drilldown.recommendedAction.replace(/_/g, ' ')}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Micro-Interaction: Status Lockdown UI (Mock for Now) */}
            {status === 'CRITICAL' && (
                <div className="mt-4 animate-pulse">
                    <div className="bg-sv-danger text-sv-text-inverse text-[9px] font-black py-1 px-3 rounded-full uppercase text-center tracking-tighter">
                        Platform Protection Mode Active: Sensitivity-Based Gating Enabled
                    </div>
                </div>
            )}
        </div>
    );
};
