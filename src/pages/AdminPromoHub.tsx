import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaTicketAlt, 
    FaToggleOn, 
    FaToggleOff, 
    FaExclamationTriangle,
    FaSync,
    FaBolt
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

const AdminPromoHub: React.FC = () => {
    const [discountCodes, setDiscountCodes] = useState<PromoStats[]>([]);
    const [flashSales, setFlashSales] = useState<FlashSaleStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'discounts' | 'flash-sales'>('discounts');

    const fetchData = useCallback(async () => {
        const controller = new AbortController();
        setLoading(true);
        try {
            const [codesRes, flashRes] = await Promise.all([
                api.get('/admin/marketing/discount-codes', { signal: controller.signal }),
                api.get('/admin/marketing/flash-sales', { signal: controller.signal })
            ]);
            
            if (codesRes.data.success) {
                setDiscountCodes(codesRes.data.data.data); // data.data.data due to pagination wrapper
            }
            if (flashRes.data.success) {
                setFlashSales(flashRes.data.data.data);
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

    const handleToggle = async (type: 'discount' | 'flash-sale', id: string, currentStatus: boolean, name: string) => {
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
                const endpoint = type === 'discount' 
                    ? `/admin/marketing/discount-codes/${id}/toggle`
                    : `/admin/marketing/flash-sales/${id}/toggle`;
                
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
                <button 
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
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
                                                    item.riskScore === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                    item.riskScore === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                    'bg-orange-50 text-orange-600 border-orange-100'
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
                            ) : (
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
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-100 bg-orange-50 text-orange-600 w-fit">
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
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPromoHub;
