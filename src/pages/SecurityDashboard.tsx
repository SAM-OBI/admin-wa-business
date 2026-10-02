import { useEffect, useState } from 'react';
import { adminService } from '../api/admin.service';
import { 
  FiShield, FiLock, FiActivity, FiCheckCircle
} from 'react-icons/fi';
import FraudInvestigationPanel from '../components/FraudInvestigationPanel';
import ForensicAuditPanel from '../components/ForensicAuditPanel';
import AutonomousAIControl from '../components/AutonomousAIControl';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';

// 🛡️ [ADMIN-STAFF-SCOPING-1] Mirrors adminSections.constants.ts's
// ADMIN_SECTIONS exactly — 'Overview' is deliberately excluded there too
// (never scopable, every admin always sees the Dashboard landing page).
const ADMIN_SECTIONS = ['Commerce', 'Trust & Safety', 'Engagement', 'Support', 'Marketing & Ads', 'Finance', 'System'];

interface SecurityAlert {
  _id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  metadata: any;
  resolved: boolean;
  createdAt: string;
}

interface SecurityStats {
  kpis: {
    failedLogins24h: number;
    accountLockouts24h: number;
    piiAnomalies24h: number;
    activeLegalHolds: number;
  };
  recentAlerts: SecurityAlert[];
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
  const [fraudIncidents, setFraudIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'fraud' | 'forensics' | 'intelligence' | 'audit' | 'decisions' | 'invites'>('alerts');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [governanceData, setGovernanceData] = useState<{ decisions: any[], invites: any[] }>({ decisions: [], invites: [] });
  const [govMode, setGovMode] = useState<'NORMAL' | 'ELEVATED_THREAT' | 'LOCKDOWN_FINANCE' | 'LOCKDOWN_ADMIN' | 'FULL_CONTAINMENT' | 'RECOVERY'>('NORMAL');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, metricsRes, fraudRes] = await Promise.all([
        adminService.getSecurityStats(),
        adminService.getSecurityMetrics(),
        adminService.getFraudIncidents({ resolved: false })
      ]);
      
      const metricsData = metricsRes?.version ? metricsRes.data : metricsRes?.data;
      
