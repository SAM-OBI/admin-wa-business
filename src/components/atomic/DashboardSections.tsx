import React, { memo } from 'react';
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                    <FiDollarSign className="text-green-600" />
                </div>
                Treasury Health
            </h2>
            <StatusBadge status={data.status} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Liquidity Score</p>
                <div className="flex items-center gap-3">
                    <MetricValue value={data.liquidityScore} suffix="%" label="Liquidity Score" color={data.liquidityScore > 80 ? 'text-green-600' : 'text-amber-600'} />
                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div className={`h-full ${data.liquidityScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${data.liquidityScore}%` }} />
                    </div>
                </div>
            </div>
            
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Escrow Value</p>
                <MetricValue value={formatCurrency(data.totalEscrowValue)} label="Total Escrow" />
            </div>

            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Wallet Liability</p>
                <MetricValue value={formatCurrency(data.totalWalletLiability)} label="Wallet Liability" />
            </div>

            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Exposure Ratio</p>
                <MetricValue 
                    value={data.exposureRatio.toFixed(3)} 
                    label="Exposure Ratio" 
                    color={data.exposureRatio > 1 ? 'text-red-600' : 'text-green-600'} 
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Activity</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Live platform telemetry</p>
            </div>
            <Link to="/dashboard/audit-logs" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
                View Logs
            </Link>
        </div>
        <div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
            <div className="space-y-1">
                {activities.slice(0, 8).map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                        <div className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 font-bold truncate leading-relaxed">{getActivityText(activity)}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                <FiClock size={10} />
                                {formatDate(activity.createdAt)}
                            </div>
                        </div>
                        <FiArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    </div>
));
