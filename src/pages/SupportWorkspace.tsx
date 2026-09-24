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
  LOW:    { label: 'Low',     color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  OPEN:             { label: 'Open',          color: 'bg-primary/10 text-primary border-primary/20' },
  REPLY_PENDING:    { label: 'Reply Pending', color: 'bg-sv-warning-soft text-sv-warning border-sv-warning/30' },
  WORKFLOW_RUNNING: { label: 'Workflow',      color: 'bg-sv-info-soft text-sv-info border-sv-info/30'   },
  ESCALATED:        { label: 'Escalated',     color: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'       },
  CLOSED:           { label: 'Closed',        color: 'bg-slate-100 text-slate-600 border-slate-200' },
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
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-white/10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-[5px] flex items-center justify-center">
              <FaHeadset size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Support Workspace
              </h1>
              <p 
                className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1 cursor-pointer hover:text-slate-200"
                onClick={() => setShowSyncQueue(!showSyncQueue)}
              >
                Customer Operations Platform 
                <span className={`w-2 h-2 rounded-full ${
                  syncState === 'SYNCED' ? 'bg-green-500' : 
                  syncState === 'SYNCING' ? 'bg-blue-500 animate-pulse' : 
                  syncState === 'OFFLINE' ? 'bg-slate-400' : 'bg-red-500'
                }`} />
                {syncState} {queue.length > 0 && `(${queue.length} PENDING)`}
              </p>
              
              <AnimatePresence>
                {showSyncQueue && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-20 left-6 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 z-50 p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-sm flex items-center gap-2"><FaSyncAlt /> Offline Sync Queue</h3>
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">{queue.length} Items</span>
                    </div>
                    
                    {queue.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No pending operations.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {queue.map((item, idx) => (
                          <div key={item.id} className="bg-slate-50 dark:bg-black/20 p-3 rounded border border-slate-100 flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black uppercase text-primary mb-1">
                                #{idx + 1} {item.method} {new URL('http://mock' + item.url).pathname.split('/').pop()}
                              </p>
                              <p className="text-xs text-slate-600 truncate max-w-[200px]">{JSON.stringify(item.payload)}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[9px] font-bold bg-white border px-1 rounded">Policy: {item.conflictPolicy}</span>
                                {item.retryCount > 0 && <span className="text-[9px] font-bold bg-sv-danger-soft text-sv-danger border border-sv-danger/30 px-1 rounded">Retries: {item.retryCount}</span>}
                              </div>
                            </div>
                            <button onClick={() => removeQueueItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
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
            className="flex gap-1 p-1 bg-slate-100 dark:bg-black/30 rounded-[5px] border border-slate-200 dark:border-white/10"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-primary ${activeTab === id ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={12} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Bar */}
        {stats && activeTab === 'queue' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Open', val: stats.openConversations, icon: FaTicketAlt, color: 'text-primary' },
              { label: 'In Progress', val: stats.inProgress, icon: FaClock, color: 'text-blue-600' },
              { label: 'SLA Breached', val: stats.slaBreached, icon: FaExclamationTriangle, color: 'text-red-600' },
              { label: 'Resolved', val: stats.resolvedToday, icon: FaCheckCircle, color: 'text-green-600' },
              { label: 'Avg 1st Reply', val: stats.avgFirstResponseText, icon: FaBell, color: 'text-amber-600' },
              { label: 'Avg Resolution', val: stats.avgResolutionText, icon: FaFire, color: 'text-purple-600' }
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3">
                <s.icon size={18} className={s.color} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{s.label}</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{s.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'queue' && !selectedConvo && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-white/5" role="list" aria-label="Conversation Queue">
                  {filteredConversations.map(c => {
                    const priority = PRIORITY_CONFIG[c.priority];
                    const status = STATUS_CONFIG[c.status];
                    return (
                      <button 
                        key={c.id} 
                        onClick={() => setSelectedConvo(c)} 
                        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-left focus:outline-none focus:bg-slate-50"
                        role="listitem"
                        aria-label={`Open conversation: ${c.subject}`}
                      >
                        <FaCircle size={8} className={priority.dot} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-[3px] border uppercase ${priority.color}`}>{priority.label}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-[3px] border uppercase ${status.color}`}>{status.label}</span>
                            {c.slaWarning && !c.slaBreached && <span className="text-[9px] font-black text-amber-600 uppercase">SLA Warning: {c.slaRemainingText}</span>}
                            {c.slaBreached && <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1"><FaExclamationTriangle size={8} /> SLA Breached</span>}
                          </div>
                          <p className="font-black text-slate-900 dark:text-white text-sm truncate">{c.subject}</p>
                          <p className="text-xs text-slate-400 font-medium">{c.customerName} • {c.customerEmail}</p>
                        </div>
                        <div className="text-right shrink-0 hidden lg:block">
                          <p className="text-[9px] font-black uppercase text-slate-300 mb-0.5">Queue</p>
                          <p className="text-xs font-black text-slate-600 dark:text-gray-300">{c.queueId}</p>
                        </div>
                        <FaChevronRight size={10} className="text-slate-300" />
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
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-[700px]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <div>
                    <h2 className="font-black text-lg">{selectedConvo.subject}</h2>
                    <p className="text-xs text-slate-500">{selectedConvo.customerName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeLease && activeLease.agentName !== currentUser && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded">
                          <FaLock className="inline mr-1" /> {activeLease.agentName} is reviewing
                        </span>
                        {isSupervisor && (
                          <button onClick={forceTakeover} className="text-[10px] font-bold bg-sv-danger-soft text-sv-danger px-2 py-1 rounded hover:opacity-80">
                            Force Takeover
                          </button>
                        )}
                      </div>
                    )}
                    <button onClick={() => setSelectedConvo(null)} className="text-xs font-bold bg-slate-200 px-3 py-1 rounded-[5px] hover:bg-slate-300">
                      Back to Inbox
                    </button>
                  </div>
                </div>
                
                <div 
                  className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-black/20"
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation Timeline"
                >
                  {selectedConvo.timeline.map(event => (
                    <div key={event.id} className={`flex flex-col ${event.sender === 'CUSTOMER' ? 'items-start' : event.sender === 'AGENT' ? 'items-end' : 'items-center'}`}>
                      {event.type === 'SYSTEM_EVENT' ? (
                        <div className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                          🤖 {event.content}
                        </div>
                      ) : (
                        <div className={`max-w-[80%] p-4 rounded-lg ${
                          event.isPrivate ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                          event.sender === 'CUSTOMER' ? 'bg-white border text-slate-800' : 
                          'bg-primary text-slate-900'
                        }`}>
                          {event.isPrivate && <p className="text-[9px] font-black uppercase flex items-center gap-1 mb-1 opacity-70"><FaLock /> Internal Note</p>}
                          <p className="text-sm font-medium">{event.content}</p>
                          <span className="text-[9px] font-bold opacity-60 block mt-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t relative">
                  {isTyping && isTyping.agentName !== currentUser && (
                    <div className="absolute -top-6 left-4 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <span className="flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span></span>
                      {isTyping.agentName} is typing
                    </div>
                  )}
                  
                  <textarea 
                    className="w-full border border-sv-border rounded-[5px] p-3 text-sm focus:outline-none focus:border-primary disabled:bg-sv-surface-muted disabled:text-sv-text-muted"
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
                  <div className="flex justify-between mt-3">
                    <button 
                      onClick={() => handleSendReply(true)}
                      disabled={activeLease?.agentName !== currentUser}
                      className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-[5px] flex items-center gap-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      <FaLock /> Add Internal Note
                    </button>
                    <button 
                      onClick={() => handleSendReply(false)}
                      disabled={activeLease?.agentName !== currentUser}
                      className="text-xs font-bold text-slate-900 bg-primary px-6 py-2 rounded-[5px] hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Context (Right 1/3) */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[5px] border border-slate-200 p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">AI Classification</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Intent</p>
                      <p className="font-black text-sm">{selectedConvo.classification.intent} <span className="text-green-500 text-xs">{(selectedConvo.classification.confidence * 100).toFixed(0)}%</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sentiment</p>
                      <p className={`font-black text-sm ${selectedConvo.classification.sentiment === 'NEGATIVE' ? 'text-red-500' : 'text-slate-900'}`}>
                        {selectedConvo.classification.sentiment}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Risk Score</p>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${selectedConvo.classification.riskScore}%` }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-[5px]">
                      <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Suggested Action</p>
                      <button className="text-sm font-bold text-blue-800 hover:underline">{selectedConvo.classification.suggestedWorkflow}</button>
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