      if (statsRes?.data) setStats(statsRes.data);
      if (fraudRes?.data?.incidents) setFraudIncidents(fraudRes.data.incidents);
      if (metricsData) {
        setMetrics(metricsData);
        setLastSync(new Date());

        const modeRes = await adminService.getGovernanceMode();
        if (modeRes.data?.mode) setGovMode(modeRes.data.mode);
        
        if (metricsData.rbac?.mismatches > 15) {
          setCriticalAlert(`⚠️ High RBAC Mismatch Rate: ${metricsData.rbac.mismatches}/min`);
        } else {
          setCriticalAlert(null);
        }
      }
      
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const res = await adminService.getSecurityAuditTrail();
      if (res.data?.logs) setAuditLogs(res.data.logs);
    } catch (error) {
      console.error('Audit trail fetch failed:', error);
      showError('Could not load the institutional audit trail. It may be incomplete or stale.');
    }
  };

  const fetchGovernanceData = async () => {
    try {
      const [decisionsRes, invitesRes] = await Promise.all([
        adminService.getAuthzDecisions(),
        adminService.getAdminInvites()
      ]);
      setGovernanceData({
        decisions: decisionsRes.data?.decisions || [],
        invites: invitesRes.data?.invites || []
      });
    } catch (error) {
      console.error('Governance data fetch failed:', error);
      showError('Could not load the governance ledger or admin invites. The list shown may be incomplete or stale.');
    }
  };

  const handleIssueInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = document.getElementById('inviteEmail') as HTMLInputElement;
    const capabilitySelect = document.getElementById('inviteCapability') as HTMLSelectElement;
    // 🛡️ [ADMIN-STAFF-SCOPING-1] Unchecked = allowedSections stays empty =
    // unrestricted (matches the backend's fail-open default). Checking one
    // or more scopes this invite to exactly those sections.
    const allowedSections = ADMIN_SECTIONS.filter((section) =>
      (document.getElementById(`inviteSection-${section}`) as HTMLInputElement)?.checked
    );

    if (!emailInput?.value) return;

    try {
      showLoading('Generating sovereign token...');
      const capabilities = {
          canInviteAdmins: capabilitySelect.value === 'FULL' || capabilitySelect.value === 'SECURITY',
          canManageSecurity: capabilitySelect.value === 'FULL' || capabilitySelect.value === 'SECURITY',
          canManageFinance: capabilitySelect.value === 'FULL' || capabilitySelect.value === 'FINANCE',
          allowedSections
      };

      const res = await adminService.issueAdminInvite({ email: emailInput.value, capabilities });
      if (res.data?.token) {
        setGeneratedToken(res.data.token);
        showSuccess('Invitation Token Dispatched', 'Recipient will require this token to establish identity.');
      }
      fetchGovernanceData();
      emailInput.value = '';
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to issue invitation.');
    } finally {
      closeLoading();
    }
  };

  // 🛡️ [ADMIN-STAFF-SCOPING-1] Re-scope an already-redeemed admin. Uses the
  // invite record's own redeemedBy (already present in governanceData.invites
  // — no separate admin-user-list endpoint exists, and this avoids building
  // one just for this).
  const handleEditSections = async (invite: any) => {
    const current: string[] = invite.assignedCapabilities?.allowedSections || [];
    const checkboxesHtml = ADMIN_SECTIONS.map((section) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;text-align:left;">
        <input type="checkbox" id="editSection-${section}" ${current.includes(section) ? 'checked' : ''} />
        ${section}
      </label>
    `).join('');

    const { isConfirmed } = await (window as any).Swal.fire({
      title: `Re-scope ${invite.email}`,
      html: `
        <p style="font-size:12px;color:#64748b;margin-bottom:8px;">Leave all unchecked for unrestricted access.</p>
        <div style="text-align:left;">${checkboxesHtml}</div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save',
    });

    if (!isConfirmed) return;

    const allowedSections = ADMIN_SECTIONS.filter((section) =>
      (document.getElementById(`editSection-${section}`) as HTMLInputElement)?.checked
    );

    try {
      showLoading('Updating section scoping...');
      await adminService.updateAdminSections(invite.redeemedBy, allowedSections);
      showSuccess('Section scoping updated', `${invite.email} is now ${allowedSections.length === 0 ? 'unrestricted' : `scoped to: ${allowedSections.join(', ')}`}.`);
      fetchGovernanceData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update section scoping.');
    } finally {
      closeLoading();
    }
  };

  const handleRevokeInvite = async (invite: any) => {
    const confirmed = window.confirm(`Revoke the pending invitation for ${invite.email}? This cannot be undone.`);
    if (!confirmed) return;
    if (revokingInviteId) return;
    setRevokingInviteId(invite._id);
    try {
      await adminService.revokeAdminInvite(invite._id);
      showSuccess('Invitation revoked', `${invite.email} can no longer use this invite to establish identity.`);
      fetchGovernanceData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to revoke invitation.');
    } finally {
      setRevokingInviteId(null);
    }
  };

  const transitionGovernance = async (newMode: typeof govMode) => {
    // 🛡️ [FIX] FULL_CONTAINMENT/RECOVERY require quorumApproval.length >= 2
    // on the backend (securityAlerts.service.ts) — but that check only
    // counts array entries, it never verifies they're real, distinct,
    // independently-authenticated admin identities. This UI was sending a
    // hardcoded ['admin_current', 'admin_secondary_verified'] literal on
    // every transition, so a single admin session could trigger platform-
    // wide containment/recovery while the UI implied genuine dual-admin
    // sign-off had occurred. No real second-admin approval flow exists yet
    // (no pending-request/approve mechanism for governance mode, unlike the
    // real one that exists for MultiSigRequest) — until one is built, block
    // this here rather than fabricate the quorum and pretend it's real.
    if (newMode === 'FULL_CONTAINMENT' || newMode === 'RECOVERY') {
      showError('Dual-admin quorum approval for this transition is not yet implemented on the backend. This mode change is blocked until a real second-admin approval flow exists.', 'Quorum Enforcement Unavailable');
      return;
    }

    const { isConfirmed } = await (window as any).Swal.fire({
      title: 'Institutional Governance Step-Up',
      text: `Are you sure you want to transition to ${newMode}? This will affect platform availability and trust boundaries.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm with MFA',
      confirmButtonColor: '#0f172a'
    });

    if (isConfirmed) {
      const { value: reason } = await (window as any).Swal.fire({
        title: 'Governance Justification',
        input: 'text',
        inputLabel: 'Reason for transition',
        inputPlaceholder: 'Enter security incident ID...',
        showCancelButton: true,
        inputValidator: (value: string) => {
          if (!value) return 'Justification is mandatory.';
        }
      });

      if (reason) {
        showLoading(`Initiating ${newMode}...`);
        try {
          // FULL_CONTAINMENT/RECOVERY are blocked above before reaching
          // here, so quorumApproval is never sent for any mode this can
          // actually reach.
          await adminService.setGovernanceMode({ mode: newMode, reason });
          setGovMode(newMode);
          showSuccess(`Platform transitioned to ${newMode}`, 'Sovereign Governance Updated');
          fetchData();
        } catch (error: any) {
          showError(error.response?.data?.message || 'Transition failed. Quorum violation suspected.');
        } finally {
          closeLoading();
        }
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditTrail();
    if (activeTab === 'decisions' || activeTab === 'invites') fetchGovernanceData();
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    const baseInterval = 30000;
    const maxInterval = 300000;
    const backoff = Math.min(maxInterval, baseInterval * Math.pow(2, retryCount));
    const poller = setTimeout(fetchData, backoff);
    return () => clearTimeout(poller);
  }, [retryCount]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-sv-danger text-sv-text-inverse';
      case 'high': return 'bg-sv-warning text-sv-text-inverse';
      case 'medium': return 'bg-sv-warning text-sv-text-inverse';
      case 'low': return 'bg-sv-info text-sv-text-inverse';
      default: return 'bg-sv-surface-muted text-sv-text-secondary';
    }
  };

  const SkeletonCard = () => (
    <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border p-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );

  if (loading && !stats && !metrics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sv-text-primary">Security Operations Center</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never';
    const seconds = Math.floor((new Date().getTime() - lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const kpiCards = [
    { title: 'Failed Logins (24h)', value: stats?.kpis.failedLogins24h || 0, icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'RBAC Mismatches', value: metrics?.rbac.mismatches || 0, icon: FiLock, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Argon2 Migrated', value: metrics?.argon2.migrated || 0, icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Legal Holds Active', value: stats?.kpis.activeLegalHolds || 0, icon: FiShield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];


  return (
    <div className="space-y-6">
      {criticalAlert && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <FiShield className="text-red-600 text-xl" />
            <span className="text-red-800 font-semibold">{criticalAlert}</span>
          </div>
          <button onClick={() => setCriticalAlert(null)} className="text-red-600 hover:text-red-800 font-bold">×</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-sv-text-primary flex items-center gap-2">
            <FiShield className="text-primary" /> Security Operations Center
          </h1>
          <p className="text-gray-600 mt-1 text-sm flex items-center gap-2">
            Real-time monitoring & threat detection
            <span className="text-xs bg-sv-success-soft text-sv-success px-2 py-1 rounded-full font-medium">Last Sync: {getTimeSinceSync()}</span>
            {retryCount > 0 && <span className="text-xs bg-sv-warning-soft text-sv-warning px-2 py-1 rounded-full font-medium">Reconnecting... ({retryCount})</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2">
            <FiActivity /> Refresh Stream
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div key={card.title} className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border p-6 flex items-center gap-4">
            <div className={`${card.bg} p-3 rounded-xl ${card.color}`}><card.icon size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{card.title}</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><FiLock className="text-primary" /> Argon2 Migration Progress</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded ${metrics?.argon2.status === 'ACTIVE' ? 'bg-sv-success-soft text-sv-success' : 'bg-sv-surface-muted text-sv-text-secondary'}`}>{metrics?.argon2.status || 'IDLE'}</span>
        </div>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">{Math.round((metrics?.argon2.migrated / (metrics?.argon2.total || 1)) * 100)}% Complete</span></div>
            <div className="text-right"><span className="text-xs font-semibold inline-block text-primary">{metrics?.argon2.p95}ms Latency (p95)</span></div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
            <div style={{ width: `${(metrics?.argon2.migrated / (metrics?.argon2.total || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border overflow-hidden">
            <div className="p-6 border-b border-sv-border bg-sv-surface-muted flex justify-between items-center overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {['alerts', 'fraud', 'forensics', 'intelligence', 'decisions', 'invites', 'audit'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`font-bold transition-colors whitespace-nowrap ${activeTab === tab ? 'text-sv-primary border-b-2 border-sv-primary pb-1' : 'text-sv-text-muted'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('decisions', 'Governance Ledger').replace('invites', 'Admin Invites').replace('alerts', 'Threat Intelligence').replace('fraud', 'Fraud Incidents').replace('forensics', 'Forensic Integrity').replace('intelligence', 'Autonomous AI').replace('audit', 'Institutional Audit')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'alerts' ? (
                <table className="w-full">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr><th className="px-6 py-4 text-left">Level</th><th className="px-6 py-4 text-left">Event</th><th className="px-6 py-4 text-left">Entity</th><th className="px-6 py-4 text-left">Time</th></tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {stats?.recentAlerts.map((alert) => (
                      <tr key={alert._id} className="hover:bg-sv-surface-muted">
                        <td className="px-6 py-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>{alert.severity}</span></td>
                        <td className="px-6 py-4"><p className="text-sm font-bold text-sv-text-primary">{alert.type}</p><p className="text-xs text-sv-text-secondary">{alert.message}</p></td>
                        <td className="px-6 py-4 text-xs">{alert.userId ? <div><p className="font-bold">{alert.userId.name}</p><p className="text-sv-text-muted">{alert.userId.email}</p></div> : 'System'}</td>
                        <td className="px-6 py-4 text-xs">{new Date(alert.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'fraud' ? (
                <table className="w-full">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr><th className="px-6 py-4 text-left">Severity</th><th className="px-6 py-4 text-left">Incident</th><th className="px-6 py-4 text-left">Risk</th><th className="px-6 py-4 text-left">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {fraudIncidents.map((incident) => (
                      <tr key={incident._id} className="hover:bg-red-50/30">
                        <td className="px-6 py-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${getSeverityColor(incident.severity.toLowerCase())}`}>{incident.severity}</span></td>
                        <td className="px-6 py-4"><p className="text-sm font-bold">{incident.incidentType}</p></td>
                        <td className="px-6 py-4 text-sm font-black">{incident.riskScore}</td>
                        <td className="px-6 py-4"><button onClick={() => setSelectedIncident(incident)} className="bg-sv-primary text-sv-text-inverse text-[10px] px-3 py-1.5 rounded-lg hover:bg-sv-primary-hover">Investigate</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'forensics' ? (
                <ForensicAuditPanel />
              ) : activeTab === 'intelligence' ? (
                <div className="p-6"><AutonomousAIControl /></div>
              ) : activeTab === 'decisions' ? (
                <table className="w-full">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr><th className="px-6 py-4 text-left">Result</th><th className="px-6 py-4 text-left">Actor</th><th className="px-6 py-4 text-left">Action</th><th className="px-6 py-4 text-left">Time</th></tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {governanceData.decisions.map((decision: any, i: number) => (
                      <tr key={i} className="hover:bg-sv-surface-muted">
                        <td className="px-6 py-4"><span className={`text-[9px] font-black px-2 py-1 rounded ${decision.severity === 'critical' ? 'bg-red-600' : 'bg-green-500'} text-white`}>{decision.metadata?.details?.result}</span></td>
                        <td className="px-6 py-4 text-xs font-bold">{decision.metadata?.details?.actor}</td>
                        <td className="px-6 py-4 text-[10px]">{decision.metadata?.details?.action}</td>
                        <td className="px-6 py-4 text-[10px]">{new Date(decision.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'invites' ? (
                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="text-sm font-black uppercase mb-4">Provision New Administrator</h4>
                    {generatedToken ? (
                      <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400">One-Time Token Visibility</p>
                        <code className="block bg-black/30 p-3 rounded-lg text-xs break-all border border-white/10">{generatedToken}</code>
                        <button onClick={() => setGeneratedToken(null)} className="w-full py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase">I have secured the token</button>
                      </div>
                    ) : (
                      <form className="space-y-4" onSubmit={handleIssueInvite}>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1"><label className="text-[10px] font-bold text-sv-text-secondary uppercase">Email</label><input type="email" id="inviteEmail" className="w-full px-4 py-2 rounded-xl border border-sv-border outline-none text-sm focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary" /></div>
                          <div><label className="text-[10px] font-bold text-sv-text-secondary uppercase">Capabilities</label><select id="inviteCapability" className="px-4 py-2 rounded-xl border border-sv-border text-sm focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary"><option value="FULL">Full (CRITICAL)</option><option value="SECURITY">Security (HIGH)</option><option value="FINANCE">Finance (CRITICAL)</option></select></div>
                          <button className="bg-sv-primary text-sv-text-inverse px-6 py-2 rounded-xl font-bold hover:bg-sv-primary-hover">Issue</button>
                        </div>
                        {/* 🛡️ [ADMIN-STAFF-SCOPING-1] Leave every box unchecked for a
                            full, unrestricted admin (today's default for everyone) —
                            check one or more to scope this invite to only those
                            dashboard sections. */}
                        <div>
                          <label className="text-[10px] font-bold text-sv-text-secondary uppercase block mb-2">Dashboard Sections (leave all unchecked = unrestricted)</label>
                          <div className="flex flex-wrap gap-3">
                            {ADMIN_SECTIONS.map((section) => (
                              <label key={section} className="flex items-center gap-1.5 text-xs font-semibold text-sv-text-secondary cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-sv-border">
                                <input type="checkbox" id={`inviteSection-${section}`} className="w-3.5 h-3.5" />
                                {section}
                              </label>
                            ))}
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                  <table className="w-full">
                    <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                      <tr><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-left">Recipient</th><th className="px-6 py-4 text-left">Sections</th><th className="px-6 py-4 text-left">Expires</th><th className="px-6 py-4 text-left">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-sv-border">
                      {governanceData.invites.map((invite: any, i: number) => {
                        const sections: string[] = invite.assignedCapabilities?.allowedSections || [];
                        return (
                        <tr key={i} className="hover:bg-sv-surface-muted">
                          <td className="px-6 py-4"><span className={`text-[9px] font-black px-2 py-1 rounded ${invite.status === 'PENDING' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>{invite.status}</span></td>
                          <td className="px-6 py-4 text-xs font-bold">{invite.email}</td>
                          <td className="px-6 py-4 text-[10px] text-sv-text-secondary">{sections.length === 0 ? 'Unrestricted' : sections.join(', ')}</td>
                          <td className="px-6 py-4 text-xs">{new Date(invite.expiresAt).toLocaleString()}</td>
                          <td className="px-6 py-4 flex gap-3">
                            {invite.status === 'PENDING' && (
                              <button
                                onClick={() => handleRevokeInvite(invite)}
                                disabled={revokingInviteId === invite._id}
                                className="text-red-600 text-[10px] font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {revokingInviteId === invite._id ? 'Revoking...' : 'Revoke'}
                              </button>
                            )}
                            {invite.status === 'REDEEMED' && invite.redeemedBy && (
                              <button
                                onClick={() => handleEditSections(invite)}
                                className="text-sv-primary text-[10px] font-black uppercase"
                              >
                                Edit Sections
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr><th className="px-6 py-4 text-left">Severity</th><th className="px-6 py-4 text-left">Type</th><th className="px-6 py-4 text-left">Message</th><th className="px-6 py-4 text-left">Time</th></tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {auditLogs.map((log: any, i: number) => (
                      <tr key={i} className="hover:bg-sv-surface-muted">
                        <td className="px-6 py-4"><span className={`text-[9px] font-black px-2 py-1 rounded ${log.severity === 'CRITICAL' ? 'bg-sv-danger text-sv-text-inverse' : 'bg-sv-info text-sv-text-inverse'}`}>{log.severity}</span></td>
                        <td className="px-6 py-4 text-[10px] font-black">{log.eventType}</td>
                        <td className="px-6 py-4 text-xs">{log.message}</td>
                        <td className="px-6 py-4 text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-sv-surface rounded-2xl shadow-sm border border-sv-border p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiShield className="text-green-500" /> Compliance Status</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between"><span>NDPR Data Anonymizer</span><span className="text-green-600 font-bold">Active</span></div>
              <div className="flex justify-between"><span>Sovereign Telemetry</span><span className="text-green-600 font-bold">Synced</span></div>
              <div className="flex justify-between"><span>Legal Hold Registry</span><span className="text-green-600 font-bold">Synced</span></div>
              <div className="flex justify-between"><span>Encryption Layer</span><span className="text-green-600 font-bold">256-bit</span></div>
              {/* 🛡️ [FIX] Was a hardcoded "98/100" score with a hardcoded
                  98%-filled bar — no backend endpoint computes an aggregate
                  security score anywhere in this codebase. Removed rather
                  than inventing a fake number; a real score needs a defined
                  methodology (which signals, what weighting) before it can
                  be shown, which is a separate decision, not a display fix. */}
              <div className="pt-4 border-t"><p className="text-[10px] font-black uppercase text-gray-400 mb-2">Security Score</p><p className="text-xs text-gray-400 font-medium">Not computed — no scoring methodology defined yet</p></div>
            </div>
          </div>
          {/* 🛡️ [FIX] Was a fabricated "Chaos Engine runs daily... Last Test:
              PASS (14m ago)" card — this codebase does have a real chaos
              test suite (`npm run test:chaos`), but nothing wires its
              results to this dashboard; the card was inventing a result
              every admin would have read as a live, passing automated
              check. Replaced with an honest description of what actually
              exists today. */}
          <div className="bg-sv-surface rounded-2xl p-6 shadow-sm border border-sv-border">
            <h3 className="font-bold text-lg mb-2 text-gray-800">Automated Resilience</h3>
            <p className="text-xs text-gray-500 mb-4">A chaos test suite exists in the codebase but is not yet wired to run on a schedule or report its results here.</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"><FiActivity className="text-gray-400" /><div className="text-[10px] font-black uppercase text-gray-500">Not connected to live telemetry</div></div>
          </div>

          <div className={`rounded-2xl p-6 border transition-all ${govMode !== 'NORMAL' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className={`font-black text-xs uppercase mb-4 flex items-center gap-2 ${govMode !== 'NORMAL' ? 'text-red-700' : 'text-slate-500'}`}>
              <FiLock /> Sovereign Governance
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Governance Mode</label>
                <select 
                  value={govMode} 
                  onChange={(e) => transitionGovernance(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${govMode !== 'NORMAL' ? 'bg-white border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                  <option value="NORMAL">Standard Operations</option>
                  <option value="ELEVATED_THREAT">Elevated Threat (Active Monitoring)</option>
                  <option value="LOCKDOWN_FINANCE">Lockdown: Finance (Payouts Frozen)</option>
                  <option value="LOCKDOWN_ADMIN">Lockdown: Admin (Identity Frozen)</option>
                  <option value="FULL_CONTAINMENT">Full Containment (Quorum Required)</option>
                  <option value="RECOVERY">Recovery Protocol (Restricted)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {govMode === 'FULL_CONTAINMENT' 
                  ? 'CRITICAL: Platform is in full containment. All non-recovery mutations are frozen. Quorum required for exit.' 
                  : govMode === 'RECOVERY'
                  ? 'RECOVERY: Capability restoration in progress. Treasury remains frozen.'
                  : 'Platform is operating under sovereign security policies. Automated watchdog active.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <FraudInvestigationPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} onResolved={() => { setSelectedIncident(null); fetchData(); }} />
        </div>
      )}
    </div>
  );
}
