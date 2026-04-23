import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaWallet, 
    FaHistory, 
    FaArrowDown, 
    FaShieldAlt,
    FaExclamationTriangle
} from 'react-icons/fa';
import api from '../api/axios';
import { adminService } from '../api/admin.service';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';
import { TreasuryHealth, MultiSigRequest } from '../types';
import { TreasuryPulseChart } from '../components/TreasuryPulseChart';
import { MultiSigInbox } from '../components/MultiSigInbox';
import { ResilientSocketWatcher } from '../components/ResilientSocketWatcher';
import PageLoader from '../components/PageLoader';

interface FinancialOverview {
    systemBalances: {
        totalAvailable: number;
        totalSettlementValue: number;
        totalEscrow?: number; // Legacy Fallback
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
    const [health, setHealth] = useState<TreasuryHealth | null>(null);
    const [multiSigRequests, setMultiSigRequests] = useState<MultiSigRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('NGN');

    const fetchData = useCallback(async () => {
        try {
            const [overviewRes, withdrawalsRes, reconRes, requestsRes] = await Promise.all([
                api.get('/admin/oversight/finance/overview'),
                api.get('/admin/oversight/finance/withdrawals'),
                api.get(`/admin/oversight/finance/reconciliation?currency=${currency}`),
                adminService.getMultiSigRequests()
            ]);
            
            if (overviewRes.data.success) setOverview(overviewRes.data.data);
            if (withdrawalsRes.data.success) setWithdrawals(withdrawalsRes.data.data);
            if (reconRes.data.success) setReconciliation(reconRes.data.data);
            if (requestsRes.success) setMultiSigRequests(requestsRes.data);
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

    const handleApprove = async (id: string) => {
        try {
            await adminService.approveMultiSigRequest(id);
            toast.success('Consensus vote recorded');
            fetchData();
        } catch (err: any) {
            toast.error(err.normalized?.message || 'Approval failed');
        }
    };

    if (loading && !overview) return <PageLoader />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Connectivity Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FaShieldAlt size={20} />
                        </div>
                        Financial Operations <span className="text-primary/50 text-sm ml-2">v17.0</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Real-time interpreted liquidity and governance console.</p>
                </div>
                <div className="flex items-center gap-4">
                    <ResilientSocketWatcher 
                        onPulse={(data) => setHealth(data)} 
                        fallbackAction={() => adminService.getTreasuryHealth().then(res => res.data)}
                    />
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest text-gray-900 dark:text-white focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pulse & Reconciliation */}
                <div className="lg:col-span-2 space-y-6">
                    {health && <TreasuryPulseChart health={health} />}
                    
                    {/* Reconciliation Board */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Settlement Integrity</h3>
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">V2 Safe Settlement</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                    <span className="text-[11px] font-bold text-gray-500">Platform Totals</span>
                                    <span className="font-black text-gray-900 dark:text-white text-sm">₦{(reconciliation?.escrowIntegrity?.[0]?.totalPricing || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                    <span className="text-[11px] font-bold text-gray-500">Held in Vault</span>
                                    <span className="font-black text-gray-900 dark:text-white text-sm">₦{(reconciliation?.escrowIntegrity?.[0]?.escrowHeld || 0).toLocaleString()}</span>
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
                                    <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{reconciliation?.ledgerCheck?.totalCredits?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                    <span className="text-[11px] font-bold text-gray-500">Wallet Sum</span>
                                    <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{reconciliation?.ledgerCheck?.walletSum?.toLocaleString() || 0}</span>
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
                </div>

                {/* Governance Queue */}
                <div className="space-y-6">
                    <MultiSigInbox requests={multiSigRequests} onApprove={handleApprove} />
                    
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-4">Platform Balances</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-50 text-green-500 rounded-lg"><FaWallet size={12} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Available</span>
                                </div>
                                <span className="font-black text-sm">₦{(overview?.systemBalances.totalAvailable || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FaHistory size={12} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter text-blue-600">Settlement</span>
                                </div>
                                <span className="font-black text-sm">₦{(overview?.systemBalances.totalSettlementValue ?? overview?.systemBalances.totalEscrow ?? 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Feed */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white font-display uppercase tracking-widest">Forensic Withdrawal Feed</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Live Feed
                        </span>
                    </div>
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
                            {withdrawals.slice(0, 10).map((log: WithdrawalLog, idx: number) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialAudit;
