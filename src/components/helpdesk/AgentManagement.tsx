import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserPlus, FaCircle, FaEnvelope, FaTimes,
  FaToggleOn, FaToggleOff, FaUserCheck
} from 'react-icons/fa';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

interface Agent {
  _id: string;
  displayName: string;
  email: string;
  role: 'support_agent' | 'support_supervisor';
  queues: string[];
  isActive: boolean;
  isOnline: boolean;
  openTicketCount: number;
  invitedAt: string;
}

interface Props {
  onRefresh: () => void;
}

const AVAILABLE_QUEUES = ['general', 'billing', 'technical', 'partnerships', 'escalations'];

export default function AgentManagement({ onRefresh }: Props) {
  const [agents, setAgents]         = useState<Agent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm]             = useState({ displayName: '', email: '', role: 'support_agent', queues: ['general'] });
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/admin/agents');
      // 🛡️ [BATCH-10] The array is nested one level deeper than this read
      // assumed — sendResponse's envelope puts it at data.data.agents, not
      // data.data (which is {agents, pagination}, an object, not an array).
      setAgents(res.data.data?.agents || []);
    } catch {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleInvite = async () => {
    if (!form.email || !form.displayName) return toast.error('Name and email required');
    setSubmitting(true);
    try {
      await api.post('/support/admin/agents', form);
      toast.success(`Invitation sent to ${form.email}`);
      setShowInvite(false);
      setForm({ displayName: '', email: '', role: 'support_agent', queues: ['general'] });
      fetchAgents();
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (agentId: string, isActive: boolean) => {
    try {
      await api.patch(`/support/admin/agents/${agentId}`, { isActive: !isActive });
      toast.success(isActive ? 'Agent deactivated' : 'Agent reactivated');
      fetchAgents();
    } catch {
      toast.error('Failed to update agent');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Support Agents</h2>
          <p className="text-xs font-medium text-slate-400">Manage your helpdesk team and queue assignments</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-[5px] text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
        >
          <FaUserPlus size={12} />
          Invite Agent
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-[5px] animate-pulse" />
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <FaUserCheck size={40} className="text-slate-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No agents yet</p>
            <p className="text-xs text-slate-400 mt-1">Invite your first support agent to get started</p>
          </div>
        ) : agents.map((agent) => (
          <motion.div
            key={agent._id}
            layout
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-[5px] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                    {agent.displayName.charAt(0).toUpperCase()}
                  </div>
                  <FaCircle
                    size={8}
                    className={`absolute -bottom-0.5 -right-0.5 ${agent.isOnline ? 'text-green-500' : 'text-slate-300'}`}
                  />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">{agent.displayName}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {agent.role === 'support_supervisor' ? '🔷 Supervisor' : '🔹 Agent'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleActive(agent._id, agent.isActive)}
                className={`transition-colors ${agent.isActive ? 'text-primary hover:text-red-500' : 'text-slate-300 hover:text-primary'}`}
              >
                {agent.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium mb-3 truncate">{agent.email}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {agent.queues.map((q) => (
                <span key={q} className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-[3px]">
                  {q}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="text-center">
                <p className="text-xs font-black text-slate-900 dark:text-white">{agent.openTicketCount}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Open</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {agent.isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{    scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Invite Support Agent</h3>
                  <p className="text-xs text-slate-400">An email invitation will be sent with a 48h expiry link</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Sarah Okafor"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[5px] bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sarah@shopvia.ng"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[5px] bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[5px] bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="support_agent">Support Agent</option>
                    <option value="support_supervisor">Support Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Queue Assignments</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_QUEUES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          const queues = form.queues.includes(q)
                            ? form.queues.filter((x) => x !== q)
                            : [...form.queues, q];
                          setForm({ ...form, queues });
                        }}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[3px] border transition-all ${
                          form.queues.includes(q)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-slate-100 dark:bg-black/20 text-slate-500 border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[5px] text-xs font-black uppercase tracking-widest text-slate-600 dark:text-gray-300 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-[5px] text-xs font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-60 transition-all"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FaEnvelope size={11} /> Send Invitation</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
