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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Connectivity Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sv-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-sv-border">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-sv-text-primary flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sv-accent-soft flex items-center justify-center text-sv-primary shrink-0">
                            <FaShieldAlt size={20} />
                        </div>
                        <span className="truncate">Financial Operations</span> <span className="text-sv-primary/60 text-xs sm:text-sm font-bold">v17.0</span>
                    </h1>
                    <p className="text-sv-text-secondary mt-1 text-xs sm:text-sm font-medium">Real-time interpreted liquidity and governance console.</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <ResilientSocketWatcher
                        onPulse={handleTreasuryPulse}
                        fallbackAction={treasuryFallback}
                    />
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-sv-surface-muted border border-sv-border/60 rounded-xl px-3 sm:px-4 py-2 font-black text-[10px] uppercase tracking-widest text-sv-text-primary focus:ring-1 focus:ring-sv-primary/50 cursor-pointer"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                                    <div className="bg-sv-surface p-4 sm:p-6 rounded-2xl border border-sv-border shadow-sm">
                                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                                            <h3 className="text-base sm:text-lg font-black text-sv-text-primary">Settlement Integrity</h3>
                                            <span className="text-[9px] font-black text-sv-info uppercase tracking-widest bg-sv-info-soft px-2.5 py-1 rounded-md border border-sv-info/30">V2 Safe Settlement</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-sv-surface-muted rounded-xl">
                                                <span className="text-[11px] font-bold text-sv-text-secondary">Platform Totals ({escrowEntries.length} stores)</span>
                                                <span className="font-black text-sv-text-primary text-sm">₦{(totalPricing / 100).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-sv-surface-muted rounded-xl">
                                                <span className="text-[11px] font-bold text-sv-text-secondary">Held in Vault</span>
                                                <span className="font-black text-sv-text-primary text-sm">₦{(totalEscrow / 100).toLocaleString()}</span>
                                            </div>
                                            <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(escrowVariance) > 1000 ? 'border-sv-danger/40 bg-sv-danger-soft' : 'border-sv-success/40 bg-sv-success-soft'}`}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-sv-text-secondary">Variance</p>
                                                    <p className={`text-lg sm:text-xl font-black ${Math.abs(escrowVariance) > 1000 ? 'text-sv-danger' : 'text-sv-success'}`}>
                                                        ₦{(escrowVariance / 100).toLocaleString()}
                                                    </p>
                                                </div>
                                                {Math.abs(escrowVariance) > 1000 && (
                                                    <FaExclamationTriangle className="text-sv-danger" size={20} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-sv-surface p-4 sm:p-6 rounded-2xl border border-sv-border shadow-sm">
                                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                                            <h3 className="text-base sm:text-lg font-black text-sv-text-primary">Ledger Consistency</h3>
                                            <span className="text-[9px] font-black text-sv-tag uppercase tracking-widest bg-sv-tag-soft px-2.5 py-1 rounded-md border border-sv-tag/30">{ledgerDrift.length} store{ledgerDrift.length === 1 ? '' : 's'} drifted</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-sv-surface-muted rounded-xl">
                                                <span className="text-[11px] font-bold text-sv-text-secondary">Expected (Canonical Ledger)</span>
                                                <span className="font-black text-sv-text-primary text-sm">{currency === 'NGN' ? '₦' : '$'}{(totalExpected / 100).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-sv-surface-muted rounded-xl">
                                                <span className="text-[11px] font-bold text-sv-text-secondary">Actual (Store Balance)</span>
                                                <span className="font-black text-sv-text-primary text-sm">{currency === 'NGN' ? '₦' : '$'}{(totalActual / 100).toLocaleString()}</span>
                                            </div>
                                            <div className={`flex justify-between items-center p-4 rounded-xl border ${Math.abs(totalLedgerVariance) > 1000 ? 'border-sv-danger/40 bg-sv-danger-soft' : 'border-sv-success/40 bg-sv-success-soft'}`}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-sv-text-secondary">Balance Drift</p>
                                                    <p className={`text-lg sm:text-xl font-black ${Math.abs(totalLedgerVariance) > 1000 ? 'text-sv-danger' : 'text-sv-success'}`}>
                                                        {currency === 'NGN' ? '₦' : '$'}{(totalLedgerVariance / 100).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {pendingProjections.length > 0 && (
                                                <p className="text-[10px] text-sv-text-muted font-medium pt-1">
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
                    
                    <div className="bg-sv-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-sv-border">
                        <p className="text-sv-text-muted text-[9px] font-black uppercase tracking-widest mb-4">Platform Balances</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-sv-success-soft text-sv-success rounded-lg"><FaWallet size={12} /></div>
                                    <span className="text-xs font-bold text-sv-text-secondary uppercase tracking-tight">Available</span>
                                </div>
                                <span className="font-black text-sm text-sv-text-primary">₦{(overview?.systemBalances.totalAvailable || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-sv-info-soft text-sv-info rounded-lg"><FaHistory size={12} /></div>
                                    <span className="text-xs font-bold text-sv-text-secondary uppercase tracking-tight">Settlement</span>
                                </div>
                                <span className="font-black text-sm text-sv-text-primary">₦{(overview?.systemBalances.totalSettlementValue ?? overview?.systemBalances.totalEscrow ?? 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Feed */}
            <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-sv-border flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-sv-text-primary uppercase tracking-widest">Forensic Withdrawal Feed</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-sv-success flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sv-success animate-pulse"></span>
                            Live Feed
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border scrollbar-track-transparent">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-sv-surface-muted border-b border-sv-border">
                            <tr>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Vendor</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Amount</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="px-4 sm:px-6 py-3.5 text-right text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sv-border">
                            {withdrawals.slice(0, 10).map((log: WithdrawalLog, idx: number) => (
                                <tr key={idx} className="hover:bg-sv-surface-muted/60 transition-colors group">
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <p className="font-bold text-sv-text-primary text-xs">{log.userName}</p>
                                        <p className="text-[9px] text-sv-text-muted truncate max-w-[120px]">{log.userEmail}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <span className="font-black text-sv-text-primary text-xs flex items-center gap-1.5">
                                            <FaArrowDown className="text-sv-danger text-[8px]" />
                                            ₦{log.amount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            log.status === 'completed' 
                                            ? 'bg-sv-success-soft text-sv-success border-sv-success/30'
                                            : 'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                                        <p className="text-[10px] font-bold text-sv-text-secondary">{new Date(log.createdAt).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🛡️ [NOMBA-RECONCILE-1] Finance Integrity Incidents */}
            <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-sv-border flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-base sm:text-lg font-black text-sv-text-primary uppercase tracking-widest">Finance Integrity Incidents</h3>
                    <select
                        value={incidentStatusFilter}
                        onChange={(e) => setIncidentStatusFilter(e.target.value)}
                        className="bg-sv-surface-muted border border-sv-border/60 rounded-xl px-3 sm:px-4 py-2 font-black text-[10px] uppercase tracking-widest text-sv-text-primary focus:ring-1 focus:ring-sv-primary/50 cursor-pointer"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="">All</option>
                    </select>
                </div>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border scrollbar-track-transparent">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-sv-surface-muted border-b border-sv-border">
                            <tr>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Type / Flow</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Severity</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Identity</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Amount</th>
                                <th className="px-4 sm:px-6 py-3.5 text-left text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Reference</th>
                                <th className="px-4 sm:px-6 py-3.5 text-right text-[9px] font-black text-sv-text-muted uppercase tracking-widest whitespace-nowrap">Detected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sv-border">
                            {incidents.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 sm:px-6 py-10 text-center text-xs text-sv-text-muted font-bold">No incidents for this filter.</td></tr>
                            ) : incidents.map((incident) => (
                                <tr key={incident._id} className="hover:bg-sv-surface-muted/60 transition-colors">
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <p className="font-bold text-sv-text-primary text-xs">{incident.type}</p>
                                        {incident.metadata?.flow && (
                                            <p className="text-[9px] text-sv-text-muted uppercase tracking-widest">{incident.metadata.flow}</p>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            incident.severity === 'CRITICAL'
                                                ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'
                                                : incident.severity === 'HIGH'
                                                    ? 'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
                                                    : 'bg-sv-info-soft text-sv-info border-sv-info/30'
                                        }`}>
                                            {incident.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <p className="font-bold text-sv-text-primary text-xs">
                                            {typeof incident.userId === 'object' ? (incident.userId?.name || incident.userId?.email) : '—'}
                                        </p>
                                        <p className="text-[9px] text-sv-text-muted">
                                            {typeof incident.storeId === 'object' ? incident.storeId?.name : '—'}
                                        </p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <span className="font-black text-sv-text-primary text-xs">
                                            {typeof incident.delta === 'number' ? `₦${(Math.abs(incident.delta) / 100).toLocaleString()}` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                        <p className="font-mono text-[10px] text-sv-text-secondary truncate max-w-[160px]">{incident.causationId || incident.incidentId.slice(0, 12)}</p>
                                        {incident.metadata?.nombaRawStatus && (
                                            <p className="text-[9px] text-sv-text-muted">ShopVia: {incident.metadata.shopviaStatus} / Nomba: {incident.metadata.nombaRawStatus}</p>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                                        <p className="text-[10px] font-bold text-sv-text-secondary">{new Date(incident.detectedAt).toLocaleString()}</p>
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
