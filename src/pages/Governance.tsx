import { useState, useEffect } from 'react';
import { 
  FiShield, FiUsers, FiActivity, FiLock, FiCheckCircle, FiClock, FiAlertTriangle, FiCpu, FiRefreshCw
} from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { MultiSigRequest } from '../types';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';
import { useAdminGovernanceStepUp } from '../hooks/useAdminGovernanceStepUp';

export default function Governance() {
    const [requests, setRequests] = useState<MultiSigRequest[]>([]);
    const [isDegraded, setIsDegraded] = useState(false);
    const [activeTab, setActiveTab] = useState<'quorum' | 'paj' | 'forensics' | 'registry'>('quorum');

    const [pajLogs, setPajLogs] = useState<any[]>([]);
    const [anchors, setAnchors] = useState<any[]>([]);
    const [isAnchoring, setIsAnchoring] = useState(false);
    // 🛡️ [ADMIN-STEP-UP-REPLICATE-1] /admin/multisig/approve/:id is gated by
    // requireSensitiveAction('APPROVE_MULTISIG') + requireJustification —
    // was called with neither a token nor a reason, so approval always 403'd
    // (and would have 400'd on justification even past that).
    // 🛡️ [GOVERNANCE-ANCHOR-1] Widened to also drive execute's own
    // EXECUTE_MULTISIG challenge — same shape, different action/endpoint.
    const [approveChallenge, setApproveChallenge] = useState<{ isOpen: boolean; type: 'approve' | 'execute'; id: string | null; reason: string | null }>({
        isOpen: false, type: 'approve', id: null, reason: null
    });
    // 🛡️ [GOVERNANCE-ANCHOR-1] /admin/governance/anchor/manual is
    // ADMIN_CRITICAL_POLICY — governanceGuard() freshness AND a separate
    // requireSensitiveAction challenge token, same double-gate shape as
    // Settlement/Consolidation's fund-moving actions.
    const { execute: executeWithStepUp, modal: governanceStepUpModal } = useAdminGovernanceStepUp();
    const [anchorChallenge, setAnchorChallenge] = useState<{ isOpen: boolean; reason: string | null }>({
        isOpen: false, reason: null
    });



    const fetchData = async () => {
        // 🛡️ [BATCH-10] These 4 calls used to share one try/catch — the
        // multisig-requests call throwing (it's currently blocked by the
        // platform-wide isMfaVerified defect, tracked separately) meant
        // execution never reached the PAJ/anchors calls or the Sentinel
        // check below, on mount or on any of the 15s polls. Independent
        // try/catches so one failing endpoint can't suppress the others.
        try {
            const res = await adminService.getMultiSigRequests();
            if (res.data) setRequests(res.data);
        } catch (error) {
            console.error('Multisig requests fetch failed:', error);
        }

        try {
            // 🛡️ [BATCH-10] getPAJLogs's envelope nests the array under
            // `.logs` ({data:{logs:[...]}}) — this used to assign the whole
            // wrapper object to pajLogs instead of the array itself, so
            // pajLogs.length/.map silently no-op'd even when the request
            // succeeded.
            const pajRes = await adminService.getPAJLogs();
            if (pajRes.data?.logs) setPajLogs(pajRes.data.logs);
        } catch (error) {
            console.error('PAJ logs fetch failed:', error);
        }

        try {
            const anchorRes = await adminService.getGovernanceAnchors();
            if (anchorRes.data) setAnchors(anchorRes.data);
        } catch (error) {
            console.error('Governance anchors fetch failed:', error);
        }

        try {
            // 🛡️ [BATCH-10] Was `setIsDegraded(false)` with a "Simulate
            // Sentinel check" comment — a fabricated duplicate of the real,
            // already-working widget in GovernanceBanner.tsx. Calling the
            // same real endpoint here instead.
            const statusRes = await adminService.getGovernanceStatus();
            if (statusRes.data) setIsDegraded(statusRes.data.isDegraded);
        } catch (error) {
            console.error('Governance status fetch failed:', error);
        }
    };

    const handleManualAnchor = async () => {
        const Swal = (await import('sweetalert2')).default;
        const { value: reason } = await Swal.fire({
            title: 'Trigger Manual Anchor?',
            html: `
                <p class="mb-3">This forces a forensic-chain anchor point now, outside the normal adaptive schedule.</p>
                <textarea id="reason" class="swal2-textarea w-full" placeholder="Justification (min 5 chars)..." rows="3"></textarea>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Anchor Now',
            confirmButtonColor: '#0f172a',
            preConfirm: () => {
                const value = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
                if (!value || value.trim().length < 5) {
                    Swal.showValidationMessage('A justification of at least 5 characters is required.');
                    return false;
                }
                return value;
            }
        });

        if (reason) {
            setAnchorChallenge({ isOpen: true, reason });
        }
    };

    const handleAnchorChallengeSuccess = async (challengeToken: string) => {
        const { reason } = anchorChallenge;
        if (!reason) return;
        const Swal = (await import('sweetalert2')).default;
        setIsAnchoring(true);
        try {
            await executeWithStepUp(() => adminService.triggerManualAnchor(reason, challengeToken));
            Swal.fire('Anchored!', 'The forensic chain has been successfully anchored.', 'success');
            fetchData();
        } catch (err: any) {
            Swal.fire('Failed', err.response?.data?.message || err.message || 'Anchoring failed', 'error');
        } finally {
            setIsAnchoring(false);
            setAnchorChallenge({ isOpen: false, reason: null });
        }
    };

    const handleApprove = async (id: string) => {
        const Swal = (await import('sweetalert2')).default;
        const { value: reason } = await Swal.fire({
            title: 'Approve Multi-Sig Request',
            input: 'textarea',
            inputLabel: 'Justification (min 5 characters)',
            inputPlaceholder: 'Type your justification here...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value.trim().length < 5) return 'A valid justification (minimum 5 characters) is required.';
                return null;
            }
        });
        if (!reason) return;
        setApproveChallenge({ isOpen: true, type: 'approve', id, reason });
    };

    const handleApproveChallengeSuccess = async (challengeToken: string) => {
        const { type, id, reason } = approveChallenge;
        if (!id || !reason) return;
        try {
            if (type === 'approve') {
                await adminService.approveMultiSigRequest(id, reason, challengeToken);
            } else {
                await adminService.executeMultiSigRequest(id, reason, challengeToken);
            }
            fetchData();
        } catch (err: any) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire('Failed', err.response?.data?.message || err.message || (type === 'approve' ? 'Approval failed' : 'Execution failed'), 'error');
        } finally {
            setApproveChallenge({ isOpen: false, type: 'approve', id: null, reason: null });
        }
    };

    const handleExecute = async (id: string) => {
        const Swal = (await import('sweetalert2')).default;
        const { value: reason } = await Swal.fire({
            title: 'Execute Governance Action',
            text: 'This performs the actual mutation that was approved. It cannot be undone.',
            input: 'textarea',
            inputLabel: 'Justification (min 5 characters)',
            inputPlaceholder: 'Type your justification here...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Continue',
            inputValidator: (value) => {
                if (!value || value.trim().length < 5) return 'A valid justification (minimum 5 characters) is required.';
                return null;
            }
        });
        if (!reason) return;
        setApproveChallenge({ isOpen: true, type: 'execute', id, reason });
    };

    useEffect(() => {
        setTimeout(() => {
            fetchData();
        }, 0);
        // Reduced from 15s to 2m (120,000ms) to reduce network noise
        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* 🏛️ APEX HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sv-surface-elevated text-sv-text-primary p-6 sm:p-8 rounded-2xl border border-sv-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sv-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                        <FiShield className="text-sv-primary" /> Institutional Governance
                    </h1>
                    <p className="text-sv-text-muted mt-2 font-medium text-sm">Sovereign Control Plane & Forensic Trust (v107.6 APEX)</p>
                </div>

                <div className={`relative z-10 flex items-center gap-4 px-6 py-3 rounded-xl border transition-all duration-500 ${isDegraded ? 'bg-sv-danger-soft border-sv-danger/30 text-sv-danger' : 'bg-sv-success-soft border-sv-success/30 text-sv-success'}`}>
                    <div className="relative">
                        <FiCpu className={`text-2xl ${!isDegraded && 'animate-spin-slow'}`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isDegraded ? 'bg-sv-danger animate-pulse' : 'bg-sv-success animate-ping'}`}></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Sentinel Gateway</p>
                        <p className="font-bold text-sm uppercase">{isDegraded ? 'DEGRADED (READ-ONLY)' : 'Apex-Stabilized (ACTIVE)'}</p>
                    </div>
                </div>
            </div>

            {/* 📊 GOVERNANCE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-sv-primary/10 text-sv-primary rounded-xl"><FiUsers size={24} /></div>
                        <span className="text-[10px] font-black text-sv-text-muted uppercase">Pending Requests</span>
                    </div>
                    <h3 className="text-2xl font-black text-sv-text-primary">{requests.filter(r => r.status === 'PENDING').length}</h3>
                    <p className="text-xs text-sv-text-secondary mt-1 font-medium">Awaiting dual-authorization signature</p>
                </div>
                <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-sv-info-soft text-sv-info rounded-xl"><FiLock size={24} /></div>
                        <span className="text-[10px] font-black text-sv-text-muted uppercase">In Cooldown</span>
                    </div>
                    <h3 className="text-2xl font-black text-sv-text-primary">{requests.filter(r => r.status === 'COOLDOWN').length}</h3>
                    <p className="text-xs text-sv-text-secondary mt-1 font-medium">Approved, pending time-lock expiry</p>
                </div>
                <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-sv-warning-soft text-sv-warning rounded-xl"><FiActivity size={24} /></div>
                        <span className="text-[10px] font-black text-sv-text-muted uppercase">PAJ Entries (buffer)</span>
                    </div>
                    <h3 className="text-2xl font-black text-sv-text-primary">{pajLogs.length}</h3>
                    <p className="text-xs text-sv-text-secondary mt-1 font-medium">No automated consistency check exists yet</p>
                </div>
            </div>

            {/* 📑 MAIN INTERFACE */}
            <div className="bg-sv-surface rounded-2xl border border-sv-border shadow-sm overflow-hidden">
                <div className="flex border-b border-sv-border overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
                    <button 
                        onClick={() => setActiveTab('quorum')}
                        className={`flex-1 min-w-[140px] py-4 sm:py-6 font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'quorum' ? 'text-sv-primary bg-sv-primary/5 border-b-2 border-sv-primary' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                    >
                        Quorum Pipeline
                    </button>
                    <button 
                        onClick={() => setActiveTab('paj')}
                        className={`flex-1 min-w-[160px] py-4 sm:py-6 font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'paj' ? 'text-sv-primary bg-sv-primary/5 border-b-2 border-sv-primary' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                    >
                        Privileged Journal (PAJ)
                    </button>
                    <button 
                        onClick={() => setActiveTab('forensics')}
                        className={`flex-1 min-w-[150px] py-4 sm:py-6 font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'forensics' ? 'text-sv-primary bg-sv-primary/5 border-b-2 border-sv-primary' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                    >
                        Adaptive Anchoring
                    </button>
                    <button 
                        onClick={() => setActiveTab('registry')}
                        className={`flex-1 min-w-[150px] py-4 sm:py-6 font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'registry' ? 'text-sv-primary bg-sv-primary/5 border-b-2 border-sv-primary' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                    >
                        Sovereign Registry
                    </button>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                    {activeTab === 'quorum' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-sv-text-primary">Quorum Pipeline</h2>
                                    <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-widest mt-1">Governed Multi-Sig Authorization Queue</p>
                                </div>
                                <button onClick={fetchData} className="p-2 text-sv-text-muted hover:text-sv-primary transition-all"><FiRefreshCw /></button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {requests.length > 0 ? requests.map((req, i) => (
                                    <div key={req._id || i} className="p-4 sm:p-6 rounded-xl border border-sv-border bg-sv-surface-muted hover:bg-sv-surface transition-all">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                                        req.status === 'PENDING' ? 'bg-sv-warning-soft text-sv-warning' :
                                                        req.status === 'COOLDOWN' ? 'bg-sv-info-soft text-sv-info' :
                                                        'bg-sv-success-soft text-sv-success'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                    <h3 className="font-black text-sv-text-primary uppercase tracking-tight">{req.actionType}</h3>
                                                </div>

                                                <div className="bg-sv-surface p-4 rounded-xl border border-sv-border shadow-sm">
                                                    <p className="text-xs text-sv-text-secondary font-medium leading-relaxed">{req.description}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex -space-x-2">
                                                        {req.approvals.map((a: any, idx: number) => (
                                                            <div key={idx} title={a.role} className="w-8 h-8 rounded-full border-2 border-sv-border bg-sv-surface-elevated flex items-center justify-center text-[10px] font-black text-sv-text-primary uppercase">
                                                                {a.role[0]}
                                                            </div>
                                                        ))}
                                                        {Array.from({ length: req.requiredApprovals - req.approvals.length }).map((_, idx) => (
                                                            <div key={idx} className="w-8 h-8 rounded-full border-2 border-dashed border-sv-border bg-sv-surface flex items-center justify-center text-[10px] text-sv-text-muted">
                                                                ?
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Signatures</p>
                                                        <p className="text-xs font-black text-sv-text-primary">{req.approvals.length} / {req.requiredApprovals}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-start md:items-end gap-4 min-w-[200px]">
                                                <div className="md:text-right">
                                                    <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest flex items-center md:justify-end gap-1">
                                                        <FiClock /> {req.status === 'COOLDOWN' ? 'Cooldown Active' : 'Expires In'}
                                                    </p>
                                                    <p className="text-sm font-black text-sv-text-primary">
                                                        {req.status === 'COOLDOWN' ? (
                                                            <span className="text-sv-info animate-pulse">
                                                                {new Date(req.cooldownEnd || '').toLocaleTimeString()}
                                                            </span>
                                                        ) : (
                                                            new Date(req.expiresAt).toLocaleDateString()
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    {req.status === 'PENDING' && (
                                                        <button 
                                                            onClick={() => handleApprove(req._id)}
                                                            className="bg-sv-primary text-sv-text-inverse text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:bg-sv-primary-hover active:scale-95 transition-all shadow-sm"
                                                        >
                                                            Sign Transaction
                                                        </button>
                                                    )}
                                                    {req.status === 'COOLDOWN' && (
                                                        <button 
                                                            onClick={() => handleExecute(req._id)}
                                                            className="bg-sv-primary text-sv-text-inverse text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:bg-sv-primary-hover active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            <FiLock /> Commit Mutation
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-sv-text-muted border-2 border-dashed border-sv-border rounded-2xl bg-sv-surface-muted">
                                        <FiActivity className="mx-auto text-sv-text-muted w-12 h-12 mb-4 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Governance Pipeline Clear</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'paj' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-sv-text-primary">Privileged Action Journal (PAJ)</h2>
                                    <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-widest mt-1">Immutable Ledger of Administrative Decisions</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={fetchData} className="p-2 text-sv-text-muted hover:text-sv-primary transition-all"><FiRefreshCw /></button>
                                    <button className="bg-sv-surface-muted text-sv-text-secondary border border-sv-border text-[10px] font-black uppercase px-4 py-2 rounded-xl hover:bg-sv-border transition-all">Verify Chain</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {pajLogs.length > 0 ? pajLogs.map((log: any, i) => (
                                    <div 
                                        key={log._id || i} 
                                        className={`p-4 sm:p-6 rounded-xl border transition-all ${
                                            log.riskTier === 'CRITICAL' ? 'border-sv-danger/30 bg-sv-danger-soft' :
                                            log.riskTier === 'HIGH' ? 'border-sv-warning/30 bg-sv-warning-soft' :
                                            'border-sv-border bg-sv-surface-muted'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                                    log.riskTier === 'CRITICAL' ? 'bg-sv-danger text-sv-text-inverse' :
                                                    log.riskTier === 'HIGH' ? 'bg-sv-warning text-sv-text-inverse' :
                                                    'bg-sv-primary text-sv-text-inverse'
                                                }`}>
                                                    {(log.admin?.name || 'S')[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                                            log.riskTier === 'CRITICAL' ? 'bg-sv-danger-soft text-sv-danger border border-sv-danger/30' :
                                                            log.riskTier === 'HIGH' ? 'bg-sv-warning-soft text-sv-warning border border-sv-warning/30' :
                                                            'bg-sv-surface text-sv-text-secondary border border-sv-border'
                                                        }`}>
                                                            {log.actionType}
                                                        </span>
                                                        <p className="text-sm font-black text-sv-text-primary">{log.admin?.name || 'System Actor'}</p>
                                                    </div>
                                                    <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest mt-1">
                                                        Risk Tier: <span className={
                                                            log.riskTier === 'CRITICAL' ? 'text-sv-danger' :
                                                            log.riskTier === 'HIGH' ? 'text-sv-warning' :
                                                            'text-sv-text-secondary'
                                                        }>{log.riskTier || 'NORMAL'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                                <div className="mt-2 flex items-center gap-2 sm:justify-end">
                                                    <span className="text-[8px] font-black text-sv-text-muted uppercase tracking-widest">Anomaly</span>
                                                    <span className={`text-xs font-black ${
                                                        (log.anomalyScore || 0) > 70 ? 'text-sv-danger' :
                                                        (log.anomalyScore || 0) > 40 ? 'text-sv-warning' :
                                                        'text-sv-success'
                                                    }`}>
                                                        {log.anomalyScore || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🛡️ [v107.7] Semantic Summary & Risk Visualization */}
                                        <div className="bg-sv-surface rounded-xl border border-sv-border p-4 mb-4 shadow-sm">
                                            <div className="text-[9px] font-black uppercase text-sv-text-muted tracking-[0.2em] mb-2">Intent Visualization</div>
                                            <p className="text-xs text-sv-text-secondary font-medium leading-relaxed">
                                                {log.semanticSummary || log.description}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-sv-success-soft text-sv-success rounded-lg text-[9px] font-black uppercase tracking-widest border border-sv-success/30 flex items-center gap-1">
                                                    <FiCheckCircle size={10} /> Attested
                                                </span>
                                                <span className="text-[10px] font-mono text-sv-text-muted">
                                                    {(log.entryHash || 'pending').substring(0, 16)}...
                                                </span>
                                            </div>
                                            <div className="w-full sm:w-32 h-1.5 bg-sv-border rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${
                                                        (log.anomalyScore || 0) > 70 ? 'bg-sv-danger' :
                                                        (log.anomalyScore || 0) > 40 ? 'bg-sv-warning' :
                                                        'bg-sv-success'
                                                    }`}
                                                    style={{ width: `${log.anomalyScore || 5}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-sv-text-muted border-2 border-dashed border-sv-border rounded-2xl bg-sv-surface-muted">
                                        <FiLock className="mx-auto text-sv-text-muted w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No privileged logs in current buffer.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'forensics' && (
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-sv-text-primary">Adaptive Anchoring Pipeline</h2>
                                    <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-widest mt-1">Transaction-Bound Notarization Status</p>
                                </div>
                                <button 
                                    onClick={handleManualAnchor}
                                    disabled={isAnchoring}
                                    className="bg-sv-primary text-sv-text-inverse text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:bg-sv-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    {isAnchoring ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
                                    {isAnchoring ? 'Anchoring...' : 'Trigger Manual Anchor'}
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 rounded-2xl bg-sv-surface-muted border border-sv-border relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <FiActivity className="text-sv-border" size={64} />
                                </div>
                                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Anchors Recorded</p>
                                        <p className="text-3xl font-black text-sv-text-primary">{anchors.length}</p>
                                        <p className="text-[10px] text-sv-text-muted font-bold uppercase">Total in history</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Last Anchor</p>
                                        <p className="text-3xl font-black text-sv-text-primary">{anchors[0]?.createdAt ? new Date(anchors[0].createdAt).toLocaleTimeString() : '—'}</p>
                                        <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest">{anchors.length ? 'Most recent' : 'None yet'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Anchoring Schedule</p>
                                        <p className="text-xl font-black text-sv-text-primary">Adaptive</p>
                                        <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest">Every 100 entries or 5 min, plus manual</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">External Proof</p>
                                        <p className="text-xl font-black text-sv-text-muted">Not tracked</p>
                                        <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest">No WORM integration yet</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-sv-text-muted uppercase tracking-widest ml-1">Recent Anchor History</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {anchors.length > 0 ? anchors.slice(0, 5).map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-sv-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-sv-surface hover:bg-sv-surface-muted transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-sv-primary/10 text-sv-primary rounded-lg text-xs"><FiActivity /></div>
                                                <div>
                                                    <p className="text-xs font-black text-sv-text-primary">ANCHOR_{item._id.substring(item._id.length - 8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-mono text-sv-text-muted">Root: {(item.merkleRoot || 'unknown').substring(0, 12)}</p>
                                                </div>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="text-[10px] font-black text-sv-text-primary">{item.entryCount != null ? `${item.entryCount} Entries` : '—'}</p>
                                                <p className="text-[8px] text-sv-text-muted uppercase font-black">Finalized {new Date(item.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-sv-text-muted italic text-xs">No anchor history available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'registry' && (
                        <div className="py-20 text-center text-sv-text-muted italic">
                             Sovereign Registry Access Point (Restricted to Quorum-1 Admins)
                        </div>
                    )}
                </div>
            </div>

            {/* 🛡️ SECURITY ADVISORY */}
            <div className="bg-sv-info-soft border border-sv-info/20 p-4 sm:p-6 rounded-2xl flex items-start gap-4">
                <FiAlertTriangle className="text-sv-info text-xl mt-1 shrink-0" />
                <div>
                    <h5 className="font-black text-sv-info text-sm uppercase">Governance Note</h5>
                    <p className="text-sv-text-secondary text-xs mt-1 leading-relaxed font-medium">
                        All administrative actions on this dashboard are monitored by the <strong>ForensicChainService</strong>. 
                        Critical registry mutations require dual-signature consensus and are subject to a mandatory time-lock cooldown period.
                    </p>
                </div>
            </div>

            <AdminSecurityChallengeModal
                isOpen={approveChallenge.isOpen}
                onClose={() => setApproveChallenge({ isOpen: false, type: 'approve', id: null, reason: null })}
                action={approveChallenge.type === 'execute' ? 'EXECUTE_MULTISIG' : 'APPROVE_MULTISIG'}
                onSuccess={handleApproveChallengeSuccess}
            />
            {governanceStepUpModal}
            <AdminSecurityChallengeModal
                isOpen={anchorChallenge.isOpen}
                onClose={() => setAnchorChallenge({ isOpen: false, reason: null })}
                action="GOVERNANCE_MANUAL_ANCHOR"
                onSuccess={handleAnchorChallengeSuccess}
            />
        </div>
    );
}
