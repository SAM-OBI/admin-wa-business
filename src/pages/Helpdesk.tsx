import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeadset, FaTicketAlt, FaUsers, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaInbox,
  FaFire, FaChevronRight, FaBell, FaCircle
} from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import TicketDetail from '../components/helpdesk/TicketDetail';
import AgentManagement from '../components/helpdesk/AgentManagement';
// 🛡️ [SUPPORT-PHASE-G-1] QueueRulesEditor ('Routing Rules' tab) is 100%
// mock — MOCK_WORKFLOWS, a setTimeout fake fetch, and a "Publish Version"
// button whose handler just shows a toast claiming success. Shipping it
// alongside the two real tabs below would let an admin believe they just
// edited live routing logic when nothing happened. Left out of this mount;
// a real routing-rules admin UI (on top of QueueRoutingService.route(),
// which already exists and works) is a separate, larger feature.

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

type ActiveTab = 'queue' | 'agents';

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; dot: string }> = {
  urgent: { label: 'Urgent',  color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',    dot: 'bg-sv-danger'    },
  high:   { label: 'High',    color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30', dot: 'bg-sv-warning' },
  normal: { label: 'Normal',  color: 'bg-sv-info-soft text-sv-info border-sv-info/30', dot: 'bg-sv-info'   },
  low:    { label: 'Low',     color: 'bg-sv-surface-muted text-sv-text-secondary border-sv-border', dot: 'bg-sv-text-muted' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  OPEN:        { label: 'Open',        color: 'bg-sv-primary/10 text-sv-primary border-sv-primary/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-sv-info-soft text-sv-info border-sv-info/30'   },
  PENDING:     { label: 'Pending',     color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30' },
  RESOLVED:    { label: 'Resolved',    color: 'bg-sv-success-soft text-sv-success border-sv-success/30'  },
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
      // 🛡️ [SUPPORT-PHASE-G-1] getTickets nests the array as
      // `data.tickets` (alongside `data.pagination`), not `data` itself —
      // this was reading the wrong shape and would have thrown on
      // `tickets.filter(...)` below the moment this page was ever mounted.
      setTickets(ticketsRes.data.data?.tickets || []);
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
      <div className="bg-sv-surface border-b border-sv-border px-4 sm:px-6 py-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sv-primary/10 text-sv-primary rounded-xl flex items-center justify-center border border-sv-primary/20 shrink-0">
              <FaHeadset size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">
                Helpdesk
              </h1>
              <p className="text-xs font-bold text-sv-text-muted uppercase tracking-widest mt-0.5">
                Platform Support — Admin View
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-sv-surface-muted rounded-xl border border-sv-border self-start md:self-auto overflow-x-auto">
            {([
              { id: 'queue',  label: 'Ticket Queue',  icon: FaInbox   },
              { id: 'agents', label: 'Agents',         icon: FaUsers   },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === id
                    ? 'bg-sv-surface text-sv-primary shadow-xs'
                    : 'text-sv-text-muted hover:text-sv-text-primary'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Open',             value: stats.openTickets,           icon: FaTicketAlt,          color: 'text-sv-primary'      },
              { label: 'In Progress',      value: stats.inProgressTickets,     icon: FaClock,              color: 'text-sv-info'     },
              { label: 'SLA Breached',     value: stats.slaBreachedTickets,    icon: FaExclamationTriangle,color: 'text-sv-danger'      },
              { label: 'Resolved Today',   value: stats.resolvedToday,          icon: FaCheckCircle,        color: 'text-sv-success'      },
              { label: 'Avg First Resp',   value: `${stats.avgFirstResponseMins}m`, icon: FaBell,          color: 'text-sv-warning'    },
              { label: 'Avg Resolution',   value: `${Math.floor(stats.avgResolutionMins / 60)}h`, icon: FaFire, color: 'text-sv-tag' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-sv-surface rounded-2xl border border-sv-border p-4 flex items-center gap-3 shadow-xs">
                <Icon size={18} className={color} />
                <div>
                  <p className="text-[10px] font-bold text-sv-text-muted uppercase tracking-wider leading-none mb-1">{label}</p>
                  <p className="text-xl font-black text-sv-text-primary">{value}</p>
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
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'ALL')}
                  className="px-4 py-2 bg-sv-surface border border-sv-border rounded-xl text-xs font-bold uppercase tracking-wider text-sv-text-primary shadow-xs outline-none focus:ring-2 focus:ring-sv-primary/20"
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
                  className="px-4 py-2 bg-sv-surface border border-sv-border rounded-xl text-xs font-bold uppercase tracking-wider text-sv-text-primary shadow-xs outline-none focus:ring-2 focus:ring-sv-primary/20"
                >
                  <option value="ALL">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>

                <span className="ml-auto text-xs font-bold text-sv-text-muted uppercase tracking-wider self-center">
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Ticket Table */}
              <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-xs">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-sv-primary/20 border-t-sv-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest text-sv-text-muted">Loading tickets...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-16 text-center">
                    <FaCheckCircle size={40} className="text-sv-border mx-auto mb-4" />
                    <p className="text-sm font-bold text-sv-text-muted uppercase tracking-widest">Queue empty</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sv-border">
                    {filteredTickets.map((ticket) => {
                      const sla = getSLATimeLeft(ticket.firstResponseDeadline);
                      const priority = PRIORITY_CONFIG[ticket.priority];
                      const status  = STATUS_CONFIG[ticket.status];

                      return (
                        <motion.button
                          key={ticket._id}
                          layout
                          onClick={() => setSelectedTicket(ticket)}
                          className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-sv-surface-muted transition-all text-left group"
                        >
                          {/* Priority dot */}
                          <FaCircle size={8} className={priority.dot} />

                          {/* Ticket info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                              <span className="text-[10px] font-bold text-sv-text-muted uppercase tracking-widest shrink-0">
                                {ticket.ticketRef}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-widest ${priority.color}`}>
                                {priority.label}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-widest ${status.color}`}>
                                {status.label}
                              </span>
                              {ticket.slaBreached && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-widest bg-sv-danger-soft text-sv-danger border-sv-danger/30 flex items-center gap-1">
                                  <FaExclamationTriangle size={7} /> SLA Breached
                                </span>
                              )}
                            </div>
                            <p className="font-black text-sv-text-primary text-sm truncate">{ticket.subject}</p>
                            <p className="text-xs text-sv-text-muted font-medium truncate">{ticket.customerEmail}</p>
                          </div>

                          {/* SLA timer */}
                          <div className={`text-right shrink-0 hidden md:block ${sla.isBreached ? 'text-sv-danger' : sla.isWarning ? 'text-sv-warning' : 'text-sv-text-muted'}`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5">
                              {sla.isBreached ? 'Breached' : 'SLA Left'}
                            </p>
                            <p className="font-black text-sm">{sla.label}</p>
                          </div>

                          {/* Queue */}
                          <div className="text-right shrink-0 hidden lg:block">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-sv-text-muted mb-0.5">Queue</p>
                            <p className="text-xs font-bold text-sv-text-secondary capitalize">{ticket.queueId}</p>
                          </div>

                          <FaChevronRight size={10} className="text-sv-text-muted group-hover:text-sv-primary transition-colors shrink-0" />
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
