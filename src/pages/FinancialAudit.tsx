import React, { useState, useEffect, useCallback} from 'react';
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
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';

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

// 🛡️ [NOMBA-RECONCILE-1]
interface IntegrityIncident {
    _id: string;
    incidentId: string;
    type: string;
    severity: string;
    status: string;
    storeId?: { name?: string; slug?: string } | string | null;
    userId?: { name?: string; email?: string } | string | null;
    delta?: number;
    causationId?: string;
    metadata?: Record<string, any>;
    detectedAt: string;
}

const FinancialAudit: React.FC = () => {
    const [overview, setOverview] = useState<FinancialOverview | null>(null);
    const [reconciliation, setReconciliation] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalLog[]>([]);
    const [health, setHealth] = useState<TreasuryHealth | null>(null);
    const [multiSigRequests, setMultiSigRequests] = useState<MultiSigRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('NGN');
    // 🛡️ [NOMBA-RECONCILE-1]
    const [incidents, setIncidents] = useState<IntegrityIncident[]>([]);
    const [incidentStatusFilter, setIncidentStatusFilter] = useState('PENDING');
    // 🛡️ [ADMIN-STEP-UP-REPLICATE-1] /admin/multisig/approve/:id is gated by
    // requireSensitiveAction('APPROVE_MULTISIG') + requireJustification —
    // same gap as Governance.tsx's own multisig approval, separate call site.
    const [approveChallenge, setApproveChallenge] = useState<{ isOpen: boolean; id: string | null; reason: string | null }>({
        isOpen: false, id: null, reason: null
    });

    // 🛡️ [BATCH-10] Was a single fetchData keyed on [currency] that
    // Promise.all'd all 4 calls — only reconciliation's query actually uses
    // currency, so toggling the selector refetched overview/withdrawals/
    // multisig-requests for no reason. Split into a currency-independent
    // fetch (mount-only) and a currency-dependent one (reconciliation).
    const fetchStaticData = useCallback(async () => {
        try {
            const [overviewRes, withdrawalsRes, requestsRes] = await Promise.all([
                api.get('/admin/oversight/finance/overview'),
                api.get('/admin/oversight/finance/withdrawals'),
                adminService.getMultiSigRequests()
            ]);

            if (overviewRes.data.success) setOverview(overviewRes.data.data);
            if (withdrawalsRes.data.success) setWithdrawals(withdrawalsRes.data.data);
            if (requestsRes.success) setMultiSigRequests(requestsRes.data);
        } catch (error) {
            logger.error('Failed to fetch financial audit data:', error);
            toast.error('Failed to load financial oversight data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReconciliation = useCallback(async () => {
        try {
            const reconRes = await api.get(`/admin/oversight/finance/reconciliation?currency=${currency}`);
            if (reconRes.data.success) setReconciliation(reconRes.data.data);
        } catch (error) {
            logger.error('Failed to fetch reconciliation data:', error);
            toast.error('Failed to load reconciliation data');
        }
    }, [currency]);

    useEffect(() => {
        fetchStaticData();
    }, [fetchStaticData]);

    useEffect(() => {
        fetchReconciliation();
    }, [fetchReconciliation]);

    // 🛡️ [NOMBA-RECONCILE-1] Admin oversight for every FinanceIntegrityIncident
    // (ShopVia-vs-Nomba mismatches across withdrawal/subscription/ads-funding/
    // checkout, plus the pre-existing VENDOR_BALANCE_DRIFT type) — previously
    // these only ever reached an admin via a CRITICAL-only alert, with no
    // browsable view for any severity.
    const fetchIncidents = useCallback(async () => {
        try {
            const params = incidentStatusFilter ? `?status=${incidentStatusFilter}` : '';
            const res = await api.get(`/admin/oversight/finance/integrity-incidents${params}`);
            if (res.data.success) setIncidents(res.data.data.incidents);
        } catch (error) {
            logger.error('Failed to fetch finance integrity incidents:', error);
            toast.error('Failed to load finance integrity incidents');
        }
    }, [incidentStatusFilter]);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleApprove = async (id: string) => {
        const reason = window.prompt('Enter justification for this approval (min 5 characters):');
        if (!reason || reason.trim().length < 5) {
            if (reason !== null) toast.error('A valid justification (minimum 5 characters) is required.');
            return;
        }
        setApproveChallenge({ isOpen: true, id, reason });
    };

    const handleApproveChallengeSuccess = async (challengeToken: string) => {
        const { id, reason } = approveChallenge;
        if (!id || !reason) return;
        try {
            await adminService.approveMultiSigRequest(id, reason, challengeToken);
            toast.success('Consensus vote recorded');
            fetchStaticData();
            fetchReconciliation();
        } catch (err: any) {
            toast.error(err.normalized?.message || err.response?.data?.message || 'Approval failed');
        } finally {
            setApproveChallenge({ isOpen: false, id: null, reason: null });
        }
    };

    // 🛡️ [BATCH-10] These were previously new inline arrow functions on
    // every render, which made ResilientSocketWatcher's effect tear down
    // and re-subscribe (reconnect + new watchdog interval) constantly.
    const handleTreasuryPulse = useCallback((data: TreasuryHealth) => setHealth(data), []);
    const treasuryFallback = useCallback(() => adminService.getTreasuryHealth().then(res => res.data), []);

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
                        onPulse={handleTreasuryPulse}
                        fallbackAction={treasuryFallback}
                    />
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-sv-surface-muted border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest text-sv-text-primary focus:ring-1 focus:ring-primary/50 cursor-pointer"
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
                        {(() => {
                            // 🛡️ [FIX] This board read escrowIntegrity[0] (an
                            // arbitrary single store, not a platform total
                            // despite the "Platform Totals" label) and fields
                            // (escrowHeld, ledgerCheck.totalCredits/.walletSum)
                            // that no longer exist on
                            // GET /admin/oversight/finance/reconciliation's
                            // actual response shape (escrowIntegrity entries
                            // use totalEscrow, not escrowHeld; there is no
                            // ledgerCheck object at all - it's ledgerDrift +
                            // pendingProjections arrays). Every value here was
                            // silently reading undefined and rendering ₦0 or
                            // NaN regardless of real reconciliation state.
                            const escrowEntries: any[] = reconciliation?.escrowIntegrity || [];
                            const totalPricing = escrowEntries.reduce((sum, e) => sum + (e.totalPricing || 0), 0);
                            const totalEscrow = escrowEntries.reduce((sum, e) => sum + (e.totalEscrow || 0), 0);
                            const escrowVariance = totalPricing - totalEscrow;

                            const ledgerDrift: any[] = reconciliation?.ledgerDrift || [];
                            const pendingProjections: any[] = reconciliation?.pendingProjections || [];
                            const totalExpected = ledgerDrift.reduce((sum, e) => sum + (e.expected || 0), 0);
                            const totalActual = ledgerDrift.reduce((sum, e) => sum + (e.actual || 0), 0);
                            const totalLedgerVariance = ledgerDrift.reduce((sum, e) => sum + (e.variance || 0), 0);

                            return (
                                <>
                                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Settlement Integrity</h3>
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">V2 Safe Settlement</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                                <span className="text-[11px] font-bold text-gray-500">Platform Totals ({escrowEntries.length} stores)</span>
                                                <span className="font-black text-gray-900 dark:text-white text-sm">₦{(totalPricing / 100).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                                <span className="text-[11px] font-bold text-gray-500">Held in Vault</span>
                                                <span className="font-black text-gray-900 dark:text-white text-sm">₦{(totalEscrow / 100).toLocaleString()}</span>
                                            </div>
                                            <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(escrowVariance) > 1000 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Variance</p>
                                                    <p className={`text-xl font-black ${Math.abs(escrowVariance) > 1000 ? 'text-red-500' : 'text-green-500'}`}>
                                                        ₦{(escrowVariance / 100).toLocaleString()}
                                                    </p>
                                                </div>
                                                {Math.abs(escrowVariance) > 1000 && (
                                                    <FaExclamationTriangle className="text-red-500" size={20} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Ledger Consistency</h3>
                                            <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md">{ledgerDrift.length} store{ledgerDrift.length === 1 ? '' : 's'} drifted</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                                <span className="text-[11px] font-bold text-gray-500">Expected (Canonical Ledger)</span>
                                                <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{(totalExpected / 100).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                                <span className="text-[11px] font-bold text-gray-500">Actual (Store Balance)</span>
                                                <span className="font-black text-gray-900 dark:text-white text-sm">{currency === 'NGN' ? '₦' : '$'}{(totalActual / 100).toLocaleString()}</span>
                                            </div>
                                            <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(totalLedgerVariance) > 1000 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Balance Drift</p>
                                                    <p className={`text-xl font-black ${Math.abs(totalLedgerVariance) > 1000 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {currency === 'NGN' ? '₦' : '$'}{(totalLedgerVariance / 100).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {pendingProjections.length > 0 && (
                                                <p className="text-[10px] text-gray-400 font-medium pt-1">
                                                    {pendingProjections.length} more store{pendingProjections.length === 1 ? '' : 's'} showing expected replication lag (~60s), not counted as drift.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
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
                                            ? 'bg-sv-success-soft text-sv-success border-sv-success/30'
                                            : 'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
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

            {/* 🛡️ [NOMBA-RECONCILE-1] Finance Integrity Incidents — every
                ShopVia-vs-Nomba and ShopVia-vs-ShopVia mismatch the
                reconciliation sweeps have raised, across every money flow. */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white font-display uppercase tracking-widest">Finance Integrity Incidents</h3>
                    <select
                        value={incidentStatusFilter}
                        onChange={(e) => setIncidentStatusFilter(e.target.value)}
                        className="bg-sv-surface-muted border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest text-sv-text-primary focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="">All</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type / Flow</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Severity</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Detected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {incidents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-gray-400 font-bold">No incidents for this filter.</td></tr>
                            ) : incidents.map((incident) => (
                                <tr key={incident._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{incident.type}</p>
                                        {incident.metadata?.flow && (
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{incident.metadata.flow}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            incident.severity === 'CRITICAL'
                                                ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'
                                                : incident.severity === 'HIGH'
                                                    ? 'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
                                                    : 'bg-sv-info-soft text-sv-info border-sv-info/30'
                                        }`}>
                                            {incident.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">
                                            {typeof incident.userId === 'object' ? (incident.userId?.name || incident.userId?.email) : '—'}
                                        </p>
                                        <p className="text-[9px] text-gray-400">
                                            {typeof incident.storeId === 'object' ? incident.storeId?.name : '—'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-gray-900 dark:text-white text-xs">
                                            {typeof incident.delta === 'number' ? `₦${(Math.abs(incident.delta) / 100).toLocaleString()}` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-[10px] text-gray-500 truncate max-w-[160px]">{incident.causationId || incident.incidentId.slice(0, 12)}</p>
                                        {incident.metadata?.nombaRawStatus && (
                                            <p className="text-[9px] text-gray-400">ShopVia: {incident.metadata.shopviaStatus} / Nomba: {incident.metadata.nombaRawStatus}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-[10px] font-bold text-gray-500">{new Date(incident.detectedAt).toLocaleString()}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminSecurityChallengeModal
                isOpen={approveChallenge.isOpen}
                onClose={() => setApproveChallenge({ isOpen: false, id: null, reason: null })}
                action="APPROVE_MULTISIG"
                onSuccess={handleApproveChallengeSuccess}
            />
        </div>
    );
};

export default FinancialAudit;
