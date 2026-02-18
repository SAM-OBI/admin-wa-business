import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaWallet, 
    FaHistory, 
    FaArrowDown, 
    FaSync,
    FaUniversity,
    FaChartLine,
    FaExclamationTriangle
} from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface FinancialOverview {
    systemBalances: {
        totalAvailable: number;
        totalEscrow: number;
        storeCount: number;
    };
    withdrawals: {
        totalWithdrawn: number;
        count: number;
    };
}

interface WithdrawalLog {
    userName: string;
    userEmail: string;
    amount: number;
    status: string;
    reference: string;
    createdAt: string;
    description: string;
}

const FinancialAudit: React.FC = () => {
    const [overview, setOverview] = useState<FinancialOverview | null>(null);
    const [reconciliation, setReconciliation] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('NGN');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, withdrawalsRes, reconRes] = await Promise.all([
                api.get('/admin/oversight/finance/overview'),
                api.get('/admin/oversight/finance/withdrawals'),
                api.get(`/admin/oversight/finance/reconciliation?currency=${currency}`)
            ]);
            
            if (overviewRes.data.success) setOverview(overviewRes.data.data);
            if (withdrawalsRes.data.success) setWithdrawals(withdrawalsRes.data.data);
            if (reconRes.data.success) setReconciliation(reconRes.data.data);
        } catch (error) {
            logger.error('Failed to fetch financial audit data:', error);
            toast.error('Failed to load financial oversight data');
        } finally {
            setLoading(false);
        }
    }, [currency]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                            <FaUniversity size={20} />
                        </div>
                        Financial Oversight
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Reconciliation variance and platform liquidity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest text-gray-900 dark:text-white focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} size={12} />
                        Sync
                    </button>
                </div>
            </div>

            {/* Reconciliation Board */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Escrow Integrity</h3>
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">V1 Formula</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                            <span className="text-[11px] font-bold text-gray-500">Order Totals</span>
                            <span className="font-black text-gray-900 dark:text-white text-sm">₦{reconciliation?.escrowIntegrity?.[0]?.totalPricing.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                            <span className="text-[11px] font-bold text-gray-500">Escrow Held</span>
                            <span className="font-black text-gray-900 dark:text-white text-sm">₦{reconciliation?.escrowIntegrity?.[0]?.escrowHeld.toLocaleString() || 0}</span>
                        </div>
                        <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(reconciliation?.escrowIntegrity?.[0]?.totalPricing - reconciliation?.escrowIntegrity?.[0]?.escrowHeld) > 1000 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Variance</p>
                                <p className={`text-xl font-black ${Math.abs(reconciliation?.escrowIntegrity?.[0]?.totalPricing - reconciliation?.escrowIntegrity?.[0]?.escrowHeld) > 1000 ? 'text-red-500' : 'text-green-500'}`}>
                                    ₦{(reconciliation?.escrowIntegrity?.[0]?.totalPricing - reconciliation?.escrowIntegrity?.[0]?.escrowHeld || 0).toLocaleString()}
                                </p>
                            </div>
                            {Math.abs(reconciliation?.escrowIntegrity?.[0]?.totalPricing - reconciliation?.escrowIntegrity?.[0]?.escrowHeld) > 1000 && (
                                <FaExclamationTriangle className="text-red-500" size={20} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Ledger Consistency</h3>
                        <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md">V1 Formula</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                            <span className="text-[11px] font-bold text-gray-500">Total Credits</span>
                            <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{reconciliation?.ledgerCheck?.totalCredits.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                            <span className="text-[11px] font-bold text-gray-500">Wallet Sum</span>
                            <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{reconciliation?.ledgerCheck?.walletSum.toLocaleString() || 0}</span>
                        </div>
                        <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(reconciliation?.ledgerCheck?.totalCredits - reconciliation?.ledgerCheck?.walletSum) > 1000 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Balance Drift</p>
                                <p className={`text-xl font-black ${Math.abs(reconciliation?.ledgerCheck?.totalCredits - reconciliation?.ledgerCheck?.walletSum) > 1000 ? 'text-red-500' : 'text-green-500'}`}>
                                    {currency === 'NGN' ? '₦' : '$'}{(reconciliation?.ledgerCheck?.totalCredits - reconciliation?.ledgerCheck?.walletSum || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Vendor Balances</p>
                        <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                            <FaWallet size={14} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                        ₦{(overview?.systemBalances.totalAvailable || 0).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Across {overview?.systemBalances.storeCount || 0} Stores</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Escrow (Held)</p>
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                            <FaHistory size={14} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                        ₦{(overview?.systemBalances.totalEscrow || 0).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-tighter">Awaiting Release</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Lifecycle Payouts</p>
                        <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                            <FaChartLine size={14} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                        ₦{(overview?.withdrawals.totalWithdrawn || 0).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-purple-500 font-bold mt-1 uppercase">{overview?.withdrawals.count || 0} Withdrawals</p>
                </div>
            </div>

            {/* Recent Withdrawals Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white font-display uppercase tracking-widest">Withdrawal Feed</h3>
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Live
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {loading && withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center">
                                        <FaSync className="animate-spin text-gray-300 mx-auto mb-2" size={24} />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Loading Feed...</p>
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.slice(0, 10).map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white text-xs">{log.userName}</p>
                                            <p className="text-[9px] text-gray-400 truncate max-w-[120px]">{log.userEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
                                                <FaArrowDown className="text-red-500 text-[8px]" />
                                                ₦{log.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                log.status === 'completed' 
                                                ? 'bg-green-50 text-green-600 border-green-200' 
                                                : 'bg-orange-50 text-orange-600 border-orange-200'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-[10px] font-bold text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialAudit;
