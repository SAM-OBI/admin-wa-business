import React, { useState, useEffect} from 'react';
import { 
    FiSearch, 
    FiClipboard, 
    FiAlertTriangle, 
    FiAlertOctagon, 
    FiRefreshCw, 
    FiChevronDown, 
    FiChevronUp,
    FiFilter,
    FiLink,
    FiX
} from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface ErrorLog {
    level: string;
    message: string;
    timestamp: string;
    referenceId?: string;
    traceId?: string;
    path?: string;
    method?: string;
    userId?: string;
    stack?: string;
    [key: string]: any;
}

const LEVEL_OPTIONS = ['all', 'critical', 'error', 'warn', 'info'];

const ErrorLogs: React.FC = () => {
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refIdSearch, setRefIdSearch] = useState('');
    const [traceIdSearch, setTraceIdSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
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

    const fetchLogs = (overrideTraceId?: string, overrideRefId?: string) => {
        const params: any = { limit: 100 };
        const tid = overrideTraceId ?? traceIdSearch;
        const rid = overrideRefId ?? refIdSearch;
        if (tid) params.traceId = tid;
        if (rid) params.referenceId = rid;
        if (levelFilter !== 'all') params.level = levelFilter;
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

    const handleCopyId = (id: string, label: string) => {
        navigator.clipboard.writeText(id);
        toast.success(`${label} copied!`);
    };

    /** Drill directly into a traceId from any log entry */
    const handleTraceIdClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setTraceIdSearch(id);
        setRefIdSearch('');
        fetchLogs(id, '');
    };

    /** Drill directly into a referenceId from any log entry */
    const handleRefIdClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setRefIdSearch(id);
        setTraceIdSearch('');
        fetchLogs('', id);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRefIdSearch('');
        setTraceIdSearch('');
        setLevelFilter('all');
        fetchLogsWithParams({ limit: 100 });
    };

    const hasActiveFilters = searchTerm || refIdSearch || traceIdSearch || levelFilter !== 'all';

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            log.message?.toLowerCase().includes(search) ||
            log.path?.toLowerCase().includes(search) ||
            log.method?.toLowerCase().includes(search) ||
            log.level?.toLowerCase().includes(search) ||
            log.traceId?.toLowerCase().includes(search) ||
            log.referenceId?.toLowerCase().includes(search)
        );
    });

    const getLevelStyle = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'critical':
                return 'bg-sv-danger-soft text-sv-danger border-sv-danger/30';
            case 'error':
                return 'bg-sv-warning-soft text-sv-warning border-sv-warning/30';
            case 'warn':
                return 'bg-sv-warning-soft text-sv-warning border-sv-warning/30';
            default:
                return 'bg-sv-info-soft text-sv-info border-sv-info/30';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sv-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-sv-border">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-sv-danger-soft flex items-center justify-center text-sv-danger border border-sv-border">
                            <FiAlertOctagon size={20} />
                        </div>
                        System Error Logs
                    </h1>
                    <p className="text-sv-text-secondary mt-1 text-sm font-medium">Audit and debug system-wide errors. Search by TraceID or ReferenceID.</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sv-danger-soft hover:opacity-80 text-sv-danger rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <FiX size={14} /> Clear
                        </button>
                    )}
                    <button 
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-sv-surface-muted hover:bg-sv-border text-sv-text-primary rounded-xl transition-all disabled:opacity-50 text-xs font-bold uppercase tracking-widest border border-sv-border"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Sync
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* TraceId Lookup */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLink className="text-sv-text-muted group-focus-within:text-sv-primary transition-colors" size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="TraceID lookup..."
                        value={traceIdSearch}
                        onChange={(e) => setTraceIdSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                        className="w-full pl-10 pr-20 py-2.5 sm:py-3 bg-sv-surface border border-sv-border rounded-xl sm:rounded-2xl text-sv-text-primary placeholder:text-sv-text-muted focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary transition-all shadow-xs outline-none text-sm"
                    />
                    <button 
                        onClick={() => fetchLogs()}
                        className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-sv-primary text-sv-text-inverse rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sv-primary-hover transition-colors"
                    >
                        Find
                    </button>
                </div>

                {/* ReferenceId Lookup */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className="text-sv-text-muted group-focus-within:text-sv-primary transition-colors" size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="ReferenceID lookup..."
                        value={refIdSearch}
                        onChange={(e) => setRefIdSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                        className="w-full pl-10 pr-20 py-2.5 sm:py-3 bg-sv-surface border border-sv-border rounded-xl sm:rounded-2xl text-sv-text-primary placeholder:text-sv-text-muted focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary transition-all shadow-xs outline-none text-sm"
                    />
                    <button 
                        onClick={() => fetchLogs()}
                        className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-sv-primary text-sv-text-inverse rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sv-primary-hover transition-colors"
                    >
                        Find
                    </button>
                </div>

                {/* Message/path filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className="text-sv-text-muted" size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter message, path, level..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-sv-surface border border-sv-border rounded-xl sm:rounded-2xl text-sv-text-primary placeholder:text-sv-text-muted focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary transition-all shadow-xs outline-none text-sm"
                    />
                </div>

                {/* Level filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiFilter className="text-sv-text-muted" size={14} />
                    </div>
                    <select
                        value={levelFilter}
                        onChange={(e) => {
                            setLevelFilter(e.target.value);
                            const params: any = { limit: 100 };
                            if (traceIdSearch) params.traceId = traceIdSearch;
                            if (refIdSearch) params.referenceId = refIdSearch;
                            if (e.target.value !== 'all') params.level = e.target.value;
                            fetchLogsWithParams(params);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-sv-surface border border-sv-border rounded-xl sm:rounded-2xl text-sv-text-primary focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary transition-all shadow-xs outline-none text-sm font-medium appearance-none capitalize"
                    >
                        {LEVEL_OPTIONS.map(l => (
                            <option key={l} value={l} className="bg-sv-surface text-sv-text-primary">{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Active Filters:</span>
                    {traceIdSearch && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-sv-primary-soft text-sv-primary px-3 py-1 rounded-full border border-sv-border">
                            <FiLink size={10} /> trace: {traceIdSearch.slice(0, 24)}...
                            <button onClick={() => { setTraceIdSearch(''); fetchLogs('', refIdSearch); }} className="ml-1 hover:opacity-70"><FiX size={10} /></button>
                        </span>
                    )}
                    {refIdSearch && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-sv-info-soft text-sv-info px-3 py-1 rounded-full border border-sv-border">
                            ref: {refIdSearch.slice(0, 24)}...
                            <button onClick={() => { setRefIdSearch(''); fetchLogs(traceIdSearch, ''); }} className="ml-1 hover:opacity-70"><FiX size={10} /></button>
                        </span>
                    )}
                    {levelFilter !== 'all' && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold bg-sv-warning-soft text-sv-warning px-3 py-1 rounded-full border border-sv-border uppercase">
                            level: {levelFilter}
                            <button onClick={() => { setLevelFilter('all'); fetchLogs(); }} className="ml-1 hover:opacity-70"><FiX size={10} /></button>
                        </span>
                    )}
                </div>
            )}

            {/* Logs List */}
            <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-sv-border bg-sv-surface-muted/60 flex items-center justify-between">
                    <span className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
                        Recent History ({filteredLogs.length} entries)
                    </span>
                </div>

                <div className="max-h-[600px] overflow-y-auto divide-y divide-sv-border">
                    {loading && logs.length === 0 ? (
                        <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-sv-text-muted gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-sv-primary"></div>
                            <p className="text-xs font-bold uppercase tracking-widest">Reading logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-16 sm:p-20 flex flex-col items-center justify-center text-sv-text-muted gap-3">
                            <FiClipboard size={40} className="text-sv-border" />
                            <p className="font-bold text-sv-text-muted uppercase text-xs">No matching logs found</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="group hover:bg-sv-surface-muted/40 transition-colors">
                                <div 
                                    className="p-3.5 sm:p-4 flex items-start gap-3 sm:gap-4 cursor-pointer"
                                    onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                                >
                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${log.level === 'critical' ? 'bg-sv-danger' : log.level === 'error' ? 'bg-sv-warning' : log.level === 'warn' ? 'bg-sv-warning' : 'bg-sv-info'}`}></div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getLevelStyle(log.level)}`}>
                                                {log.level}
                                            </span>
                                            <span className="text-[10px] text-sv-text-muted font-bold uppercase">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>

                                            {/* TraceID badge — clickable to drill in */}
                                            {log.traceId && (
                                                <button
                                                    onClick={(e) => handleTraceIdClick(e, log.traceId!)}
                                                    title="Click to filter by this TraceID"
                                                    className="flex items-center gap-1 text-[10px] bg-sv-primary-soft hover:bg-sv-border text-sv-primary border border-sv-border px-2 py-0.5 rounded-full font-mono font-bold transition-colors"
                                                >
                                                    <FiLink size={9} />
                                                    TRACE: {log.traceId.replace('trace-', '').slice(0, 12)}…
                                                </button>
                                            )}

                                            {/* ReferenceID badge — clickable to drill in */}
                                            {log.referenceId && (
                                                <button
                                                    onClick={(e) => handleRefIdClick(e, log.referenceId!)}
                                                    title="Click to filter by this ReferenceID"
                                                    className="flex items-center gap-1 text-[10px] bg-sv-surface-muted hover:bg-sv-border text-sv-text-secondary border border-sv-border px-2 py-0.5 rounded-full font-mono font-bold transition-colors"
                                                >
                                                    REF: {log.referenceId.slice(0, 12)}…
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="text-sv-text-primary font-bold text-sm truncate max-w-full">
                                            {log.message}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-[10px] text-sv-text-muted font-bold">
                                            {log.method && (
                                                <span className="flex items-center gap-1 uppercase">
                                                    <span className="text-sv-text-primary">{log.method}</span> {log.path}
                                                </span>
                                            )}
                                            {log.userId && (
                                                <span className="text-sv-text-muted">User: {log.userId}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(log);
                                            }}
                                            className="p-1.5 sm:p-2 hover:bg-sv-surface-muted rounded-lg text-sv-text-muted hover:text-sv-primary border border-transparent hover:border-sv-border transition-all shadow-xs"
                                            title="Copy Full Log"
                                        >
                                            <FiClipboard size={14} />
                                        </button>
                                        <div className="text-sv-text-muted">
                                            {expandedLog === index ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                        </div>
                                    </div>
                                </div>

                                {expandedLog === index && (
                                    <div className="px-4 sm:px-12 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* TraceId + ReferenceId Action Bar */}
                                        {(log.traceId || log.referenceId) && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {log.traceId && (
                                                    <div className="flex items-center gap-2 bg-sv-primary-soft border border-sv-border rounded-xl px-3 py-2">
                                                        <FiLink size={12} className="text-sv-primary shrink-0" />
                                                        <span className="text-[10px] font-black text-sv-primary uppercase tracking-widest mr-1">TraceID</span>
                                                        <span className="text-[11px] font-mono text-sv-text-primary font-bold">{log.traceId}</span>
                                                        <button
                                                            onClick={() => handleCopyId(log.traceId!, 'TraceID')}
                                                            className="ml-1 text-sv-text-muted hover:text-sv-primary transition-colors"
                                                            title="Copy TraceID"
                                                        >
                                                            <FiClipboard size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                                {log.referenceId && (
                                                    <div className="flex items-center gap-2 bg-sv-surface-muted border border-sv-border rounded-xl px-3 py-2">
                                                        <span className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest mr-1">ReferenceID</span>
                                                        <span className="text-[11px] font-mono text-sv-text-primary font-bold">{log.referenceId}</span>
                                                        <button
                                                            onClick={() => handleCopyId(log.referenceId!, 'ReferenceID')}
                                                            className="ml-1 text-sv-text-muted hover:text-sv-text-primary transition-colors"
                                                            title="Copy ReferenceID"
                                                        >
                                                            <FiClipboard size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="bg-sv-surface-muted/80 rounded-2xl p-4 sm:p-5 overflow-hidden border border-sv-border shadow-xs">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Full JSON Data</span>
                                                <button 
                                                    onClick={() => handleCopy(log)}
                                                    className="text-[10px] font-black text-sv-text-muted hover:text-sv-text-primary flex items-center gap-1.5 transition-colors uppercase"
                                                >
                                                    <FiClipboard size={12} /> Copy
                                                </button>
                                            </div>
                                            <pre className="text-xs font-mono text-sv-text-primary overflow-x-auto leading-relaxed">
                                                {JSON.stringify(log, null, 2)}
                                            </pre>
                                            {log.stack && (
                                                <div className="mt-4 pt-4 border-t border-sv-border">
                                                    <span className="text-[10px] font-black text-sv-danger uppercase tracking-widest mb-2 block">Stack Trace</span>
                                                    <pre className="text-[10px] font-mono text-sv-danger p-4 bg-sv-danger-soft/40 border border-sv-border rounded-xl overflow-x-auto whitespace-pre-wrap">
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
            <div className="flex items-start gap-3 p-4 bg-sv-info-soft text-sv-info border border-sv-border rounded-2xl">
                <FiAlertTriangle className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                    <span className="font-black uppercase tracking-tight mr-2">Debug Help:</span>
                    When a user reports an error, ask for the <strong>TraceID</strong> shown in their error response (e.g. <span className="font-mono bg-sv-surface border border-sv-border px-1 py-0.5 rounded text-sv-text-primary">traceId: "trace-xxx"</span>) or the <strong>ReferenceID</strong> shown on-screen.
                    Paste it into the lookup field above to see the exact server-side error. You can also click any <span className="font-mono bg-sv-primary-soft text-sv-primary border border-sv-border px-1 py-0.5 rounded">TRACE:</span> badge directly to drill into that trace.
                </p>
            </div>
        </div>
    );
};

export default ErrorLogs;
