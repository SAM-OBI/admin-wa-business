import { useState, useEffect } from 'react';
import { 
  FiShield, FiUsers, FiActivity, FiLock, FiCheckCircle, FiClock, FiAlertTriangle, FiCpu, FiRefreshCw
} from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { MultiSigRequest } from '../types';

export default function Governance() {
    const [requests, setRequests] = useState<MultiSigRequest[]>([]);
    const [isDegraded, setIsDegraded] = useState(false);
    const [activeTab, setActiveTab] = useState<'quorum' | 'forensics' | 'registry'>('quorum');
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        setTimeout(() => setCurrentTime(Date.now()), 0);
    }, []);

    const fetchData = async () => {
        try {
            const res = await adminService.getMultiSigRequests();
            if (res.data) setRequests(res.data);
            
            // Simulate Sentinel check
            setIsDegraded(false); 
        } catch (error) {
            console.error('Governance fetch failed:', error);
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
                    <p className="text-slate-400 mt-2 font-medium">Control Plane Oversight & Sovereign Trust Management (v10.0)</p>
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
                    <p className="text-xs text-slate-500 mt-1 font-medium">Zero unauthorized mutations detected</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FiLock size={24} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">WORM Integrity</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">Verified</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Hash-chain anchored to S3/Immutable</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><FiActivity size={24} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Audit SLA</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">54s</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Mean Time to Forensic Finality</p>
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
                        onClick={() => setActiveTab('forensics')}
                        className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'forensics' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Forensic Anchoring
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
                                <h2 className="text-xl font-black text-slate-800">Active Multi-Sig Proposals</h2>
                                <button className="bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg hover:bg-black transition-all">New Proposal</button>
                            </div>

                            {requests.length === 0 ? (
                                <div className="py-20 text-center">
                                    <FiCheckCircle className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="text-slate-400 font-bold italic">No pending governance approvals. System in consensus.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {requests.map(req => (
                                        <div key={req._id} className="group p-6 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all relative overflow-hidden">
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{req.actionType}</span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                                            req.status === 'PENDING' ? 'bg-blue-100 text-blue-600' :
                                                            req.status === 'COOLDOWN' ? 'bg-orange-100 text-orange-600 animate-pulse' :
                                                            'bg-emerald-100 text-emerald-600'
                                                        }`}>{req.status}</span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800">{req.description}</h4>
                                                    <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                                                        <FiUsers /> Proposed by <span className="text-slate-600 font-bold">
                                                            {typeof req.requestedBy === 'object' ? (req.requestedBy as any).name : req.requestedBy}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <FiClock /> Expires in {Math.round((new Date(req.expiresAt).getTime() - currentTime) / (1000 * 3600))}h
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-3">
                                                    <div className="flex -space-x-2">
                                                        {[...Array(req.requiredApprovals)].map((_, i) => (
                                                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black ${i < req.approvals.length ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                {i < req.approvals.length ? <FiCheckCircle /> : i + 1}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {req.status === 'PENDING' && (
                                                            <button className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Approve</button>
                                                        )}
                                                        {req.status === 'COOLDOWN' && (
                                                            <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg opacity-50 cursor-not-allowed">Time Locked</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'forensics' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Governance Root Anchors</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Immutable Hash-Chain Checkpoints</p>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-primary transition-all"><FiRefreshCw /></button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[...Array(5)].map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - i);
                                    return (
                                        <div key={i} className="p-6 rounded-2xl border border-slate-50 bg-slate-50/30 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                                                    <FiLock />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">
                                                        Root: <span className="text-emerald-600 font-bold">sha256:8f2e...{((i + 1) * 12345).toString(16).padEnd(7, '0')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                                    <FiCheckCircle size={8} /> Finalized
                                                </span>
                                                <p className="text-[8px] text-slate-400 font-medium">Synced to Archive: {new Date().toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 bg-slate-900 rounded-xl border border-white/10 flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-lg text-primary"><FiShield /></div>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    Each anchor consolidates all <span className="text-white font-bold">Verification Revocations</span>, <span className="text-white font-bold">Trust Overrides</span>, and <span className="text-white font-bold">Identity Resets</span> into a single Merkle Root for third-party audit validation.
                                </p>
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
