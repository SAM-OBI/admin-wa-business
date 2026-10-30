import { useState, useEffect } from 'react';
import { adminService } from '../api/admin.service';
import { FiMail, FiCalendar, FiShield, FiExternalLink, FiSearch } from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';

export default function SupportInquiries() {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchInquiries = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminService.getSupportInquiries({ page, limit: 10 });
            if (response.data) {
                setInquiries(response.data.inquiries);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error: any) {
            console.error('Failed to fetch support inquiries', error);
            setError(error.response?.data?.message || 'We couldn\'t load support inquiries right now.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'OPEN': return 'bg-sv-danger-soft text-sv-danger';
            case 'IN_PROGRESS': return 'bg-sv-warning-soft text-sv-warning';
            case 'RESOLVED': return 'bg-sv-success-soft text-sv-success';
            case 'CLOSED': return 'bg-sv-surface-muted text-sv-text-secondary';
            default: return 'bg-sv-surface-muted text-sv-text-secondary';
        }
    };

    const filteredInquiries = inquiries.filter(item => 
        item.forensicId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Institutional Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sv-border pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Support & Inquiries</h1>
                    <p className="text-sv-text-muted text-sm font-medium mt-1">Institutional-grade oversight of public assistance requests</p>
                </div>
                
                <div className="relative w-full sm:w-72">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sv-text-muted" />
                    <input 
                        type="text"
                        placeholder="Search by ID, Name or Email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-sv-surface border border-sv-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary transition-all font-medium text-sv-text-primary placeholder:text-sv-text-muted shadow-xs"
                    />
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12 min-h-[300px] items-center">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
                 </div>
            ) : error ? (
                <ErrorState message={error} onRetry={fetchInquiries} />
            ) : (
                <div className="space-y-4">
                    {filteredInquiries.length === 0 ? (
                        <div className="text-center py-20 bg-sv-surface rounded-2xl border border-sv-border shadow-xs">
                            <FiMail className="mx-auto text-4xl text-sv-border mb-3" />
                            <p className="text-sv-text-muted font-bold uppercase tracking-widest text-xs">No support inquiries found</p>
                        </div>
                    ) : (
                        filteredInquiries.map((item) => (
                            <div key={item._id} className="bg-sv-surface rounded-2xl p-4 sm:p-6 border border-sv-border shadow-xs hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1 space-y-4 min-w-0 w-full">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-sv-surface-muted text-sv-text-secondary px-2.5 py-1 rounded-full border border-sv-border">
                                                {item.forensicId}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs text-sv-text-muted flex items-center gap-1 font-medium">
                                                <FiCalendar /> {new Date(item.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-black text-sv-text-primary uppercase tracking-tight">{item.subject}</h3>
                                            <p className="text-xs sm:text-sm text-sv-text-secondary font-medium leading-relaxed whitespace-pre-wrap bg-sv-surface-muted p-4 rounded-xl border border-sv-border italic">
                                                "{item.message}"
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-sv-primary/10 border border-sv-primary/20 flex items-center justify-center text-sv-primary font-black text-xs shrink-0">
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-black text-sv-text-primary uppercase tracking-tight">{item.name}</span>
                                            </div>

                                            <a 
                                                href={`mailto:${item.email}?subject=Re: [${item.forensicId}] ${item.subject}`}
                                                className="flex items-center gap-2 text-xs font-bold text-sv-primary hover:text-sv-primary-hover transition-colors uppercase tracking-wider group/link truncate"
                                            >
                                                <FiMail className="shrink-0" />
                                                <span className="truncate">{item.email}</span>
                                                <FiExternalLink className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                                            </a>

                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sv-text-muted uppercase tracking-wider">
                                                <FiShield className="shrink-0" />
                                                <span>IP: {item.metadata?.ip || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {/* Institutional Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 gap-3">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 border border-sv-border rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-sv-surface-muted text-sv-text-primary transition-all shadow-xs"
                    >
                        Prev
                    </button>
                    <span className="px-5 py-2 bg-sv-surface border border-sv-border rounded-xl text-xs font-bold uppercase tracking-wider text-sv-text-secondary shadow-xs">
                        Batch {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 border border-sv-border rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-sv-surface-muted text-sv-text-primary transition-all shadow-xs"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
