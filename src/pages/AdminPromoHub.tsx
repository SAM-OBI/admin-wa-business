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
            const [codesRes, flashRes, refRes] = await Promise.all([
                api.get('/admin/marketing/discount-codes', { signal: controller.signal }).catch(() => ({ data: { success: false }})),
                api.get('/admin/marketing/flash-sales', { signal: controller.signal }).catch(() => ({ data: { success: false }})),
                api.get('/referrals', { signal: controller.signal }).catch(() => ({ data: { success: false }}))
            ]);
            
            if (codesRes.data.success) {
                setDiscountCodes(codesRes.data.data.data); // data.data.data due to pagination wrapper
            }
            if (flashRes.data.success) {
                setFlashSales(flashRes.data.data.data);
            }
            if (refRes.data.success) {
                setReferrals(refRes.data.data);
            }
        } catch (error: any) {
            if (error.name !== 'CanceledError') {
                logger.error('Failed to fetch promo hub data:', error);
                toast.error('Failed to load marketing oversight data');
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
                    // Optimistic update or refetch
                    // Refetching is safer for audit sync
                    window.location.reload(); 
                }
            } catch (error: any) {
                toast.error(error?.normalized?.message || 'Toggle failed');
            }
        }
    };
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-500">
                            <FaTicketAlt size={20} />
                        </div>
                        Marketing Oversight Hub
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Deterministic kill-switches and abuse monitoring.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'referrals' && (
                        <button 
                            onClick={handleGenerateReferral}
                            className="flex items-center gap-2 px-4 py-2 bg-sv-success text-sv-text-inverse rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                            <FaPlus /> Generate
                        </button>
                    )}
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                <button 
                    onClick={() => setActiveTab('discounts')}
                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'discounts' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Discount Codes
                </button>
                <button 
                    onClick={() => setActiveTab('flash-sales')}
                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'flash-sales' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Flash Sales
                </button>
                <button 
                    onClick={() => setActiveTab('referrals')}
                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'referrals' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Store Referrals
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Store</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Platform...</td></tr>
                            ) : activeTab === 'discounts' ? (
                                discountCodes.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                                                    <FaTicketAlt size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.code}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{item.type === 'percentage' ? `${item.value}% OFF` : `₦${item.value} OFF`}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 dark:text-gray-400 text-xs">{(item.storeId as any)?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white">{item.usageCount} Uses</p>
                                            <div className="w-16 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full" 
                                                    style={{ width: `${Math.min((item.usageCount / (item.usageLimit || 100)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
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
                                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Safe</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('discount', item.id, item.isActive, item.code)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                            >
                                                {item.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'flash-sales' ? (
                                flashSales.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                                    <FaBolt size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[150px]">{item.productName}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Flash Sale</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 dark:text-gray-400 text-xs">{item.storeName}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white">{item.soldCount} / {item.maxQuantity} Sold</p>
                                            <div className="w-16 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-orange-500 rounded-full" 
                                                    style={{ width: `${(item.soldCount / item.maxQuantity) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.riskScore === 'Peak' ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-sv-warning/30 bg-sv-warning-soft text-sv-warning w-fit">
                                                    Peak Use
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Safe</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('flash-sale', item.id, item.isActive, item.productName)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                            >
                                                {item.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                referrals.map((item) => (
                                    <tr key={item._id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-purple-50 text-purple-500' : 'bg-red-50 text-red-500'}`}>
                                                    <FaGift size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.code}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">1 Month Trial</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 dark:text-gray-400 text-xs">Platform Wide</td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white">{item.currentUses} / {item.maxUses} Uses</p>
                                            <div className="w-16 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-purple-500 rounded-full" 
                                                    style={{ width: `${(item.currentUses / item.maxUses) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Safe</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleToggle('referral', item._id, item.isActive, item.code)}
                                                className={`p-2 rounded-lg transition-all ${item.isActive ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
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
