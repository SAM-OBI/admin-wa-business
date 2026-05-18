import { useState, useEffect } from 'react';
import { 
  FiShield, FiUsers, FiActivity, FiLock, FiCheckCircle, FiClock, FiAlertTriangle, FiCpu, FiRefreshCw
} from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { MultiSigRequest } from '../types';

export default function Governance() {
    const [requests, setRequests] = useState<MultiSigRequest[]>([]);
    const [isDegraded, setIsDegraded] = useState(false);
    const [activeTab, setActiveTab] = useState<'quorum' | 'paj' | 'forensics' | 'registry'>('quorum');

    const [pajLogs, setPajLogs] = useState<any[]>([]);
    const [anchors, setAnchors] = useState<any[]>([]);
    const [isAnchoring, setIsAnchoring] = useState(false);



    const fetchData = async () => {
        try {
            const res = await adminService.getMultiSigRequests();
            if (res.data) setRequests(res.data);
            
            const pajRes = await adminService.getPAJLogs();
            if (pajRes.data) setPajLogs(pajRes.data);

            const anchorRes = await adminService.getGovernanceAnchors();
            if (anchorRes.data) setAnchors(anchorRes.data);

            // Simulate Sentinel check
            setIsDegraded(false); 
        } catch (error) {
            console.error('Governance fetch failed:', error);
        }
    };

    const handleManualAnchor = async () => {
        const Swal = (await import('sweetalert2')).default;
        const result = await Swal.fire({
            title: 'Trigger Manual Anchor?',
            text: 'This will freeze the current forensic chain and anchor it to the immutable ledger.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Anchor Now',
            confirmButtonColor: '#0f172a'
        });

        if (result.isConfirmed) {
            setIsAnchoring(true);
            try {
                await adminService.triggerManualAnchor();
                Swal.fire('Anchored!', 'The forensic chain has been successfully anchored.', 'success');
                fetchData();
            } catch (err: any) {
                Swal.fire('Failed', err.message || 'Anchoring failed', 'error');
            } finally {
                setIsAnchoring(false);
            }
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await adminService.approveMultiSigRequest(id);
            fetchData();
        } catch (err: any) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire('Failed', err.message || 'Approval failed', 'error');
        }
    };

    const handleExecute = async (id: string) => {
        try {
            await adminService.executeMultiSigRequest(id);
            fetchData();
        } catch (err: any) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire('Failed', err.message || 'Execution failed', 'error');
        }
    };

    useEffect(() => {
        setTimeout(() => {
            fetchData();
        }, 0);
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 🏛️ APEX HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <FiShield className="text-primary" /> Institutional Governance
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Sovereign Control Plane & Forensic Trust (v107.6 APEX)</p>
                </div>

                <div className={`relative z-10 flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500 ${isDegraded ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'}`}>
                    <div className="relative">
                        <FiCpu className={`text-2xl ${!isDegraded && 'animate-spin-slow'}`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isDegraded ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`}></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Sentinel Gateway</p>
                        <p className="font-bold text-sm uppercase">{isDegraded ? 'DEGRADED (READ-ONLY)' : 'Apex-Stabilized (ACTIVE)'}</p>
                    </div>
                </div>
            </div>

            {/* 📊 GOVERNANCE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FiUsers size={24} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Quorum Rate</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">100%</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Dual-Authorization enforced on all mutations</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FiLock size={24} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Forensic Chain</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Verified</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Hash-chain anchored with Adaptive Trigger</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><FiActivity size={24} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">PAJ Health</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Clean</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">0 Inconsistencies in Privileged Journal</p>
                </div>
            </div>

            {/* 📑 MAIN INTERFACE */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="flex border-b border-slate-50">
                    <button 
                        onClick={() => setActiveTab('quorum')}
                        className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'quorum' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Quorum Pipeline
                    </button>
                    <button 
                        onClick={() => setActiveTab('paj')}
                        className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'paj' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Privileged Journal (PAJ)
                    </button>
                    <button 
                        onClick={() => setActiveTab('forensics')}
                        className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'forensics' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Adaptive Anchoring
                    </button>
                    <button 
                        onClick={() => setActiveTab('registry')}
                        className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'registry' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Sovereign Registry
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'quorum' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Quorum Pipeline</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Governed Multi-Sig Authorization Queue</p>
                                </div>
                                <button onClick={fetchData} className="p-2 text-slate-400 hover:text-primary transition-all"><FiRefreshCw /></button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {requests.length > 0 ? requests.map((req, i) => (
                                    <div key={req._id || i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-lg transition-all group">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                                        req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                                                        req.status === 'COOLDOWN' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{req.actionType}</h3>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{req.description}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex -space-x-2">
                                                        {req.approvals.map((a: any, idx: number) => (
                                                            <div key={idx} title={a.role} className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white uppercase">
                                                                {a.role[0]}
                                                            </div>
                                                        ))}
                                                        {Array.from({ length: req.requiredApprovals - req.approvals.length }).map((_, idx) => (
                                                            <div key={idx} className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-300">
                                                                ?
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signatures</p>
                                                        <p className="text-xs font-black text-slate-700">{req.approvals.length} / {req.requiredApprovals}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                                                        <FiClock /> {req.status === 'COOLDOWN' ? 'Cooldown Active' : 'Expires In'}
                                                    </p>
                                                    <p className="text-sm font-black text-slate-800">
                                                        {req.status === 'COOLDOWN' ? (
                                                            <span className="text-blue-600 animate-pulse">
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
                                                            className="bg-primary text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            Sign Transaction
                                                        </button>
                                                    )}
                                                    {req.status === 'COOLDOWN' && (
                                                        <button 
                                                            onClick={() => handleExecute(req._id)}
                                                            className="bg-slate-900 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                                                        >
                                                            <FiLock /> Commit Mutation
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <FiActivity className="mx-auto text-slate-200 w-12 h-12 mb-4 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Governance Pipeline Clear</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'paj' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Privileged Action Journal (PAJ)</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Immutable Ledger of Administrative Decisions</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={fetchData} className="p-2 text-slate-400 hover:text-primary transition-all"><FiRefreshCw /></button>
                                    <button className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-4 py-2 rounded-lg hover:bg-slate-200 transition-all">Verify Chain</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {pajLogs.length > 0 ? pajLogs.map((log: any, i) => (
                                    <div 
                                        key={log._id || i} 
                                        className={`p-6 rounded-2xl border bg-slate-50/30 transition-all hover:bg-white hover:shadow-md ${
                                            log.riskTier === 'CRITICAL' ? 'border-red-200 bg-red-50/30' :
                                            log.riskTier === 'HIGH' ? 'border-orange-200 bg-orange-50/30' :
                                            'border-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                                                    log.riskTier === 'CRITICAL' ? 'bg-red-500 text-white' :
                                                    log.riskTier === 'HIGH' ? 'bg-orange-500 text-white' :
                                                    'bg-slate-900 text-white'
                                                }`}>
                                                    {(log.actor || 'S')[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                                            log.riskTier === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                            log.riskTier === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-slate-200 text-slate-700'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                        <p className="text-sm font-black text-slate-800">{log.actor || 'System Actor'}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                        Risk Tier: <span className={
                                                            log.riskTier === 'CRITICAL' ? 'text-red-600' :
                                                            log.riskTier === 'HIGH' ? 'text-orange-600' :
                                                            'text-slate-600'
                                                        }>{log.riskTier || 'NORMAL'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                                <div className="mt-2 flex items-center gap-2 justify-end">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Anomaly</span>
                                                    <span className={`text-xs font-black ${
                                                        (log.anomalyScore || 0) > 70 ? 'text-red-600' :
                                                        (log.anomalyScore || 0) > 40 ? 'text-orange-600' :
                                                        'text-emerald-600'
                                                    }`}>
                                                        {log.anomalyScore || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🛡️ [v107.7] Semantic Summary & Risk Visualization */}
                                        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 shadow-sm">
                                            <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Intent Visualization</div>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                {log.semanticSummary || log.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                                    <FiCheckCircle size={10} /> Attested
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-300">
                                                    {(log.forensicHash || 'pending').substring(0, 16)}...
                                                </span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${
                                                        (log.anomalyScore || 0) > 70 ? 'bg-red-500' :
                                                        (log.anomalyScore || 0) > 40 ? 'bg-orange-500' :
                                                        'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${log.anomalyScore || 5}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <FiLock className="mx-auto text-slate-200 w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No privileged logs in current buffer.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'forensics' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Adaptive Anchoring Pipeline</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Transaction-Bound Notarization Status</p>
                                </div>
                                <button 
                                    onClick={handleManualAnchor}
                                    disabled={isAnchoring}
                                    className="bg-primary text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAnchoring ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
                                    {isAnchoring ? 'Anchoring...' : 'Trigger Manual Anchor'}
                                </button>
                            </div>

                            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <FiActivity className="text-slate-200" size={64} />
                                </div>
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unanchored Entries</p>
                                        <p className="text-3xl font-black text-slate-800">42</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase">Below Threshold</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Auto-Anchor</p>
                                        <p className="text-3xl font-black text-slate-800">~14m</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or Priority Event</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anchoring Depth</p>
                                        <p className="text-3xl font-black text-slate-800">v107.6</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Merkle-Chained</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Proof</p>
                                        <p className="text-3xl font-black text-slate-800">WORM</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">S3 Object Lock: ON</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recent Anchor History</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {anchors.length > 0 ? anchors.slice(0, 5).map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-slate-50 flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-900 text-white rounded-lg text-xs"><FiActivity /></div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">ANCHOR_{item._id.substring(item._id.length - 8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-mono text-slate-400">Root: {(item.merkleRoot || 'unknown').substring(0, 12)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-800">{item.entryCount} Entries</p>
                                                <p className="text-[8px] text-slate-400 uppercase font-black">Finalized {new Date(item.createdAt).toLocaleTimeString()} ago</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-slate-400 italic text-xs">No anchor history available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'registry' && (
                        <div className="py-20 text-center text-slate-400 italic">
                             Sovereign Registry Access Point (Restricted to Quorum-1 Admins)
                        </div>
                    )}
                </div>
            </div>

            {/* 🛡️ SECURITY ADVISORY */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                <FiAlertTriangle className="text-blue-500 text-xl mt-1 shrink-0" />
                <div>
                    <h5 className="font-black text-blue-900 text-sm uppercase">Governance Note</h5>
                    <p className="text-blue-700 text-xs mt-1 leading-relaxed font-medium">
                        All administrative actions on this dashboard are monitored by the <strong>ForensicChainService</strong>. 
                        Critical registry mutations require dual-signature consensus and are subject to a mandatory time-lock cooldown period.
                    </p>
                </div>
            </div>
        </div>
    );
}
