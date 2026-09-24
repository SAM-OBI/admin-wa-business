import React, { memo} from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiClock, FiArrowRight } from 'react-icons/fi';
import { MetricValue, StatusBadge } from './DashboardAtoms';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TreasuryProps {
    data: {
        status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
        liquidityScore: number;
        totalEscrowValue: number;
        totalWalletLiability: number;
        exposureRatio: number;
    };
}

export const TreasuryMetrics: React.FC<TreasuryProps> = memo(({ data }) => (
    <div className="bg-surface-elevated rounded-2xl border border-subtle p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all hover:bg-surface group">
        <div className="flex items-center justify-between mb-10">
            <h2 className="font-black text-heading uppercase tracking-[0.2em] flex items-center gap-4 text-xs">
                <div className="p-2.5 bg-surface shadow-sm border border-subtle rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                    <FiDollarSign className="text-muted group-hover:text-emerald-400 transition-colors" />
                </div>
                Infrastructure Treasury Health (Live)
            </h2>
            <StatusBadge status={data.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Liquidity Score</p>
                <div className="flex items-center gap-4">
                    <MetricValue value={data.liquidityScore} suffix="%" label="Liquidity Score" color={data.liquidityScore > 80 ? 'text-emerald-500' : 'text-amber-500'} />
                    <div className="h-1.5 w-16 bg-surface rounded-full overflow-hidden shrink-0 border border-subtle">
                        <div className={`h-full ${data.liquidityScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${data.liquidityScore}%` }} />
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Escrow Value</p>
                <MetricValue value={formatCurrency(data.totalEscrowValue)} label="Total Escrow" color="text-heading" />
            </div>

            <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Wallet Liability</p>
                {/* 🛡️ [BATCH-11] No backend source exists for this metric yet
                    (needs its own accounting-scope decision — see decision
                    ledger) — showing a placeholder rather than a broken
                    currency string from an undefined value. */}
                <MetricValue value={data.totalWalletLiability != null ? formatCurrency(data.totalWalletLiability) : '—'} label="Wallet Liability" color="text-muted" />
            </div>

            <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Exposure Ratio</p>
                <MetricValue
                    value={data.exposureRatio.toFixed(3)}
                    label="Exposure Ratio"
                    color={data.exposureRatio > 1 ? 'text-red-500' : 'text-emerald-500'}
                    trend={data.exposureRatio > 1 ? 'up' : 'down'}
                />
            </div>
        </div>
    </div>
));

interface ActivityProps {
    activities: any[];
    getActivityIcon: (type: string) => React.ReactNode;
    getActivityText: (activity: any) => string;
}

export const RecentActivityFeed: React.FC<ActivityProps> = memo(({ activities, getActivityIcon, getActivityText }) => (
    <div className="bg-surface-elevated rounded-2xl border border-subtle backdrop-blur-sm overflow-hidden flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-subtle bg-surface/40 flex items-center justify-between">
            <div>
                <h2 className="text-xs font-black text-heading uppercase tracking-[0.2em]">Activity Registry</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1.5">Live infrastructure telemetry</p>
            </div>
            <Link to="/dashboard/audit-logs" className="text-[10px] font-black text-heading uppercase tracking-widest hover:text-muted transition-colors border border-subtle px-3 py-1.5 rounded-lg bg-surface">
                Analyze Logs
            </Link>
        </div>
        <div className="p-4 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted">
                    <FiClock size={24} className="mb-3 opacity-40" />
                    <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {activities.slice(0, 8).map((activity, index) => (
                        <div key={index} className="flex items-center gap-5 p-4 rounded-xl hover:bg-surface transition-all border border-transparent hover:border-subtle group">
                            <div className="p-2.5 bg-surface shadow-sm border border-subtle rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-body font-bold truncate tracking-tight">{getActivityText(activity)}</p>
                                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted font-black uppercase tracking-widest">
                                    <FiClock size={10} className="text-muted" />
                                    {formatDate(activity.createdAt)}
                                </div>
                            </div>
                            <FiArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
));
