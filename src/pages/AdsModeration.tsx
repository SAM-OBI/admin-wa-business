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
  // 🛡️ [BATCH-10] Real schema enum (adCampaign.model.ts) has 4 more values
  // than this type declared — a campaign in any of them would have hit
  // styles[status]===undefined below.
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'EXHAUSTED' | 'LEARNING' | 'SYSTEM_SUSPENDED' | 'SYSTEM_COMPLIANCE_HOLD' | 'SYSTEM_SUBSCRIPTION_DOWNGRADE';
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
    } catch (error: any) {
      console.error('Failed to fetch ads:', error);
      alert(error.response?.data?.message || 'Could not load ad campaigns. Please try again.');
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
      'PENDING_REVIEW': 'bg-sv-warning-soft text-sv-warning border-sv-warning/30',
      'ACTIVE': 'bg-sv-success-soft text-sv-success border-sv-success/30',
      'REJECTED': 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',
      'PAUSED': 'bg-sv-surface-muted text-sv-text-secondary border-sv-border',
      'EXHAUSTED': 'bg-sv-tag-soft text-sv-tag border-sv-tag/30',
      'LEARNING': 'bg-sv-info-soft text-sv-info border-sv-info/30',
      'SYSTEM_SUSPENDED': 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',
      'SYSTEM_COMPLIANCE_HOLD': 'bg-sv-warning-soft text-sv-warning border-sv-warning/30',
      'SYSTEM_SUBSCRIPTION_DOWNGRADE': 'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
    };
    return (
      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${styles[status] || 'bg-sv-surface-muted text-sv-text-secondary border-sv-border'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-sv-primary/10 rounded-xl flex items-center justify-center text-sv-primary shadow-sm">
               <FiTrendingUp className="text-lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Ads Moderation</h1>
          </div>
          <p className="text-sv-text-secondary font-medium tracking-tight text-sm">Review and approve vendor marketing campaigns</p>
        </div>

        <div className="flex bg-sv-surface-muted p-1 rounded-xl border border-sv-border shadow-inner overflow-x-auto">
          {['PENDING_REVIEW', 'ACTIVE', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setAds([]); hasFetched.current = false; }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                statusFilter === f 
                  ? 'bg-sv-surface text-sv-primary shadow-sm' 
                  : 'text-sv-text-secondary hover:text-sv-text-primary'
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
              className="bg-sv-surface rounded-2xl border border-sv-border shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Store Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sv-surface-muted rounded-xl border border-sv-border flex items-center justify-center text-xl">
                        <FiLayout className="text-sv-text-muted" />
                      </div>
                      <div>
                        <h3 className="font-black text-sv-text-primary leading-none mb-1">{ad.storeId?.name}</h3>
                        <p className="text-xs text-sv-text-secondary font-medium uppercase tracking-widest">{ad.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {getStatusBadge(ad.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-sv-surface-muted rounded-xl p-3 border border-sv-border">
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase mb-1">Total Budget</p>
                      <p className="text-sm font-black text-sv-text-primary">₦{(ad.totalBudget / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-sv-surface-muted rounded-xl p-3 border border-sv-border">
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase mb-1">Bid Price</p>
                      <p className="text-sm font-black text-sv-text-primary">₦{(ad.bidAmount / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-sv-surface-muted rounded-xl p-3 border border-sv-border hidden md:block">
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase mb-1">Status Date</p>
                      <p className="text-sm font-black text-sv-text-primary">{new Date(ad.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Health Guard Details */}
                <div className="lg:w-72 bg-sv-surface-muted rounded-2xl p-4 border border-sv-border flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sv-text-muted uppercase">Marketing Balance</span>
                      <span className={`text-xs font-black ${ad.storeId?.marketingBalance > 0 ? 'text-sv-success' : 'text-sv-danger'}`}>
                        ₦{(ad.storeId?.marketingBalance / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sv-text-muted uppercase">Fraud State</span>
                      <span className={`text-xs font-black ${ad.storeId?.fraudState === 'NORMAL' ? 'text-sv-success' : 'text-sv-danger'}`}>
                        {ad.storeId?.fraudState}
                      </span>
                    </div>
                  </div>

                  {ad.status === 'PENDING_REVIEW' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-sv-border">
                      <button
                        onClick={() => handleModerate(ad._id, 'ACTIVE')}
                        disabled={!!moderatingId}
                        className="flex-1 bg-sv-success text-sv-text-inverse h-10 rounded-xl text-xs font-black hover:opacity-90 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => { setModeratingId(ad._id); setShowRejectModal(true); }}
                        disabled={!!moderatingId}
                        className="w-10 h-10 bg-sv-surface border border-sv-border text-sv-danger rounded-xl flex items-center justify-center hover:bg-sv-danger-soft transition-colors active:scale-95"
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
          <div className="text-center py-20 bg-sv-surface-muted rounded-2xl border-2 border-dashed border-sv-border">
            <FiInfo className="mx-auto text-4xl text-sv-text-muted mb-4" />
            <p className="text-sv-text-secondary font-bold">No ads found matching "{statusFilter}"</p>
          </div>
        )}

        {cursor && (
          <button
            onClick={() => fetchAds(false, cursor)}
            className="mt-6 py-4 text-sm font-black text-sv-primary hover:text-sv-primary-hover uppercase tracking-widest transition-colors"
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
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => { setShowRejectModal(false); setModeratingId(null); }}
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-sv-surface rounded-2xl shadow-2xl relative w-full max-w-md p-6 sm:p-8 border border-sv-border"
             >
               <h2 className="text-2xl font-black text-sv-text-primary mb-2">Reject Campaign</h2>
               <p className="text-sv-text-secondary text-sm font-medium mb-6">Briefly explain why this ad was rejected so the vendor can fix it.</p>
               
               <textarea
                 value={rejectionReason}
                 onChange={(e) => setRejectionReason(e.target.value)}
                 className="w-full h-32 bg-sv-surface-muted border border-sv-border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sv-primary focus:outline-none mb-6 font-medium"
                 placeholder="e.g. Misleading content, Poor image quality..."
               />

               <div className="flex gap-4">
                 <button
                    onClick={() => { setShowRejectModal(false); setModeratingId(null); }}
                    className="flex-1 bg-sv-surface-muted text-sv-text-secondary h-12 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                 >
                    CANCEL
                 </button>
                 <button
                    onClick={() => moderatingId && handleModerate(moderatingId, 'REJECTED')}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-sv-danger text-sv-text-inverse h-12 rounded-2xl text-sm font-black active:scale-95 transition-transform disabled:opacity-50"
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
