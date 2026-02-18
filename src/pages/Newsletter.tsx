import { useEffect, useState } from 'react';
import api from '../api/axios';
import { logger } from '../utils/logger';
import { toast } from 'react-hot-toast';
import { FiSend, FiUsers, FiBarChart2, FiCheckCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Newsletter() {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState({ subject: '', message: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subResponse, statsResponse] = await Promise.all([
                api.get('/admin/marketing/newsletter/subscribers'),
                api.get('/admin/marketing/newsletter/stats')
            ]);
            setSubscribers(subResponse.data.data);
            setStats(statsResponse.data.data);
        } catch (error) {
            logger.error('Failed to fetch newsletter data:', error);
            toast.error('Failed to load newsletter data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const confirm = await Swal.fire({
            title: 'Send Campaign?',
            text: `You are about to send an email to ${subscribers.length} subscribers. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, send it!'
        });

        if (!confirm.isConfirmed) return;

        setSending(true);
        try {
            const response = await api.post('/admin/marketing/newsletter/campaign', campaign);
            if (response.data.success) {
                Swal.fire('Sent!', 'Campaign has been queued for delivery.', 'success');
                setCampaign({ subject: '', message: '' });
            }
        } catch (error: any) {
            logger.error('Failed to send campaign:', error);
            toast.error(error.response?.data?.message || 'Failed to send campaign');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Newsletter Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage marketing campaigns and subscriber base</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <FiUsers className="text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-widest">{stats?.total || 0} Total</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <FiCheckCircle className="text-green-500" />
                        <span className="text-xs font-black uppercase tracking-widest">{stats?.active || 0} Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Campaign Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                            <FiSend className="text-blue-600" />
                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Send New Campaign</h2>
                        </div>
                        <form onSubmit={handleSendCampaign} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={campaign.subject}
                                    onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                                    placeholder="Enter email subject..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium bg-gray-50/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content (HTML Supported)</label>
                                <textarea
                                    value={campaign.message}
                                    onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                                    placeholder="Write your campaign message..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all h-64 font-mono text-xs resize-none bg-gray-50/50"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                                >
                                    {sending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSend />}
                                    {sending ? 'Processing...' : 'Blast Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Stats & Recent */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3">
                            <FiBarChart2 className="text-blue-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Category Interests</h3>
                        </div>
                        <div className="space-y-5">
                            {[
                                { label: 'New Arrivals', count: stats?.byPreference?.newArrivals || 0, color: 'bg-blue-500' },
                                { label: 'Promotions', count: stats?.byPreference?.promotions || 0, color: 'bg-indigo-500' },
                                { label: 'Blog Posts', count: stats?.byPreference?.blogPosts || 0, color: 'bg-emerald-500' }
                            ].map((pref) => (
                                <div key={pref.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                        <span className="text-gray-400">{pref.label}</span>
                                        <span className="text-gray-900">{pref.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${pref.color}`} 
                                            style={{ width: `${Math.min(100, (pref.count / (stats?.total || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-4">
                            <FiUsers className="text-blue-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Recent Subs</h3>
                        </div>
                        <div className="space-y-4">
                            {subscribers.slice(0, 5).map((sub: any) => (
                                <div key={sub._id} className="flex flex-col border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                    <span className="text-xs font-bold text-gray-800 truncate">{sub.email}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                                        Joined {new Date(sub.subscribedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
