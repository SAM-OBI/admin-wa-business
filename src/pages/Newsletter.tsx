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
        <div className="flex items-center justify-center p-12 min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Newsletter Management</h1>
                    <p className="text-sv-text-muted text-sm mt-1">Manage marketing campaigns and subscriber base</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-sv-surface px-4 py-2 rounded-xl shadow-xs border border-sv-border flex items-center gap-2">
                        <FiUsers className="text-sv-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-sv-text-primary">{stats?.total || 0} Total</span>
                    </div>
                    <div className="bg-sv-surface px-4 py-2 rounded-xl shadow-xs border border-sv-border flex items-center gap-2">
                        <FiCheckCircle className="text-sv-success" />
                        <span className="text-xs font-black uppercase tracking-widest text-sv-text-primary">{stats?.active || 0} Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Campaign Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-sv-border bg-sv-surface-muted/60 flex items-center gap-2">
                            <FiSend className="text-sv-primary" />
                            <h2 className="text-xs font-black text-sv-text-primary uppercase tracking-widest">Send New Campaign</h2>
                        </div>
                        <form onSubmit={handleSendCampaign} className="p-4 sm:p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest ml-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={campaign.subject}
                                    onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                                    placeholder="Enter email subject..."
                                    className="w-full px-4 py-3 rounded-xl border border-sv-border focus:ring-2 focus:ring-sv-primary/20 outline-none transition-all text-sm font-medium bg-sv-surface-muted text-sv-text-primary placeholder:text-sv-text-muted"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest ml-1">Message Content (HTML Supported)</label>
                                <textarea
                                    value={campaign.message}
                                    onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                                    placeholder="Write your campaign message..."
                                    className="w-full px-4 py-3 rounded-xl border border-sv-border focus:ring-2 focus:ring-sv-primary/20 outline-none transition-all h-64 font-mono text-xs resize-none bg-sv-surface-muted text-sv-text-primary placeholder:text-sv-text-muted"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex items-center gap-2 bg-sv-primary text-sv-text-inverse px-8 py-3 rounded-xl hover:bg-sv-primary-hover transition-all font-black uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-xs"
                                >
                                    {sending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <FiSend />}
                                    {sending ? 'Processing...' : 'Blast Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Stats & Recent */}
                <div className="space-y-6">
                    <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border p-4 sm:p-6 space-y-5">
                        <div className="flex items-center gap-2 text-sv-text-primary font-bold border-b border-sv-border pb-3">
                            <FiBarChart2 className="text-sv-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Category Interests</h3>
                        </div>
                        <div className="space-y-5">
                            {[
                                { label: 'New Arrivals', count: stats?.byPreference?.newArrivals || 0, color: 'bg-sv-primary' },
                                { label: 'Promotions', count: stats?.byPreference?.promotions || 0, color: 'bg-sv-tag' },
                                { label: 'Blog Posts', count: stats?.byPreference?.blogPosts || 0, color: 'bg-sv-success' }
                            ].map((pref) => (
                                <div key={pref.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                        <span className="text-sv-text-muted">{pref.label}</span>
                                        <span className="text-sv-text-primary">{pref.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-sv-surface-muted rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${pref.color}`} 
                                            style={{ width: `${Math.min(100, (pref.count / (stats?.total || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border p-4 sm:p-6">
                        <div className="flex items-center gap-2 text-sv-text-primary font-bold border-b border-sv-border pb-3 mb-4">
                            <FiUsers className="text-sv-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Recent Subs</h3>
                        </div>
                        <div className="space-y-4">
                            {subscribers.slice(0, 5).map((sub: any) => (
                                <div key={sub._id} className="flex flex-col border-b border-sv-border last:border-0 pb-3 last:pb-0">
                                    <span className="text-xs font-bold text-sv-text-primary truncate">{sub.email}</span>
                                    <span className="text-[10px] text-sv-text-muted font-bold uppercase mt-1 tracking-tight">
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
