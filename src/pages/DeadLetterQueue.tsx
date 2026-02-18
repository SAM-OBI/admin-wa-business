import React, { useState, useEffect } from 'react';
import { 
    FiAlertCircle, 
    FiTrash2, 
    FiRefreshCw, 
    FiClipboard,
    FiArrowRight,
    FiTerminal
} from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface DLQError {
    timestamp: string;
    error: {
        message: string;
        name: string;
        stack?: string;
    };
    context: {
        userId?: string;
        path?: string;
        method?: string;
        referenceId?: string;
        [key: string]: any;
    };
}

const DeadLetterQueue: React.FC = () => {
    const [errors, setErrors] = useState<DLQError[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const fetchDLQ = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/oversight/dlq');
            if (response.data.success) {
                setErrors(response.data.data);
            }
        } catch (error) {
            logger.error('Failed to fetch DLQ:', error);
            toast.error('Failed to load Dead Letter Queue');
        } finally {
            setLoading(false);
        }
    };

    const clearDLQ = async () => {
        const confirm = window.confirm('Are you sure you want to clear all critical errors from the queue?');
        if (!confirm) return;

        try {
            await api.delete('/admin/oversight/dlq');
            setErrors([]);
            toast.success('Dead Letter Queue cleared');
        } catch {
            toast.error('Failed to clear queue');
        }
    };

    useEffect(() => {
        fetchDLQ();
    }, []);

    const handleCopy = (err: DLQError) => {
        navigator.clipboard.writeText(JSON.stringify(err, null, 2));
        toast.success('Error details copied to clipboard');
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
                    <p className="text-gray-500 mt-1 text-sm font-medium">Critical system failures requiring manual intervention.</p>
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
                    <button 
                        onClick={clearDLQ}
                        disabled={errors.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-red-200 hover:bg-red-700 disabled:opacity-50"
                    >
                        <FiTrash2 />
                        Clear Queue
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            {errors.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                    <FiAlertCircle className="text-orange-500 mt-1 shrink-0" size={20} />
                    <div>
                        <p className="text-orange-800 font-bold text-[11px] uppercase tracking-widest">Action Required</p>
                        <p className="text-orange-700/80 text-xs mt-1 leading-relaxed">There are {errors.length} critical errors that failed processing. Investigate their reference IDs in the system logs to prevent data loss.</p>
                    </div>
                </div>
            )}

            {/* Error List */}
            <div className="space-y-3">
                {errors.length === 0 && !loading ? (
                    <div className="bg-white py-16 rounded-2xl text-center border border-gray-100 shadow-sm flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-sm border border-green-100">
                            <FiRefreshCw size={28} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">All Systems Nominal</h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium">The Dead Letter Queue is currently empty.</p>
                    </div>
                ) : (
                    errors.map((err, idx) => (
                        <div 
                            key={idx} 
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
                                        <h3 className="text-sm font-black text-gray-800 truncate leading-tight">{err.error.message}</h3>
                                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 whitespace-nowrap">
                                            {new Date(err.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                        {err.context.path && (
                                            <span className="flex items-center gap-1.5">
                                                <FiArrowRight className="text-gray-300" />
                                                <span className="text-gray-600">{err.context.method}</span> {err.context.path}
                                            </span>
                                        )}
                                        {err.context.referenceId && (
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">REF: {err.context.referenceId}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {expandedIndex === idx && (
                                <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 overflow-hidden relative group/code">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(err);
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                                            title="Copy JSON"
                                        >
                                            <FiClipboard size={12} />
                                        </button>
                                        <div className="space-y-5">
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Error Diagnostic</p>
                                                <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap leading-relaxed">{err.error.name}: {err.error.message}</pre>
                                            </div>
                                            {err.error.stack && (
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Stack Trace</p>
                                                    <pre className="text-[9px] font-mono text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar-dark leading-relaxed">
                                                        {err.error.stack}
                                                    </pre>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Operation Context</p>
                                                <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre leading-relaxed font-bold">
                                                    {JSON.stringify(err.context, null, 2)}
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
