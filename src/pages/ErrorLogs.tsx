import React, { useState, useEffect } from 'react';
import { 
    FiSearch, 
    FiClipboard, 
    FiAlertTriangle, 
    FiAlertOctagon, 
    FiRefreshCw, 
    FiChevronDown, 
    FiChevronUp
} from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface ErrorLog {
    level: string;
    message: string;
    timestamp: string;
    referenceId?: string;
    path?: string;
    method?: string;
    userId?: string;
    stack?: string;
    [key: string]: any;
}

const ErrorLogs: React.FC = () => {
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refIdSearch, setRefIdSearch] = useState('');
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    const fetchLogsWithParams = async (params: any) => {
        setLoading(true);
        try {
            const response = await api.get('/admin/error-logs', { params });
            if (response.data.success) {
                setLogs(response.data.data.logs);
            }
        } catch (error) {
            logger.error('Failed to fetch logs:', error);
            toast.error('Failed to load error logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = (rId?: string) => {
        const params: any = { limit: 100 };
        if (rId || refIdSearch) params.referenceId = rId || refIdSearch;
        fetchLogsWithParams(params);
    };

    useEffect(() => {
        fetchLogsWithParams({ limit: 100 });
    }, []);

    const handleCopy = (log: ErrorLog) => {
        const text = JSON.stringify(log, null, 2);
        navigator.clipboard.writeText(text);
        toast.success('Log details copied to clipboard');
    };

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            log.message?.toLowerCase().includes(search) ||
            log.path?.toLowerCase().includes(search) ||
            log.method?.toLowerCase().includes(search) ||
            log.level?.toLowerCase().includes(search)
        );
    });

    const getLevelStyle = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'critical':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'error':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'warn':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default:
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                            <FiAlertOctagon />
                        </div>
                        System Error Logs
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Audit and debug system-wide errors and critical failures.</p>
                </div>
                <button 
                    onClick={() => fetchLogs()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all disabled:opacity-50 text-sm font-bold uppercase tracking-widest"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Sync
                </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Reference ID (Exact)..."
                        value={refIdSearch}
                        onChange={(e) => setRefIdSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                        className="w-full pl-11 pr-24 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm outline-none text-sm"
                    />
                    <button 
                        onClick={() => fetchLogs()}
                        className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        Lookup
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by message, path, or level..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm outline-none text-sm"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Recent History ({filteredLogs.length} entries)
                    </span>
                </div>

                <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
                    {loading && logs.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <p className="text-xs font-bold uppercase tracking-widest">Reading logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <FiClipboard size={40} className="text-gray-200" />
                            <p className="font-bold text-gray-500 uppercase text-xs">No matching logs found</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="group hover:bg-gray-50/50 transition-colors">
                                <div 
                                    className="p-4 flex items-start gap-4 cursor-pointer"
                                    onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                                >
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${log.level === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getLevelStyle(log.level)}`}>
                                                {log.level}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                            {log.referenceId && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono font-bold">
                                                    REF: {log.referenceId}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-gray-800 font-bold text-sm truncate max-w-full">
                                            {log.message}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-400 font-bold">
                                            {log.method && (
                                                <span className="flex items-center gap-1 uppercase">
                                                    <span className="text-gray-900">{log.method}</span> {log.path}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(log);
                                            }}
                                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 border border-transparent hover:border-gray-100 transition-all shadow-sm"
                                            title="Copy Details"
                                        >
                                            <FiClipboard size={14} />
                                        </button>
                                        <div className="text-gray-300">
                                            {expandedLog === index ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                        </div>
                                    </div>
                                </div>

                                {expandedLog === index && (
                                    <div className="px-12 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="bg-gray-900 rounded-2xl p-5 overflow-hidden border border-gray-800 shadow-xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full JSON Data</span>
                                                <button 
                                                    onClick={() => handleCopy(log)}
                                                    className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors uppercase"
                                                >
                                                    <FiClipboard size={12} /> Copy
                                                </button>
                                            </div>
                                            <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
                                                {JSON.stringify(log, null, 2)}
                                            </pre>
                                            {log.stack && (
                                                <div className="mt-4 pt-4 border-t border-gray-800">
                                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 block">Stack Trace</span>
                                                    <pre className="text-[10px] font-mono text-red-300/70 p-4 bg-red-950/20 rounded-xl overflow-x-auto whitespace-pre-wrap">
                                                        {log.stack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Helper */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl">
                <FiAlertTriangle className="shrink-0" />
                <p className="text-xs leading-relaxed font-medium">
                    <span className="font-black uppercase tracking-tight mr-2">Debug Help:</span>
                    If a user reports an issue, ask for the <strong>Reference ID</strong> shown on their screen. Paste it into the lookup field above to see the exact server-side error.
                </p>
            </div>
        </div>
    );
};

export default ErrorLogs;
