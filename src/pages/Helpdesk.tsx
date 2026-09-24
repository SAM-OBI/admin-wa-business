import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeadset, FaTicketAlt, FaUsers, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaFilter, FaInbox,
  FaFire, FaChevronRight, FaBell, FaCircle
} from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import TicketDetail from '../components/helpdesk/TicketDetail';
import AgentManagement from '../components/helpdesk/AgentManagement';
import QueueRulesEditor from '../components/helpdesk/QueueRulesEditor';

type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'ESCALATED';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

interface Ticket {
  _id: string;
  ticketRef: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  queueId: string;
  assignedAgentId?: string;
  assignedAt?: string;
  slaBreached: boolean;
  firstResponseDeadline: string;
  resolutionDeadline: string;
  customerEmail: string;
  customerName?: string;
  source: string;
  createdAt: string;
}

interface HelpdeskStats {
  openTickets: number;
  inProgressTickets: number;
  slaBreachedTickets: number;
  resolvedToday: number;
  avgFirstResponseMins: number;
  avgResolutionMins: number;
}

type ActiveTab = 'queue' | 'agents' | 'rules';

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; dot: string }> = {
  urgent: { label: 'Urgent',  color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',    dot: 'bg-sv-danger'    },
  high:   { label: 'High',    color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30', dot: 'bg-sv-warning' },
  normal: { label: 'Normal',  color: 'bg-sv-info-soft text-sv-info border-sv-info/30', dot: 'bg-sv-info'   },
  low:    { label: 'Low',     color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  OPEN:        { label: 'Open',        color: 'bg-primary/10 text-primary border-primary/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-sv-info-soft text-sv-info border-sv-info/30'   },
  PENDING:     { label: 'Pending',     color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30' },
  RESOLVED:    { label: 'Resolved',    color: 'bg-secondary text-primary border-primary/20'  },
  ESCALATED:   { label: 'Escalated',   color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'       },
};

export default function Helpdesk() {
  const [activeTab, setActiveTab]             = useState<ActiveTab>('queue');
  const [tickets, setTickets]                 = useState<Ticket[]>([]);
  const [stats, setStats]                     = useState<HelpdeskStats | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [selectedTicket, setSelectedTicket]   = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus]       = useState<TicketStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority]   = useState<TicketPriority | 'ALL'>('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/support/admin/tickets'),
        api.get('/support/admin/stats'),
      ]);
      setTickets(ticketsRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch {
      toast.error('Failed to load helpdesk data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus   !== 'ALL' && t.status   !== filterStatus)   return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  const getSLATimeLeft = (deadline: string): { label: string; isBreached: boolean; isWarning: boolean } => {
    const diff = new Date(deadline).getTime() - Date.now();
    const mins = Math.floor(diff / 60_000);
    if (mins < 0)  return { label: 'Breached',         isBreached: true,  isWarning: false };
    if (mins < 30) return { label: `${mins}m`,          isBreached: false, isWarning: true  };
    if (mins < 60) return { label: `${mins}m`,          isBreached: false, isWarning: true  };
    const hrs = Math.floor(mins / 60);
    return { label: `${hrs}h ${mins % 60}m`, isBreached: false, isWarning: false };
  };

  return (
    <div className="min-h-screen bg-sv-bg">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-white/10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-[5px] flex items-center justify-center">
              <FaHeadset size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Helpdesk
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Platform Support — Admin View
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-black/30 rounded-[5px] border border-slate-200 dark:border-white/10">
            {([
              { id: 'queue',  label: 'Ticket Queue',  icon: FaInbox   },
              { id: 'agents', label: 'Agents',         icon: FaUsers   },
              { id: 'rules',  label: 'Routing Rules',  icon: FaFilter  },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === id
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Open',             value: stats.openTickets,           icon: FaTicketAlt,          color: 'text-primary'      },
              { label: 'In Progress',      value: stats.inProgressTickets,     icon: FaClock,              color: 'text-blue-600'     },
              { label: 'SLA Breached',     value: stats.slaBreachedTickets,    icon: FaExclamationTriangle,color: 'text-red-600'      },
              { label: 'Resolved Today',   value: stats.resolvedToday,          icon: FaCheckCircle,        color: 'text-primary'      },
              { label: 'Avg First Resp',   value: `${stats.avgFirstResponseMins}m`, icon: FaBell,          color: 'text-amber-600'    },
              { label: 'Avg Resolution',   value: `${Math.floor(stats.avgResolutionMins / 60)}h`, icon: FaFire, color: 'text-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3">
                <Icon size={18} className={color} />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'queue' && (
            <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'ALL')}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-[5px] text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-200"
                >
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as TicketPriority | 'ALL')}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-[5px] text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-200"
                >
                  <option value="ALL">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>

                <span className="ml-auto text-xs font-black text-slate-400 uppercase tracking-widest self-center">
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Ticket Table */}
              <div className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading tickets...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaCheckCircle size={40} className="text-slate-200 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Queue empty</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredTickets.map((ticket) => {
                      const sla = getSLATimeLeft(ticket.firstResponseDeadline);
                      const priority = PRIORITY_CONFIG[ticket.priority];
                      const status  = STATUS_CONFIG[ticket.status];

                      return (
                        <motion.button
                          key={ticket._id}
                          layout
                          onClick={() => setSelectedTicket(ticket)}
                          className="w-full p-4 md:p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group"
                        >
                          {/* Priority dot */}
                          <FaCircle size={8} className={priority.dot} />

                          {/* Ticket info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                                {ticket.ticketRef}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-[3px] border uppercase tracking-widest ${priority.color}`}>
                                {priority.label}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-[3px] border uppercase tracking-widest ${status.color}`}>
                                {status.label}
                              </span>
                              {ticket.slaBreached && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-[3px] border uppercase tracking-widest bg-sv-danger-soft text-sv-danger border-sv-danger/30 flex items-center gap-1">
                                  <FaExclamationTriangle size={7} /> SLA Breached
                                </span>
                              )}
                            </div>
                            <p className="font-black text-slate-900 dark:text-white text-sm truncate">{ticket.subject}</p>
                            <p className="text-xs text-slate-400 font-medium">{ticket.customerEmail}</p>
                          </div>

                          {/* SLA timer */}
                          <div className={`text-right shrink-0 hidden md:block ${sla.isBreached ? 'text-red-600' : sla.isWarning ? 'text-amber-600' : 'text-slate-400'}`}>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                              {sla.isBreached ? 'Breached' : 'SLA Left'}
                            </p>
                            <p className="font-black text-sm">{sla.label}</p>
                          </div>

                          {/* Queue */}
                          <div className="text-right shrink-0 hidden lg:block">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-0.5">Queue</p>
                            <p className="text-xs font-black text-slate-600 dark:text-gray-300 capitalize">{ticket.queueId}</p>
                          </div>

                          <FaChevronRight size={10} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'agents' && (
            <motion.div key="agents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AgentManagement onRefresh={fetchData} />
            </motion.div>
          )}

          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <QueueRulesEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ticket Detail Slide-over */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onRefresh={() => { fetchData(); setSelectedTicket(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
