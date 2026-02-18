import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaGavel } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

// Native relative time helper to replace date-fns
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

export default function Disputes() {
  const { admin } = useAuthStore();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/disputes/admin/all');
      setDisputes(res.data.data);
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

  const handleResolve = async (id: string, decision: 'refund' | 'dismissed') => {
      try {
          const res = await api.patch(`/disputes/${id}/resolve`, { 
              resolution: { 
                  type: decision, 
                  notes: 'Admin Final Decision' 
              } 
          });
          if (res.data.success) {
              Swal.fire('Resolved', `Dispute has been ${decision}`, 'success');
              fetchDisputes();
              setActiveDispute(null);
          }
      } catch {
          Swal.fire('Error', 'Could not resolve dispute', 'error');
      }
  };

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

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

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
           {['all', 'open', 'mediation', 'resolved'].map(f => (
             <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'
                }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* List */}
        <div className="xl:col-span-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
               <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full"></div></div>
            ) : filteredDisputes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <FaCheckCircle className="mx-auto text-green-500 mb-4" size={40} />
                <p className="font-black text-gray-400 uppercase text-xs">No Disputes Found</p>
              </div>
            ) : (
              filteredDisputes.map(dispute => (
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
                      <div className="flex gap-2">
                          <button 
                            onClick={() => handleResolve(activeDispute._id, 'refund')} 
                            className="bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition"
                          >
                            Refund Buyer
                          </button>
                          <button 
                            onClick={() => handleResolve(activeDispute._id, 'dismissed')} 
                            className="bg-gray-50 text-gray-600 hover:bg-gray-100 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition"
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
                     {activeDispute.messages.map((msg: any, i: number) => (
                         <div key={i} className={`p-4 rounded-xl text-sm ${isMyMessage(msg) ? 'bg-purple-50 text-purple-900 ml-10' : 'bg-gray-100 mr-10'}`}>
                             <p className="font-bold text-[9px] uppercase opacity-50 mb-1">
                                {msg.senderModel || 'User'} • {formatRelativeTime(new Date(msg.timestamp))} ago
                             </p>
                             <p className="text-sm">{msg.message}</p>
                         </div>
                     ))}
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
