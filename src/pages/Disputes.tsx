import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaGavel, FaImage, FaVideo, FaHandshake, FaClock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';

// Native relative time helper to replace date-fns
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

// 🛡️ [P0.8] Broken status filter — was comparing lowercase, invented labels
// ('open'/'mediation'/'resolved') directly against the real backend enum
// (OPEN/UNDER_REVIEW/PROPOSAL_SENT/ESCALATED/RESOLVED_*/WITHDRAWN), so every
// filter except the implicit 'all' silently matched nothing. Maps a friendly
// label to the actual status value(s) — the backend enum itself is untouched.
const STATUS_FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'OPEN', label: 'Open', statuses: ['OPEN'] },
  { key: 'UNDER_REVIEW', label: 'In Review', statuses: ['UNDER_REVIEW', 'PROPOSAL_SENT'] },
  { key: 'ESCALATED', label: 'Escalated', statuses: ['ESCALATED'] },
  { key: 'RESOLVED', label: 'Resolved', statuses: ['RESOLVED_REFUND', 'RESOLVED_RELEASE', 'RESOLVED_PARTIAL'] },
  { key: 'WITHDRAWN', label: 'Withdrawn', statuses: ['WITHDRAWN'] },
];

export default function Disputes() {
  const { admin } = useAuthStore();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolving, setResolving] = useState(false);

  // 🛡️ [BATCH-11] Was a single fetch-everything-on-mount call with all
  // filtering/search done client-side against the full in-memory array —
  // the backend now paginates + filters server-side, so `filter`/
  // `searchTerm` are wired into the request instead of a local .filter().
  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchTerm]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const activeFilter = STATUS_FILTERS.find(f => f.key === filter);
      const params: Record<string, string> = { limit: '100' };
      if (activeFilter?.statuses) params.status = activeFilter.statuses.join(',');
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/disputes/admin/all', { params });
      setDisputes(res.data.data.disputes);
    } catch {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeDispute) return;

    setSending(true);
    try {
      const res = await api.post(`/disputes/${activeDispute._id}/messages`, { message: `[ADMIN]: ${message}` });
      if (res.data.success) {
        setActiveDispute(res.data.data);
        setDisputes(prev => prev.map(d => d._id === activeDispute._id ? res.data.data : d));
        setMessage('');
      }
    } catch {
      Swal.fire('Error', 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg: any) => {
    return msg.sender === admin?._id || msg.message.startsWith('[ADMIN]');
  };

  // 🛡️ [P0.8] Resolution truncated — was 2 hardcoded outcomes (refund,
  // dismissed) when the backend actually supports 4 reachable inputs across
  // 3 terminal states: refund -> RESOLVED_REFUND, release/dismissed ->
  // RESOLVED_RELEASE, partial_refund -> RESOLVED_PARTIAL (see
  // dispute.controller.ts::resolveDispute's own terminalMap — this is
  // exactly what it accepts, not a new contract). NOTE: the Dispute model's
  // resolution.type union also lists 'replacement' and 'fulfilled', but
  // resolveDispute's terminalMap has no entry for either — they are
  // currently unreachable dead values, not wired to any terminal state, so
  // no button is built for them here rather than shipping a control that
  // would 400. Flagged for a separate decision on what those should map to.
  const handleResolve = async (id: string, type: 'refund' | 'release' | 'dismissed' | 'partial_refund', amount?: number) => {
      setResolving(true);
      try {
          const res = await api.patch(`/disputes/${id}/resolve`, {
              resolution: {
                  type,
                  amount,
                  notes: 'Admin Final Decision'
              }
          });
          if (res.data.success) {
              Swal.fire('Resolved', `Dispute has been resolved (${type.replace('_', ' ')})`, 'success');
              fetchDisputes();
              setActiveDispute(null);
          }
      } catch (err: any) {
          Swal.fire('Error', err.response?.data?.message || 'Could not resolve dispute', 'error');
      } finally {
          setResolving(false);
      }
  };

  const handlePartialRefund = async (id: string) => {
      const { value: amount } = await Swal.fire({
          title: 'Partial Refund Amount',
          input: 'number',
          inputLabel: 'Amount to refund the buyer (NGN)',
          inputAttributes: { min: '1', step: '1' },
          showCancelButton: true,
          confirmButtonText: 'Resolve',
          inputValidator: (value) => {
              if (!value || Number(value) <= 0) return 'Enter a valid amount greater than zero';
              return null;
          }
      });
      if (amount) {
          await handleResolve(id, 'partial_refund', Number(amount));
      }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50/50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shadow-sm border border-purple-100">
              <FaGavel size={20} />
            </div>
            Dispute Tribunal
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Marketplace Mediation & Resolution</p>
        </div>

        <div className="flex items-center gap-4">
          <HardenedSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="SEARCH CASES..."
            className="w-64 scale-90"
            context="ADMIN"
          />
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
             {STATUS_FILTERS.map(({ key, label }) => (
               <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filter === key ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
               >
                 {label}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* List */}
        <div className="xl:col-span-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
               <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full"></div></div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <FaCheckCircle className="mx-auto text-green-500 mb-4" size={40} />
                <p className="font-black text-gray-400 uppercase text-xs">No Disputes Found</p>
              </div>
            ) : (
              disputes.map(dispute => (
                <motion.div
                  key={dispute._id}
                  layout
                  onClick={() => setActiveDispute(dispute)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all border shadow-sm group ${
                    activeDispute?._id === dispute._id
                      ? 'bg-purple-600 border-purple-600 shadow-xl shadow-purple-200 text-white'
                      : 'bg-white border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        activeDispute?._id === dispute._id ? 'bg-white/20' : 'bg-purple-50 text-purple-600'
                    }`}>
                        {dispute.status}
                    </span>
                    <span className="text-[10px] opacity-70">
                        {formatRelativeTime(new Date(dispute.updatedAt))} ago
                    </span>
                  </div>
                  <h3 className="font-bold text-sm">Order #{dispute.order?.orderId?.slice(-8) || 'N/A'}</h3>
                  <p className="text-[10px] opacity-80 mt-1 font-bold uppercase tracking-tight">{dispute.reason}</p>
                  {dispute.evidence?.length > 0 && (
                    <p className={`text-[9px] mt-2 flex items-center gap-1 font-bold uppercase ${activeDispute?._id === dispute._id ? 'text-white/70' : 'text-gray-400'}`}>
                      <FaImage size={9} /> {dispute.evidence.length} evidence item{dispute.evidence.length === 1 ? '' : 's'}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Details */}
        <div className="xl:col-span-2">
           {activeDispute ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-250px)]">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                      <div>
                          <h2 className="text-lg font-bold">Case File: #{activeDispute.order?.orderId?.slice(-8)}</h2>
                          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Reason: {activeDispute.reason}</p>
                      </div>
                      {/* 🛡️ [P0.8] All 4 reachable outcomes, not 2 */}
                      <div className="flex flex-wrap justify-end gap-2 max-w-xs">
                          <button
                            onClick={() => handleResolve(activeDispute._id, 'refund')}
                            disabled={resolving}
                            className="bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
                          >
                            Refund Buyer
                          </button>
                          <button
                            onClick={() => handlePartialRefund(activeDispute._id)}
                            disabled={resolving}
                            className="bg-orange-50 text-orange-600 hover:bg-orange-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
                          >
                            Partial Refund
                          </button>
                          <button
                            onClick={() => handleResolve(activeDispute._id, 'release')}
                            disabled={resolving}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
                          >
                            Release to Vendor
                          </button>
                          <button
                            onClick={() => handleResolve(activeDispute._id, 'dismissed')}
                            disabled={resolving}
                            className="bg-gray-50 text-gray-600 hover:bg-gray-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                     <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Buyer's Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{activeDispute.description}</p>
                     </div>

                     {activeDispute.messages.map((msg: any, i: number) => {
                        // 🛡️ [P0.8] Proposal-blind fix — renders the SAME
                        // proposals array the buyer/vendor DisputeChat.tsx
                        // already reads, no second proposal mechanism.
                        if (msg.messageType === 'PROPOSAL') {
                            const proposal = (activeDispute.proposals || []).find((p: any) => p.proposalId === msg.proposalId);
                            if (!proposal) return null;
                            return (
                                <div key={i} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900">
                                    <p className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <FaHandshake /> Proposal — {proposal.type.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm font-bold">₦{Number(proposal.amount).toLocaleString()}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                                        <span>Status: {proposal.status}</span>
                                        {proposal.status === 'PENDING' && (
                                            <span className="flex items-center gap-1"><FaClock size={9} /> Expires {formatRelativeTime(new Date(proposal.expiresAt))}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // 🛡️ [P0.8] Evidence-blind fix — renders the real,
                        // persisted Cloudinary media from activeDispute.evidence
                        // (the canonical Order.openingEvidence trail, see
                        // backend P0.1/P0.4) instead of showing nothing.
                        if (msg.messageType === 'IMAGE' || msg.messageType === 'VIDEO') {
                            const found = (activeDispute.evidence || []).find((e: any) => e.evidenceId === msg.assetId);
                            return (
                                <div key={i} className={`p-4 rounded-xl text-sm ${isMyMessage(msg) ? 'bg-purple-50 text-purple-900 ml-10' : 'bg-gray-100 mr-10'}`}>
                                    <p className="font-bold text-[9px] uppercase opacity-50 mb-2">
                                        {msg.senderModel || 'User'} • {formatRelativeTime(new Date(msg.timestamp))} ago
                                    </p>
                                    {found ? (
                                        <a href={found.url} target="_blank" rel="noopener noreferrer" className="block aspect-video max-w-sm rounded-lg overflow-hidden border border-gray-200 mb-2">
                                            {msg.messageType === 'VIDEO'
                                                ? <video src={found.url} className="w-full h-full object-cover" controls />
                                                : <img src={found.url} alt="Evidence" className="w-full h-full object-cover" />}
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                            {msg.messageType === 'VIDEO' ? <FaVideo /> : <FaImage />} Evidence unavailable
                                        </div>
                                    )}
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            );
                        }

                        if (msg.messageType === 'SYSTEM_EVENT') {
                            return (
                                <div key={i} className="text-center">
                                    <span className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={i} className={`p-4 rounded-xl text-sm ${isMyMessage(msg) ? 'bg-purple-50 text-purple-900 ml-10' : 'bg-gray-100 mr-10'}`}>
                                <p className="font-bold text-[9px] uppercase opacity-50 mb-1">
                                   {msg.senderModel || 'User'} • {formatRelativeTime(new Date(msg.timestamp))} ago
                                </p>
                                <p className="text-sm">{msg.message}</p>
                            </div>
                        );
                     })}

                     {/* 🛡️ [P0.8] Appeal visibility — admin needs to see a
                         filed appeal to review it (PATCH /disputes/:id/appeal
                         from the backend P0.6 contract); requestedBy is the
                         real-appeal-exists guard, matching the buyer/vendor
                         AppealPanel.tsx and the backend's own check — the
                         nested appeal object otherwise always has a
                         schema-defaulted status even when nothing was filed. */}
                     {activeDispute.appeal?.requestedBy && (
                        <AdminAppealReview
                            dispute={activeDispute}
                            onUpdate={(updated: any) => {
                                setActiveDispute(updated);
                                setDisputes(prev => prev.map(d => d._id === updated._id ? updated : d));
                            }}
                        />
                     )}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-4 flex gap-3 pt-4 border-t border-gray-100">
                      <input
                         value={message}
                         onChange={e => setMessage(e.target.value)}
                         placeholder="Enter adjudication note..."
                         className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                      <button
                         type="submit"
                         disabled={sending}
                         className="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all"
                      >
                         Send
                      </button>
                  </form>
              </div>
           ) : (
              <div className="h-full bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-4">
                    <FaGavel size={40} />
                  </div>
                  <h3 className="font-bold text-gray-400">Select a case for adjudication</h3>
                  <p className="text-xs text-gray-400 mt-2">Active disputes waiting for mediator intervention will appear in the left column.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

/**
 * 🛡️ [P0.6/P0.8] Admin side of the appeal contract added this batch
 * (PATCH /disputes/:id/appeal). Deliberately records a decision only —
 * OVERTURNED does not trigger any refund/release reversal on its own (see
 * backend dispute.controller.ts::reviewAppeal's own comment); if money
 * needs to move differently, that stays the existing, separate
 * resolveDispute action above, run manually by the admin.
 */
function AdminAppealReview({ dispute, onUpdate }: { dispute: any; onUpdate: (updated: any) => void }) {
  const [reviewing, setReviewing] = useState(false);
  const appeal = dispute.appeal;
  const isDecided = appeal.status === 'REJECTED' || appeal.status === 'OVERTURNED';

  const handleReview = async (status: 'REJECTED' | 'OVERTURNED') => {
    const { value: notes } = await Swal.fire({
      title: `Mark appeal ${status.toLowerCase()}?`,
      input: 'textarea',
      inputLabel: 'Review notes (optional)',
      showCancelButton: true,
      confirmButtonText: 'Confirm'
    });
    if (notes === undefined) return; // cancelled

    setReviewing(true);
    try {
      const res = await api.patch(`/disputes/${dispute._id}/appeal`, { status, resolutionNotes: notes });
      if (res.data.success) {
        toast.success(`Appeal marked ${status.toLowerCase()}`);
        onUpdate(res.data.data);
      }
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'Could not review appeal', 'error');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
      <p className="font-black text-[10px] uppercase tracking-widest text-indigo-700 flex items-center gap-2 mb-2">
        <FaGavel /> Appeal Filed — {appeal.status}
      </p>
      <p className="text-sm text-gray-700">{appeal.reason}</p>
      {appeal.resolutionNotes && (
        <p className="text-xs text-gray-500 mt-2 italic">Prior note: {appeal.resolutionNotes}</p>
      )}
      {!isDecided && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleReview('OVERTURNED')}
            disabled={reviewing}
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            Overturn
          </button>
          <button
            onClick={() => handleReview('REJECTED')}
            disabled={reviewing}
            className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            Reject Appeal
          </button>
        </div>
      )}
    </div>
  );
}
