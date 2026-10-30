import React, { useState, useEffect} from 'react';
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sv-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-sv-border">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-sv-danger-soft flex items-center justify-center text-sv-danger shadow-xs border border-sv-danger/20 shrink-0">
                            <FiTerminal size={20} />
                        </div>
                        Dead Letter Queue
                    </h1>
                    <p className="text-sv-text-muted mt-1 text-sm font-medium">Critical event failures requiring forensic review & replay.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchDLQ}
                        disabled={loading}
                        className="p-3 bg-sv-surface-muted text-sv-text-secondary rounded-xl hover:bg-sv-surface hover:text-sv-text-primary transition-all border border-sv-border shadow-xs disabled:opacity-50"
                        title="Refresh Queue"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            {entries.length > 0 && (
                <div className="bg-sv-warning-soft/30 border border-sv-warning/20 p-4 rounded-xl flex items-start gap-4 shadow-xs">
                    <FiAlertCircle className="text-sv-warning mt-1 shrink-0" size={20} />
                    <div>
                        <p className="text-sv-text-primary font-bold text-[11px] uppercase tracking-widest">Quarantine Active</p>
                        <p className="text-sv-text-secondary text-xs mt-1 leading-relaxed">There are {entries.length} events in quarantine. Review the failure classification before re-initiating replay to prevent retry storms.</p>
                    </div>
                </div>
            )}

            {/* Entry List */}
            <div className="space-y-3">
                {entries.length === 0 && !loading ? (
                    <div className="bg-sv-surface py-16 rounded-2xl text-center border border-sv-border shadow-xs flex flex-col items-center">
                        <div className="w-16 h-16 bg-sv-success-soft rounded-full flex items-center justify-center mb-6 text-sv-success shadow-xs border border-sv-success/20">
                            <FiRefreshCw size={28} />
                        </div>
                        <h3 className="text-sm font-black text-sv-text-primary uppercase tracking-widest">Pipeline Healthy</h3>
                        <p className="text-xs text-sv-text-muted mt-2 font-medium">The Dead Letter Queue is currently empty.</p>
                    </div>
                ) : (
                    entries.map((entry, idx) => (
                        <div 
                            key={entry._id} 
                            className={`bg-sv-surface rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                expandedIndex === idx 
                                ? 'border-sv-danger shadow-md ring-1 ring-sv-danger/20' 
                                : 'border-sv-border hover:border-sv-border/80 shadow-xs'
                            }`}
                            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        >
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                                <div className="p-3 bg-sv-danger-soft text-sv-danger rounded-xl shrink-0 border border-sv-danger/20">
                                    <FiTerminal size={18} />
                                </div>
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <h3 className="text-sm font-black text-sv-text-primary truncate leading-tight uppercase tracking-tight">{entry.type}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[9px] font-black uppercase text-sv-danger bg-sv-danger-soft px-2 py-0.5 rounded-full border border-sv-danger/20">
                                                {entry.failureClassification || 'UNCATEGORIZED'}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-sv-text-muted tracking-widest bg-sv-surface-muted px-2 py-0.5 rounded-full border border-sv-border whitespace-nowrap flex items-center gap-1">
                                                <FiClock /> {new Date(entry.quarantinedAt || currentTime).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                                        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-sv-text-muted uppercase tracking-tight">
                                            <span className="text-sv-primary bg-sv-primary/10 px-2 py-0.5 rounded-full border border-sv-primary/20">ID: {entry._id.substring(0, 12)}...</span>
                                            <span className="text-sv-text-secondary">Recipient: {entry.recipientId}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReplay(entry._id);
                                            }}
                                            disabled={replaying === entry._id}
                                            className="self-end sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-sv-primary text-sv-text-inverse rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-sv-primary-hover transition-all shadow-xs disabled:opacity-50"
                                        >
                                            <FiPlay size={10} />
                                            {replaying === entry._id ? 'Replaying...' : 'Initiate Replay'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {expandedIndex === idx && (
                                <div className="px-4 sm:px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-sv-bg rounded-xl p-4 sm:p-5 border border-sv-border overflow-hidden relative group/code">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(entry);
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-sv-surface-muted hover:bg-sv-surface text-sv-text-muted hover:text-sv-text-primary rounded-lg transition-all border border-sv-border"
                                            title="Copy Details"
                                        >
                                            <FiClipboard size={12} />
                                        </button>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-sv-text-muted tracking-widest mb-1.5">Diagnostic Error</p>
                                                <pre className="text-xs font-mono text-sv-danger whitespace-pre-wrap leading-relaxed">{entry.lastError}</pre>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-sv-text-muted tracking-widest mb-1.5">Forensic Error Chain</p>
                                                <div className="space-y-1">
                                                    {entry.errorChain.map((err, i) => (
                                                        <pre key={i} className="text-[10px] font-mono text-sv-text-secondary whitespace-pre-wrap leading-relaxed">
                                                            [{i}] {err}
                                                        </pre>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-sv-text-muted tracking-widest mb-1.5">Payload Manifest</p>
                                                <pre className="text-xs font-mono text-sv-text-primary overflow-x-auto whitespace-pre leading-relaxed font-bold scrollbar-thin">
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
