import { useState, useEffect } from 'react';
import { adminService } from '../api/admin.service';
import { FiMail, FiCalendar, FiShield, FiExternalLink, FiSearch } from 'react-icons/fi';

export default function SupportInquiries() {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const response = await adminService.getSupportInquiries({ page, limit: 10 });
            if (response.data) {
                setInquiries(response.data.inquiries);
                setTotalPages(response.data.pagination.pages);
            }
        } catch {
            console.error('Failed to fetch support inquiries');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'OPEN': return 'bg-red-100 text-red-700';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'CLOSED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredInquiries = inquiries.filter(item => 
        item.forensicId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Institutional Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Support & Inquiries</h1>
                    <p className="text-gray-500 text-sm font-medium">Institutional-grade oversight of public assistance requests</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search by ID, Name or Email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                    />
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                 </div>
            ) : (
                <div className="space-y-4">
                    {filteredInquiries.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-[5px] border border-gray-100">
                            <FiMail className="mx-auto text-4xl text-gray-200 mb-2" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No support inquiries found</p>
                        </div>
                    ) : (
                        filteredInquiries.map((item) => (
                            <div key={item._id} className="bg-white rounded-[5px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1 space-y-4 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-2 py-1 rounded">
                                                {item.forensicId}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                <FiCalendar /> {new Date(item.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{item.subject}</h3>
                                            <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-4 rounded-[5px] border border-gray-50 italic">
                                                "{item.message}"
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-6 pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-[5px] bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">{item.name}</span>
                                            </div>

                                            <a 
                                                href={`mailto:${item.email}?subject=Re: [${item.forensicId}] ${item.subject}`}
                                                className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest group/link"
                                            >
                                                <FiMail />
                                                {item.email}
                                                <FiExternalLink className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </a>

                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <FiShield />
                                                <span>IP: {item.metadata?.ip || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 w-full md:w-auto">
                                        <button className="w-full md:w-auto px-6 py-3 bg-gray-50 border border-gray-200 rounded-[5px] text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-900 hover:text-white transition-all">
                                            Resolve Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {/* Institutional Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 border border-gray-200 rounded-[5px] text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-gray-50 transition-all"
                    >
                        Prev
                    </button>
                    <span className="px-6 py-2 bg-white border border-gray-200 rounded-[5px] text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Batch {page} of {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 border border-gray-200 rounded-[5px] text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-gray-50 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
