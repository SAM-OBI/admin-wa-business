import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeadset, FaTicketAlt, FaUsers, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaFilter, FaInbox,
  FaFire, FaChevronRight, FaBell, FaCircle, FaLock, FaSyncAlt, FaTrash
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import AgentManagement from '../components/helpdesk/AgentManagement';
import QueueRulesEditor from '../components/helpdesk/QueueRulesEditor';
import { useSyncManager } from '../hooks/useSyncManager';
import { BusinessMetrics } from '../components/providers/FeatureFlagProvider';

// --- Mock i18n ---
const t = (key: string) => key; // In production this would be useTranslation().t

// --- View Models ---
export type UIState = 'LOADING' | 'READY' | 'ERROR' | 'OFFLINE';

export interface ClassificationViewModel {
  intent: string;
  confidence: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  riskScore: number;
  suggestedWorkflow: string;
}

export interface ConversationViewModel {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  status: 'OPEN' | 'REPLY_PENDING' | 'WORKFLOW_RUNNING' | 'ESCALATED' | 'CLOSED';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  classification: ClassificationViewModel;
  timeline: TimelineEventViewModel[];
  slaWarning: boolean;
  slaBreached: boolean;
  slaRemainingText: string;
  queueId: string;
}

export interface TimelineEventViewModel {
  id: string;
  type: 'MESSAGE' | 'INTERNAL_NOTE' | 'SYSTEM_EVENT';
  sender: 'CUSTOMER' | 'AGENT' | 'AUTOMATION';
  content: string;
  timestamp: string;
  isPrivate: boolean;
}

interface SupportStatsViewModel {
  openConversations: number;
  inProgress: number;
  slaBreached: number;
  resolvedToday: number;
  avgFirstResponseText: string;
  avgResolutionText: string;
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent',  color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',    dot: 'bg-sv-danger'    },
  HIGH:   { label: 'High',    color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30', dot: 'bg-sv-warning' },
  NORMAL: { label: 'Normal',  color: 'bg-sv-info-soft text-sv-info border-sv-info/30', dot: 'bg-sv-info'   },
  LOW:    { label: 'Low',     color: 'bg-sv-surface-muted text-sv-text-secondary border-sv-border', dot: 'bg-sv-text-muted' },
};

