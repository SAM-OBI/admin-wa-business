import React, { useState, useEffect } from 'react';
import { 
    FiAlertCircle, 
    FiRefreshCw, 
    FiClipboard,
    FiTerminal,
    FiPlay,
    FiClock
} from 'react-icons/fi';
import api from '../api/axios';
import { adminService } from '../api/admin.service';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface DLQEntry {
    _id: string;
    type: string;
    status: string;
    failureClassification?: string;
    lastError: string;
    errorChain: string[];
    quarantinedAt?: string;
    payload: any;
    metadata?: any;
    recipientId: string;
}

const DeadLetterQueue: React.FC = () => {
    const [entries, setEntries] = useState<DLQEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [replaying, setReplaying] = useState<string | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        setTimeout(() => setCurrentTime(Date.now()), 0);
    }, []);

    const fetchDLQ = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/notifications/outbox/quarantine');
            if (response.data.success) {
                setEntries(response.data.data);
            }
        } catch (error) {
            logger.error('Failed to fetch DLQ:', error);
            toast.error('Failed to load Dead Letter Queue');
        } finally {
            setLoading(false);
        }
    };

    const handleReplay = async (id: string) => {
        setReplaying(id);
        try {
            await adminService.replayNotificationOutbox(id);
            toast.success('Event re-queued for dispatch.');
            fetchDLQ();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Replay failed');
        } finally {
            setReplaying(null);
        }
    };

    useEffect(() => {
        fetchDLQ();
    }, []);

    const handleCopy = (entry: DLQEntry) => {
        navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
        toast.success('Entry details copied to clipboard');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                            <FiTerminal size={20} />
                        </div>
                        Dead Letter Queue
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Critical event failures requiring forensic review & replay.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchDLQ}
                        disabled={loading}
                        className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-gray-100 shadow-sm disabled:opacity-50"
                        title="Refresh Queue"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            {entries.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                    <FiAlertCircle className="text-orange-500 mt-1 shrink-0" size={20} />
                    <div>
                        <p className="text-orange-800 font-bold text-[11px] uppercase tracking-widest">Quarantine Active</p>
                        <p className="text-orange-700/80 text-xs mt-1 leading-relaxed">There are {entries.length} events in quarantine. Review the failure classification before re-initiating replay to prevent retry storms.</p>
                    </div>
                </div>
            )}

            {/* Entry List */}
            <div className="space-y-3">
                {entries.length === 0 && !loading ? (
                    <div className="bg-white py-16 rounded-2xl text-center border border-gray-100 shadow-sm flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-sm border border-green-100">
                            <FiRefreshCw size={28} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pipeline Healthy</h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium">The Dead Letter Queue is currently empty.</p>
                    </div>
                ) : (
                    entries.map((entry, idx) => (
                        <div 
                            key={entry._id} 
                            className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                expandedIndex === idx 
                                ? 'border-red-400 shadow-lg ring-1 ring-red-400/20' 
                                : 'border-gray-100 hover:border-gray-200 shadow-sm'
                            }`}
                            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        >
                            <div className="p-5 flex items-start gap-5">
                                <div className="p-3 bg-red-50 text-red-500 rounded-xl shrink-0 border border-red-100">
                                    <FiTerminal size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <h3 className="text-sm font-black text-gray-800 truncate leading-tight uppercase tracking-tight">{entry.type}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                {entry.failureClassification || 'UNCATEGORIZED'}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 whitespace-nowrap flex items-center gap-1">
                                                <FiClock /> {new Date(entry.quarantinedAt || currentTime).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-4 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">ID: {entry._id.substring(0, 12)}...</span>
                                            <span className="text-zinc-600">Recipient: {entry.recipientId}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReplay(entry._id);
                                            }}
                                            disabled={replaying === entry._id}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <FiPlay size={10} />
                                            {replaying === entry._id ? 'Replaying...' : 'Initiate Replay'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {expandedIndex === idx && (
                                <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 overflow-hidden relative group/code">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(entry);
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                                            title="Copy Details"
                                        >
                                            <FiClipboard size={12} />
                                        </button>
                                        <div className="space-y-5">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Diagnostic Error</p>
                                                <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap leading-relaxed">{entry.lastError}</pre>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Forensic Error Chain</p>
                                                <div className="space-y-1">
                                                    {entry.errorChain.map((err, i) => (
                                                        <pre key={i} className="text-[9px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed">
                                                            [{i}] {err}
                                                        </pre>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Payload Manifest</p>
                                                <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre leading-relaxed font-bold">
                                                    {JSON.stringify(entry.payload, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DeadLetterQueue;
