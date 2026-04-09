import { useEffect, useState, useCallback, useRef } from 'react';
import { adminService } from '../api/admin.service';
import { FiXCircle, FiInfo, FiLayout, FiTrendingUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface AdCampaign {
  _id: string;
  storeId: {
    _id: string;
    name: string;
    slug: string;
    marketingBalance: number;
    fraudState: string;
  };
  vendorId: {
    name: string;
    email: string;
  };
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'EXHAUSTED';
  type: string;
  totalBudget: number;
  bidAmount: number;
  rejectionReason?: string;
  createdAt: string;
}

export default function AdsModeration() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');

  const fetchAds = useCallback(async (isInitial = true, currentCursor?: string) => {
    setLoading(true);
    try {
      const resp = await adminService.getAdCampaigns({
        cursor: isInitial ? undefined : currentCursor,
        status: statusFilter,
        limit: 20
      });
      if (resp.data?.ads) {
        setAds(isInitial ? resp.data.ads : prev => [...prev, ...resp.data.ads]);
        setCursor(resp.data.nextCursor);
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAds(true);
  }, [fetchAds]);

  const handleModerate = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    setModeratingId(id);
    try {
      const resp = await adminService.moderateAdCampaign(id, {
        status,
        reason: status === 'REJECTED' ? rejectionReason : undefined
      });
      if (resp.success) {
        // Remove from list if it no longer matches filter
        setAds(prev => prev.filter(a => a._id !== id));
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        alert(resp.message || 'Moderation failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Moderation failed');
    } finally {
      setModeratingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'PENDING_REVIEW': 'bg-amber-100 text-amber-700 border-amber-200',
      'ACTIVE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
      'PAUSED': 'bg-gray-100 text-gray-700 border-gray-200',
      'EXHAUSTED': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return (
      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
               <FiTrendingUp className="text-lg" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ads Moderation</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Review and approve vendor marketing campaigns</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          {['PENDING_REVIEW', 'ACTIVE', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setAds([]); hasFetched.current = false; }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                statusFilter === f 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {ads.map((ad) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={ad._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Store Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xl">
                        <FiLayout className="text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 leading-none mb-1">{ad.storeId?.name}</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{ad.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {getStatusBadge(ad.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Budget</p>
                      <p className="text-sm font-black text-slate-900">₦{(ad.totalBudget / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bid Price</p>
                      <p className="text-sm font-black text-slate-900">₦{(ad.bidAmount / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 hidden md:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Date</p>
                      <p className="text-sm font-black text-slate-900">{new Date(ad.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Health Guard Details */}
                <div className="lg:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Marketing Balance</span>
                      <span className={`text-xs font-black ${ad.storeId?.marketingBalance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₦{(ad.storeId?.marketingBalance / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Fraud State</span>
                      <span className={`text-xs font-black ${ad.storeId?.fraudState === 'NORMAL' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {ad.storeId?.fraudState}
                      </span>
                    </div>
                  </div>

                  {ad.status === 'PENDING_REVIEW' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleModerate(ad._id, 'ACTIVE')}
                        disabled={!!moderatingId}
                        className="flex-1 bg-emerald-600 text-white h-10 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => { setModeratingId(ad._id); setShowRejectModal(true); }}
                        disabled={!!moderatingId}
                        className="w-10 h-10 bg-white border border-slate-200 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-50 transition-colors active:scale-95"
                      >
                        <FiXCircle className="text-lg" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {ads.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <FiInfo className="mx-auto text-4xl text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">No ads found matching "{statusFilter}"</p>
          </div>
        )}

        {cursor && (
          <button
            onClick={() => fetchAds(false, cursor)}
            className="mt-6 py-4 text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            Load More Campaigns
          </button>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
               onClick={() => { setShowRejectModal(false); setModeratingId(null); }}
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-3xl shadow-2xl relative w-full max-w-md p-8"
             >
               <h2 className="text-2xl font-black text-slate-900 mb-2">Reject Campaign</h2>
               <p className="text-slate-500 text-sm font-medium mb-6">Briefly explain why this ad was rejected so the vendor can fix it.</p>
               
               <textarea
                 value={rejectionReason}
                 onChange={(e) => setRejectionReason(e.target.value)}
                 className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none mb-6 font-medium"
                 placeholder="e.g. Misleading content, Poor image quality..."
               />

               <div className="flex gap-4">
                 <button
                    onClick={() => { setShowRejectModal(false); setModeratingId(null); }}
                    className="flex-1 bg-slate-100 text-slate-600 h-12 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                 >
                    CANCEL
                 </button>
                 <button
                    onClick={() => moderatingId && handleModerate(moderatingId, 'REJECTED')}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-rose-600 text-white h-12 rounded-2xl text-sm font-black shadow-lg shadow-rose-200 active:scale-95 transition-transform disabled:opacity-50"
                 >
                    REJECT AD
                 </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