const STATUS_CONFIG = {
  OPEN:             { label: 'Open',          color: 'bg-sv-primary/10 text-sv-primary border-sv-primary/20' },
  REPLY_PENDING:    { label: 'Reply Pending', color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30' },
  WORKFLOW_RUNNING: { label: 'Workflow',      color: 'bg-sv-info-soft text-sv-info border-sv-info/30'   },
  ESCALATED:        { label: 'Escalated',     color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'       },
  CLOSED:           { label: 'Closed',        color: 'bg-sv-surface-muted text-sv-text-secondary border-sv-border' },
};

// --- Main Workspace ---
export default function SupportWorkspace() {
  const [activeTab, setActiveTab] = useState<'queue' | 'agents' | 'rules'>('queue');
  const [conversations, setConversations] = useState<ConversationViewModel[]>([]);
  const [stats, setStats] = useState<SupportStatsViewModel | null>(null);
  const [selectedConvo, setSelectedConvo] = useState<ConversationViewModel | null>(null);

  // Collaboration State
  const [activeLease, setActiveLease] = useState<{ agentName: string; expiresAt: number } | null>(null);
  const [isTyping, setIsTyping] = useState<{ agentName: string } | null>(null);
  const currentUser = 'Agent Smith'; // Mock current user
  const isSupervisor = true; // Mock supervisor capability

  // Filters
  const [filterStatus] = useState<string>('ALL');
  const [filterPriority] = useState<string>('ALL');
  
  const [showSyncQueue, setShowSyncQueue] = useState(false);
  
  // Offline Sync Manager
  const { syncState, queue, enqueue, removeQueueItem } = useSyncManager();

  // Load Data
  const fetchData = useCallback(async () => {
    try {
      // Mocking ViewModel projection from Application API
      const mockStats: SupportStatsViewModel = {
        openConversations: 42,
        inProgress: 12,
        slaBreached: 3,
        resolvedToday: 156,
        avgFirstResponseText: '14m',
        avgResolutionText: '2.5h'
      };

      const mockConvo: ConversationViewModel = {
        id: 'convo-999',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah@example.com',
        subject: 'Where is my refund for order #8843?',
        status: 'OPEN',
        priority: 'HIGH',
        queueId: 'Finance',
        slaWarning: true,
        slaBreached: false,
        slaRemainingText: '45m',
        classification: {
          intent: 'RefundRequest',
          confidence: 0.94,
          sentiment: 'NEGATIVE',
          riskScore: 78,
          suggestedWorkflow: 'IssueStandardRefund'
        },
        timeline: [
          { id: '1', type: 'SYSTEM_EVENT', sender: 'AUTOMATION', content: 'Conversation Started via WebForm', timestamp: new Date(Date.now() - 3600000).toISOString(), isPrivate: false },
          { id: '2', type: 'MESSAGE', sender: 'CUSTOMER', content: 'I returned this 3 days ago and still no refund.', timestamp: new Date(Date.now() - 3500000).toISOString(), isPrivate: false },
          { id: '3', type: 'SYSTEM_EVENT', sender: 'AUTOMATION', content: 'Classification: RefundRequest (94% conf). Escalate to Finance.', timestamp: new Date(Date.now() - 3499000).toISOString(), isPrivate: false },
          { id: '4', type: 'INTERNAL_NOTE', sender: 'AGENT', content: 'Waiting on vendor approval before issuing refund.', timestamp: new Date(Date.now() - 1000000).toISOString(), isPrivate: true }
        ]
      };

      setTimeout(() => {
        setStats(mockStats);
        setConversations([mockConvo]);
      }, 500);
    } catch {
      // error handling
    }
  }, []);

  useEffect(() => {
    fetchData();

    // SSE Live Updates Subscription
    const evtSource = new EventSource('/api/cop/conversations/stream');
    evtSource.onmessage = (event) => {
      const updatedConvo: ConversationViewModel = JSON.parse(event.data);
      // Optimistic update of queue
      setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c));
    };

    return () => evtSource.close();
  }, [fetchData]);

  // Handle Lease Lifecycle
  useEffect(() => {
    let heartbeat: ReturnType<typeof setTimeout>;
    
    if (selectedConvo) {
      // Mock Acquire Lease
      setTimeout(() => {
        setActiveLease(prev => {
          if (!prev || prev.agentName === currentUser || prev.expiresAt < Date.now()) {
            return { agentName: currentUser, expiresAt: Date.now() + 30000 };
          }
          return prev;
        });
      }, 0);
        
        // Heartbeat to renew lease every 15s
        heartbeat = setInterval(() => {
          setActiveLease(prev => prev?.agentName === currentUser ? { ...prev, expiresAt: Date.now() + 30000 } : prev);
        }, 15000);
    } else {
      setTimeout(() => setActiveLease(null), 0);
    }

    return () => clearInterval(heartbeat);
  }, [selectedConvo]);

  const forceTakeover = () => {
    toast.success('Lease forcefully taken over.');
    setActiveLease({ agentName: currentUser, expiresAt: Date.now() + 30000 });
  };

  const handleSendReply = (isPrivate = false) => {
    if (!selectedConvo) return;
    
    BusinessMetrics.markStart('SupportReply');
    
    enqueue(
      `/api/cop/conversations/${selectedConvo.id}/reply`,
      'POST',
      { content: 'Mocked reply content', isPrivate },
      'DOMAIN_HANDLER' // Dynamically resolved by the conversation domain
    );
    
    BusinessMetrics.markEnd('SupportReply');
    toast.success(isPrivate ? t('Support.NoteAdded') : t('Support.ReplySent'));
  };

  const filteredConversations = conversations.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    return true;
  });

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
                Support Workspace
              </h1>
              <p 
                className="text-xs font-bold text-sv-text-muted uppercase tracking-widest flex items-center gap-2 mt-1 cursor-pointer hover:text-sv-text-primary transition-colors"
                onClick={() => setShowSyncQueue(!showSyncQueue)}
              >
                Customer Operations Platform 
                <span className={`w-2 h-2 rounded-full ${
                  syncState === 'SYNCED' ? 'bg-sv-success' : 
                  syncState === 'SYNCING' ? 'bg-sv-primary animate-pulse' : 
                  syncState === 'OFFLINE' ? 'bg-sv-text-muted' : 'bg-sv-danger'
                }`} />
                {syncState} {queue.length > 0 && `(${queue.length} PENDING)`}
              </p>
              
              <AnimatePresence>
                {showSyncQueue && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-20 left-4 sm:left-6 w-full max-w-sm bg-sv-surface rounded-2xl shadow-2xl border border-sv-border z-50 p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-sm flex items-center gap-2 text-sv-text-primary"><FaSyncAlt /> Offline Sync Queue</h3>
                      <span className="text-[10px] font-bold bg-sv-surface-muted px-2 py-0.5 rounded-full text-sv-text-primary border border-sv-border">{queue.length} Items</span>
                    </div>
                    
                    {queue.length === 0 ? (
                      <p className="text-xs text-sv-text-muted text-center py-4">No pending operations.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                        {queue.map((item, idx) => (
                          <div key={item.id} className="bg-sv-surface-muted p-3 rounded-xl border border-sv-border flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black uppercase text-sv-primary mb-1">
                                #{idx + 1} {item.method} {new URL('http://mock' + item.url).pathname.split('/').pop()}
                              </p>
                              <p className="text-xs text-sv-text-secondary truncate max-w-[200px]">{JSON.stringify(item.payload)}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[9px] font-bold bg-sv-surface border border-sv-border px-1.5 py-0.5 rounded text-sv-text-primary">Policy: {item.conflictPolicy}</span>
                                {item.retryCount > 0 && <span className="text-[9px] font-bold bg-sv-danger-soft text-sv-danger border border-sv-danger/30 px-1.5 py-0.5 rounded">Retries: {item.retryCount}</span>}
                              </div>
                            </div>
                            <button onClick={() => removeQueueItem(item.id)} className="text-sv-text-muted hover:text-sv-danger transition-colors p-1">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div 
            className="flex gap-1 p-1 bg-sv-surface-muted rounded-xl border border-sv-border self-start md:self-auto overflow-x-auto"
            role="tablist"
            aria-label="Workspace Tabs"
          >
            {[{ id: 'queue', label: t('Tabs.Inbox'), icon: FaInbox }, { id: 'agents', label: t('Tabs.Team'), icon: FaUsers }, { id: 'rules', label: t('Tabs.Workflows'), icon: FaFilter }].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`tabpanel-${id}`}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-sv-primary ${activeTab === id ? 'bg-sv-surface text-sv-primary shadow-xs' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
              >
                <Icon size={12} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Analytics Bar */}
        {stats && activeTab === 'queue' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Open', val: stats.openConversations, icon: FaTicketAlt, color: 'text-sv-primary' },
              { label: 'In Progress', val: stats.inProgress, icon: FaClock, color: 'text-sv-info' },
              { label: 'SLA Breached', val: stats.slaBreached, icon: FaExclamationTriangle, color: 'text-sv-danger' },
              { label: 'Resolved', val: stats.resolvedToday, icon: FaCheckCircle, color: 'text-sv-success' },
              { label: 'Avg 1st Reply', val: stats.avgFirstResponseText, icon: FaBell, color: 'text-sv-warning' },
              { label: 'Avg Resolution', val: stats.avgResolutionText, icon: FaFire, color: 'text-sv-tag' }
            ].map((s, i) => (
              <div key={i} className="bg-sv-surface rounded-2xl border border-sv-border p-4 flex items-center gap-3 shadow-xs">
                <s.icon size={18} className={s.color} />
                <div>
                  <p className="text-[10px] font-bold text-sv-text-muted uppercase tracking-wider leading-none mb-1">{s.label}</p>
                  <p className="text-lg font-black text-sv-text-primary">{s.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'queue' && !selectedConvo && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-xs">
                <div className="divide-y divide-sv-border" role="list" aria-label="Conversation Queue">
                  {filteredConversations.map(c => {
                    const priority = PRIORITY_CONFIG[c.priority];
                    const status = STATUS_CONFIG[c.status];
                    return (
                      <button 
                        key={c.id} 
                        onClick={() => setSelectedConvo(c)} 
                        className="w-full p-4 flex items-center gap-4 hover:bg-sv-surface-muted transition-all text-left focus:outline-none focus:bg-sv-surface-muted"
                        role="listitem"
                        aria-label={`Open conversation: ${c.subject}`}
                      >
                        <FaCircle size={8} className={priority.dot} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase ${priority.color}`}>{priority.label}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase ${status.color}`}>{status.label}</span>
                            {c.slaWarning && !c.slaBreached && <span className="text-[9px] font-black text-sv-warning uppercase">SLA Warning: {c.slaRemainingText}</span>}
                            {c.slaBreached && <span className="text-[9px] font-black text-sv-danger uppercase flex items-center gap-1"><FaExclamationTriangle size={8} /> SLA Breached</span>}
                          </div>
                          <p className="font-black text-sv-text-primary text-sm truncate">{c.subject}</p>
                          <p className="text-xs text-sv-text-muted font-medium truncate">{c.customerName} • {c.customerEmail}</p>
                        </div>
                        <div className="text-right shrink-0 hidden lg:block">
                          <p className="text-[9px] font-black uppercase text-sv-text-muted mb-0.5">Queue</p>
                          <p className="text-xs font-black text-sv-text-secondary">{c.queueId}</p>
                        </div>
                        <FaChevronRight size={10} className="text-sv-text-muted shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {selectedConvo && (
            <motion.div key="convo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline (Left 2/3) */}
              <div className="lg:col-span-2 bg-sv-surface rounded-2xl border border-sv-border overflow-hidden flex flex-col h-[700px] shadow-xs">
                <div className="p-4 border-b border-sv-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-sv-surface-muted/60">
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-sv-text-primary">{selectedConvo.subject}</h2>
                    <p className="text-xs text-sv-text-muted">{selectedConvo.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {activeLease && activeLease.agentName !== currentUser && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-sv-warning bg-sv-warning-soft px-2 py-1 rounded-full border border-sv-warning/20">
                          <FaLock className="inline mr-1" /> {activeLease.agentName} is reviewing
                        </span>
                        {isSupervisor && (
                          <button onClick={forceTakeover} className="text-[10px] font-bold bg-sv-danger-soft text-sv-danger px-2.5 py-1 rounded-full hover:opacity-80 border border-sv-danger/20">
                            Force Takeover
                          </button>
                        )}
                      </div>
                    )}
                    <button onClick={() => setSelectedConvo(null)} className="text-xs font-bold bg-sv-surface-muted border border-sv-border text-sv-text-primary px-3 py-1.5 rounded-xl hover:bg-sv-surface transition-colors">
                      Back to Inbox
                    </button>
                  </div>
                </div>
                
                <div 
                  className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-sv-surface-muted/30"
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation Timeline"
                >
                  {selectedConvo.timeline.map(event => (
                    <div key={event.id} className={`flex flex-col ${event.sender === 'CUSTOMER' ? 'items-start' : event.sender === 'AGENT' ? 'items-end' : 'items-center'}`}>
                      {event.type === 'SYSTEM_EVENT' ? (
                        <div className="px-4 py-2 bg-sv-surface-muted border border-sv-border rounded-full text-[10px] font-black uppercase tracking-widest text-sv-text-muted">
                          🤖 {event.content}
                        </div>
                      ) : (
                        <div className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl ${
                          event.isPrivate ? 'bg-sv-warning-soft text-sv-warning border border-sv-warning/20' :
                          event.sender === 'CUSTOMER' ? 'bg-sv-surface border border-sv-border text-sv-text-primary shadow-xs' : 
                          'bg-sv-primary text-sv-text-inverse shadow-xs'
                        }`}>
                          {event.isPrivate && <p className="text-[9px] font-black uppercase flex items-center gap-1 mb-1 opacity-80"><FaLock /> Internal Note</p>}
                          <p className="text-sm font-medium leading-relaxed">{event.content}</p>
                          <span className="text-[9px] font-bold opacity-70 block mt-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-sv-surface border-t border-sv-border relative">
                  {isTyping && isTyping.agentName !== currentUser && (
                    <div className="absolute -top-6 left-4 text-[10px] font-black uppercase tracking-widest text-sv-primary flex items-center gap-1">
                      <span className="flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span></span>
                      {isTyping.agentName} is typing
                    </div>
                  )}
                  
                  <textarea 
                    className="w-full border border-sv-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary disabled:bg-sv-surface-muted disabled:text-sv-text-muted bg-sv-surface text-sv-text-primary placeholder:text-sv-text-muted"
                    rows={3} 
                    placeholder="Type a reply or internal note..." 
                    disabled={activeLease?.agentName !== currentUser}
                    onChange={(e) => {
                      if (e.target.value.length > 0) {
                        setIsTyping({ agentName: currentUser });
                      } else {
                        setIsTyping(null);
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <button 
                      onClick={() => handleSendReply(true)}
                      disabled={activeLease?.agentName !== currentUser}
                      className="text-xs font-bold text-sv-warning bg-sv-warning-soft px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-sv-warning-soft/80 border border-sv-warning/20 transition-colors disabled:opacity-50"
                    >
                      <FaLock /> Add Internal Note
                    </button>
                    <button 
                      onClick={() => handleSendReply(false)}
                      disabled={activeLease?.agentName !== currentUser}
                      className="text-xs font-bold text-sv-text-inverse bg-sv-primary px-6 py-2 rounded-xl hover:bg-sv-primary-hover transition-colors disabled:opacity-50 shadow-xs"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Context (Right 1/3) */}
              <div className="space-y-6">
                <div className="bg-sv-surface rounded-2xl border border-sv-border p-5 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-widest text-sv-text-muted mb-4">AI Classification</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase">Intent</p>
                      <p className="font-black text-sm text-sv-text-primary">{selectedConvo.classification.intent} <span className="text-sv-success text-xs">{(selectedConvo.classification.confidence * 100).toFixed(0)}%</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase">Sentiment</p>
                      <p className={`font-black text-sm ${selectedConvo.classification.sentiment === 'NEGATIVE' ? 'text-sv-danger' : 'text-sv-text-primary'}`}>
                        {selectedConvo.classification.sentiment}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-sv-text-muted uppercase">Risk Score</p>
                      <div className="w-full bg-sv-surface-muted rounded-full h-2 mt-1 overflow-hidden border border-sv-border">
                        <div className="bg-sv-danger h-2 rounded-full" style={{ width: `${selectedConvo.classification.riskScore}%` }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-sv-primary/10 border border-sv-primary/20 rounded-xl">
                      <p className="text-[9px] font-black uppercase text-sv-primary mb-1">Suggested Action</p>
                      <button className="text-sm font-bold text-sv-primary hover:underline text-left">{selectedConvo.classification.suggestedWorkflow}</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'agents' && <AgentManagement onRefresh={fetchData} />}
          {activeTab === 'rules' && <QueueRulesEditor />}
        </AnimatePresence>
      </div>
    </div>
  );
}
