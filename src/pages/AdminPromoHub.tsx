import React, { useState, useEffect, useCallback} from 'react';
import { 
    FaTicketAlt, 
    FaToggleOn, 
    FaToggleOff, 
    FaExclamationTriangle,
    FaSync,
    FaBolt,
    FaGift,
    FaPlus
} from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';
import Swal from 'sweetalert2';

// Backend Contract Shapes
interface PromoStats {
    id: string; // Changed from _id
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usageLimit: number;
    usageCount: number; // Changed from usedCount
    isActive: boolean;
    riskScore: 'Low' | 'High' | 'Critical'; // Backend driven
    storeId: { name: string } | string; // Normalized in UI
}

interface FlashSaleStats {
    id: string; 
    productName: string;
    storeName: string;
    discountPrice: number;
    originalPrice: number;
    soldCount: number;
    maxQuantity: number;
    riskScore: 'Low' | 'Peak';
    isActive: boolean;
}

interface ReferralStats {
    _id: string;
    code: string;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
    createdAt: string;
}

const AdminPromoHub: React.FC = () => {
    const [discountCodes, setDiscountCodes] = useState<PromoStats[]>([]);
    const [flashSales, setFlashSales] = useState<FlashSaleStats[]>([]);
    const [referrals, setReferrals] = useState<ReferralStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'discounts' | 'flash-sales' | 'referrals'>('discounts');

    const fetchData = useCallback(async () => {
        const controller = new AbortController();
        setLoading(true);
        try {
            // 🛡️ [FIX] Each request used to carry its own .catch(() => ({data:
            // {success:false}})), which swallowed the real error before it
            // ever reached error handling - a failed request just silently
            // left that tab's state as whatever it was (empty on first
            // load), with zero error signal anywhere. Promise.allSettled
            // keeps the three tabs independent (one endpoint failing doesn't
            // block the other two from loading) while surfacing exactly
            // which one(s) failed via a real toast instead of a swallowed
            // error.
            const [codesRes, flashRes, refRes] = await Promise.allSettled([
                api.get('/admin/marketing/discount-codes', { signal: controller.signal }),
                api.get('/admin/marketing/flash-sales', { signal: controller.signal }),
                api.get('/referrals', { signal: controller.signal })
            ]);

            const failedLabels: string[] = [];

            if (codesRes.status === 'fulfilled') {
                if (codesRes.value.data.success) setDiscountCodes(codesRes.value.data.data.data); // data.data.data due to pagination wrapper
            } else if ((codesRes.reason as any)?.name !== 'CanceledError') {
                logger.error('Failed to fetch discount codes:', codesRes.reason);
                failedLabels.push('discount codes');
            }

            if (flashRes.status === 'fulfilled') {
                if (flashRes.value.data.success) setFlashSales(flashRes.value.data.data.data);
            } else if ((flashRes.reason as any)?.name !== 'CanceledError') {
                logger.error('Failed to fetch flash sales:', flashRes.reason);
                failedLabels.push('flash sales');
            }

            if (refRes.status === 'fulfilled') {
                if (refRes.value.data.success) setReferrals(refRes.value.data.data);
            } else if ((refRes.reason as any)?.name !== 'CanceledError') {
                logger.error('Failed to fetch referrals:', refRes.reason);
                failedLabels.push('referrals');
            }

            if (failedLabels.length > 0) {
                toast.error(`Failed to load ${failedLabels.join(', ')}. Please try again.`);
            }
        } finally {
            setLoading(false);
        }
        return () => controller.abort();
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerateReferral = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Generate Referral Code',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="CODE (e.g. VIP-100)" style="text-transform: uppercase;">' +
                '<input id="swal-input2" type="number" class="swal2-input" placeholder="Max Uses (e.g. 50)">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Generate',
            preConfirm: () => {
                const code = (document.getElementById('swal-input1') as HTMLInputElement).value;
                const maxUses = (document.getElementById('swal-input2') as HTMLInputElement).value;
                if (!code || !maxUses) {
                    Swal.showValidationMessage('Code and Max Uses are required');
                    return null;
                }
                return { code: code.toUpperCase(), maxUses: parseInt(maxUses) };
            }
        });

        if (formValues) {
            try {
                const res = await api.post('/referrals/generate', formValues);
                if (res.data.success) {
                    toast.success('Referral code generated!');
                    fetchData();
                }
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to generate code');
            }
        }
    };

    const handleToggle = async (type: 'discount' | 'flash-sale' | 'referral', id: string, currentStatus: boolean, name: string) => {
        const { value: reason } = await Swal.fire({
            title: `${currentStatus ? 'Deactivate' : 'Activate'} Promotion?`,
            text: `Action will be logged for oversight. Target: ${name}`,
            input: 'textarea',
            inputPlaceholder: 'Mandatory reason for kill-switch toggle...',
            inputAttributes: { 'aria-label': 'Reason for toggle' },
            showCancelButton: true,
            confirmButtonColor: currentStatus ? '#ef4444' : '#10b981',
            confirmButtonText: `Yes, ${currentStatus ? 'Deactivate' : 'Activate'}`,
            inputValidator: (value) => {
                if (!value) return 'You must provide a reason for this audit-sensitive action!';
            }
        });

        if (reason) {
            try {
                let endpoint = '';
                if (type === 'discount') endpoint = `/admin/marketing/discount-codes/${id}/toggle`;
                else if (type === 'flash-sale') endpoint = `/admin/marketing/flash-sales/${id}/toggle`;
                else if (type === 'referral') endpoint = `/referrals/${id}/toggle`;
                
                // Explicitly sending the DESIRED state (flip current)
                const res = await api.patch(endpoint, { 
                    reason,
                    isActive: !currentStatus 
                });

                if (res.data.success) {
                    toast.success('Promotion status updated');
                    // 🛡️ [FIX] window.location.reload() wiped all React state
                    // including activeTab - toggling anything on Flash Sales
                    // or Store Referrals kicked the admin back to the default
                    // Discount Codes tab after every single toggle. fetchData
                    // already exists for exactly this refetch-for-audit-sync
                    // purpose, without the full page reload.
                    fetchData();
                }
            } catch (error: any) {
                toast.error(error?.normalized?.message || 'Toggle failed');
            }
        }
    };
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sv-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-sv-border">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-sv-primary-soft flex items-center justify-center text-sv-primary border border-sv-border">
                            <FaTicketAlt size={20} />
                        </div>
                        Marketing Oversight Hub
                    </h1>
                    <p className="text-sv-text-secondary mt-1 text-sm font-medium">Deterministic kill-switches and abuse monitoring.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeTab === 'referrals' && (
                        <button 
                            onClick={handleGenerateReferral}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sv-success text-sv-text-inverse rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow-xs"
                        >
                            <FaPlus /> Generate
                        </button>
                    )}
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-sv-surface-muted text-sv-text-primary hover:bg-sv-border rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-sv-border shadow-xs disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-sv-surface-muted rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-thin">
                <button 
                    onClick={() => setActiveTab('discounts')}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'discounts' ? 'bg-sv-surface text-sv-text-primary shadow-xs border border-sv-border' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                >
                    Discount Codes
                </button>
                <button 
                    onClick={() => setActiveTab('flash-sales')}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'flash-sales' ? 'bg-sv-surface text-sv-text-primary shadow-xs border border-sv-border' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                >
                    Flash Sales
                </button>
                <button 
                    onClick={() => setActiveTab('referrals')}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'referrals' ? 'bg-sv-surface text-sv-text-primary shadow-xs border border-sv-border' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
                >
                    Store Referrals
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                            <tr className="bg-sv-surface-muted/60 border-b border-sv-border">
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Promotion</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Store</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Performance</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Risk</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sv-border">
                            {loading ? (
                                <tr><td colSpan={5} className="py-10 text-center text-sv-text-muted text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Platform...</td></tr>
                            ) : activeTab === 'discounts' ? (
                                discountCodes.map((item) => (
                                    <tr key={item.id} className="group hover:bg-sv-surface-muted/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-sv-success-soft text-sv-success' : 'bg-sv-danger-soft text-sv-danger'}`}>
                                                    <FaTicketAlt size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sv-text-primary text-sm">{item.code}</p>
                                                    <p className="text-[9px] text-sv-text-muted font-bold uppercase">{item.type === 'percentage' ? `${item.value}% OFF` : `₦${item.value} OFF`}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-sv-text-secondary text-xs">{(item.storeId as any)?.name || 'N/A'}</td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <p className="text-xs font-black text-sv-text-primary">{item.usageCount} Uses</p>
                                            <div className="w-16 h-1.5 bg-sv-surface-muted border border-sv-border rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-sv-primary rounded-full" 
                                                    style={{ width: `${Math.min((item.usageCount / (item.usageLimit || 100)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            {item.riskScore !== 'Low' ? (
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit ${
                                                    item.riskScore === 'Critical' ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30' :
                                                    item.riskScore === 'High' ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/20' :
                                                    'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
                                                }`}>
                                                    <FaExclamationTriangle size={10} />
                                                    {item.riskScore} Risk
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-sv-success uppercase tracking-widest">Safe</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('discount', item.id, item.isActive, item.code)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-sv-success hover:bg-sv-success-soft' : 'text-sv-danger hover:bg-sv-danger-soft'}`}
                                            >
                                                {item.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'flash-sales' ? (
                                flashSales.map((item) => (
                                    <tr key={item.id} className="group hover:bg-sv-surface-muted/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-sv-warning-soft text-sv-warning' : 'bg-sv-danger-soft text-sv-danger'}`}>
                                                    <FaBolt size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sv-text-primary text-sm truncate max-w-[150px]">{item.productName}</p>
                                                    <p className="text-[9px] text-sv-text-muted font-bold uppercase">Flash Sale</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-sv-text-secondary text-xs">{item.storeName}</td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <p className="text-xs font-black text-sv-text-primary">{item.soldCount} / {item.maxQuantity} Sold</p>
                                            <div className="w-16 h-1.5 bg-sv-surface-muted border border-sv-border rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-sv-warning rounded-full" 
                                                    style={{ width: `${(item.soldCount / item.maxQuantity) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            {item.riskScore === 'Peak' ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-sv-warning/30 bg-sv-warning-soft text-sv-warning w-fit">
                                                    Peak Use
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-sv-success uppercase tracking-widest">Safe</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('flash-sale', item.id, item.isActive, item.productName)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-sv-success hover:bg-sv-success-soft' : 'text-sv-danger hover:bg-sv-danger-soft'}`}
                                            >
                                                {item.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                referrals.map((item) => (
                                    <tr key={item._id} className="group hover:bg-sv-surface-muted/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-sv-primary-soft text-sv-primary' : 'bg-sv-danger-soft text-sv-danger'}`}>
                                                    <FaGift size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sv-text-primary text-sm">{item.code}</p>
                                                    <p className="text-[9px] text-sv-text-muted font-bold uppercase">1 Month Trial</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-sv-text-secondary text-xs">Platform Wide</td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <p className="text-xs font-black text-sv-text-primary">{item.currentUses} / {item.maxUses} Uses</p>
                                            <div className="w-16 h-1.5 bg-sv-surface-muted border border-sv-border rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-sv-primary rounded-full" 
                                                    style={{ width: `${(item.currentUses / item.maxUses) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <span className="text-[9px] font-black text-sv-success uppercase tracking-widest">Safe</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('referral', item._id, item.isActive, item.code)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-sv-success hover:bg-sv-success-soft' : 'text-sv-danger hover:bg-sv-danger-soft'}`}
                                            >
                                                {item.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPromoHub;
