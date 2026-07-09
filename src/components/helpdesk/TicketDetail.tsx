import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaExclamationTriangle, FaClock, FaCircle, FaPaperPlane
} from 'react-icons/fa';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  authorType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  authorName?: string;
  htmlBody: string;
  textBody: string;
  sentAt: string;
}

interface Props {
  ticket: any;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'ESCALATED'],
  PENDING:     ['IN_PROGRESS', 'RESOLVED'],
  ESCALATED:   ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED:    ['OPEN'],
};

export default function TicketDetail({ ticket, onClose, onRefresh }: Props) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/support/admin/tickets/${ticket._id}/messages`);
        setMessages(res.data.data || []);
      } catch {
        toast.error('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [ticket._id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/admin/tickets/${ticket._id}/reply`, { body: replyText });
      toast.success('Reply sent');
      setReplyText('');
      const res = await api.get(`/support/admin/tickets/${ticket._id}/messages`);
      setMessages(res.data.data || []);
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      await api.patch(`/support/admin/tickets/${ticket._id}/status`, { status: newStatus });
      toast.success(`Ticket ${newStatus.toLowerCase()}`);
      onRefresh();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const slaLeft = () => {
    const diff = new Date(ticket.resolutionDeadline).getTime() - Date.now();
    const mins = Math.floor(diff / 60_000);
    if (mins < 0) return { label: 'SLA Breached', isBreached: true };
    const hrs = Math.floor(mins / 60);
    return { label: `${hrs}h ${mins % 60}m remaining`, isBreached: false };
  };

  const sla = slaLeft();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-white/10"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticket.ticketRef}</span>
                {ticket.slaBreached && (
                  <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-[3px] flex items-center gap-1">
                    <FaExclamationTriangle size={7} /> SLA Breached
                  </span>
                )}
              </div>
              <h2 className="font-black text-slate-900 dark:text-white leading-tight">{ticket.subject}</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">{ticket.customerEmail}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-1">
              <FaTimes />
            </button>
          </div>

          <div className={`flex items-center gap-2 text-xs font-bold ${sla.isBreached ? 'text-red-600' : 'text-slate-500'}`}>
            <FaClock size={10} />
            {sla.label}
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-slate-50 dark:bg-black/20">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-[4px] bg-white dark:bg-gray-900 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-300"
          >
            <option value="">Change status...</option>
            {(STATUS_TRANSITIONS[ticket.status] || []).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button
            onClick={handleStatusChange}
            disabled={!newStatus}
            className="px-4 py-2 bg-primary text-white rounded-[4px] text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-primary/90 transition-all"
          >
            Update
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No messages yet</p>
          ) : messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[5px] px-4 py-3 text-sm ${
                  msg.authorType === 'SYSTEM'
                    ? 'bg-slate-100 dark:bg-black/20 text-slate-500 dark:text-gray-400 text-xs italic text-center w-full'
                    : msg.direction === 'OUTBOUND'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white'
                }`}
              >
                {msg.authorType !== 'SYSTEM' && (
                  <div className={`flex items-center gap-2 mb-2 ${msg.direction === 'OUTBOUND' ? 'justify-end' : ''}`}>
                    <FaCircle size={6} className={msg.direction === 'OUTBOUND' ? 'text-white/60' : 'text-primary'} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${msg.direction === 'OUTBOUND' ? 'text-white/70' : 'text-slate-400'}`}>
                      {msg.authorName || (msg.direction === 'OUTBOUND' ? 'Support Team' : 'Customer')}
                    </span>
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.textBody}</p>
                <p className={`text-[9px] mt-2 ${msg.direction === 'OUTBOUND' ? 'text-white/50 text-right' : 'text-slate-400'}`}>
                  {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex gap-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleReply()}
              placeholder="Type your reply... (⌘+Enter to send)"
              rows={3}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[5px] bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary resize-none"
            />
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim()}
              className="px-4 py-3 bg-primary text-white rounded-[5px] hover:bg-primary/90 disabled:opacity-40 transition-all self-end"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FaPaperPlane size={14} />
              }
            </button>
          </div>
          <p className="text-[9px] font-medium text-slate-400 mt-2">
            Reply will be sent from <span className="text-primary">support@shopvia.ng</span> with your name
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
