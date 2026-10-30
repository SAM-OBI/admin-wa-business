import React, { useState, useEffect} from 'react';
import { adminService } from '../api/admin.service';
import { 
  FiShield, 
  FiRefreshCw, 
  FiClock, 
  FiAlertTriangle,
  FiSliders
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AutonomousAIControl: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [stability, setStability] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState<'control' | 'history' | 'telemetry'>('control');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, historyRes] = await Promise.all([
        adminService.getIntelligenceSettings(),
        adminService.getIntelligenceHistory()
      ]);
      setSettings(settingsRes.data);
      setStability(settingsRes.data.economicStability || {});
      setHistory(historyRes.data);
    } catch {
      toast.error('Failed to load intelligence controls');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!password || !reason) {
      toast.error('Password and change reason are required for governance.');
      return;
    }

    try {
      await adminService.updateIntelligenceSettings({
        intelligenceSettings: settings,
        economicStabilitySettings: stability,
        password,
        reason
      });
      toast.success('AI Governance updated successfully');
      setShowConfirm(false);
      setPassword('');
      setReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleRollback = async (version: number) => {
    const pwd = prompt('Enter admin password to authorize rollback to version ' + version);
    if (!pwd) return;

    try {
      await adminService.rollbackIntelligence({ version, password: pwd });
      toast.success(`Rollback to v${version} completed`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rollback failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <FiRefreshCw className="w-8 h-8 animate-spin text-sv-primary" />
    </div>
  );

  return (
    <div className="bg-sv-surface rounded-2xl border border-sv-border p-4 sm:p-6 shadow-xl text-sv-text-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiShield className="w-7 h-7 sm:w-8 sm:h-8 text-sv-primary shrink-0" />
            Autonomous AI Control Panel
          </h2>
          <p className="text-sv-text-muted text-xs sm:text-sm mt-1">Institutional Oversight & Market Stabilization Engine</p>
        </div>
        <div className="flex bg-sv-surface-muted border border-sv-border rounded-xl p-1 shrink-0 overflow-x-auto">
          {['control', 'history', 'telemetry'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all font-semibold text-xs sm:text-sm ${
                activeTab === tab ? 'bg-sv-primary text-sv-text-inverse shadow-sm' : 'text-sv-text-secondary hover:text-sv-text-primary hover:bg-sv-surface'
              } capitalize`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'control' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Main Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-sv-surface-muted p-5 rounded-2xl border border-sv-border">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-sv-text-primary">
                <FiSliders className="w-5 h-5 text-sv-primary shrink-0" />
                Intelligence Kill Switches
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'aiRankingEnabled', label: 'Autonomous Ranking Engine' },
                  { id: 'aiRiskEnabled', label: 'Frictionless Risk Evaluation' },
                  { id: 'aiSentimentEnabled', label: 'Dynamic Market Sentiment' },
                  { id: 'aiTunerEnabled', label: 'Self-Optimizing Ad Tuner' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-sv-text-secondary">{item.label}</span>
                    <button
                      onClick={() => setSettings({ ...settings, [item.id]: !settings[item.id] })}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        settings?.[item.id] ? 'bg-sv-primary' : 'bg-sv-border'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.[item.id] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sv-surface-muted p-5 rounded-2xl border border-sv-border">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-sv-text-primary">
                <FiAlertTriangle className="w-5 h-5 text-sv-danger shrink-0" />
                Economic Stability Engine
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'priceWarDetectionEnabled', label: 'Price War Dampening' },
                  { id: 'collusionDetectionEnabled', label: 'Collusion Prevention' },
                  { id: 'shortageDetectionEnabled', label: 'Artificial Shortage Guard' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-sv-text-secondary">{item.label}</span>
                    <button
                      onClick={() => setStability({ ...stability, [item.id]: !stability[item.id] })}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        stability?.[item.id] ? 'bg-sv-danger' : 'bg-sv-border'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        stability?.[item.id] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Dial */}
          <div className="bg-sv-surface-muted p-5 sm:p-6 rounded-2xl border border-sv-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-sv-text-primary">Global Risk Sensitivity Dial</h3>
                <p className="text-xs text-sv-text-muted">Adjusts friction platform-wide. Values {'>'} 1.0 enhance security.</p>
              </div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-sv-primary">{settings?.riskDialFactor?.toFixed(2)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={settings?.riskDialFactor || 1.0}
              onChange={(e) => setSettings({ ...settings, riskDialFactor: parseFloat(e.target.value) })}
              className="w-full h-2 bg-sv-border rounded-lg appearance-none cursor-pointer accent-sv-primary"
            />
            <div className="flex justify-between text-[10px] mt-2 text-sv-text-muted px-1 font-semibold">
              <span>AGGRESSIVE GROWTH (0.5x)</span>
              <span>BALANCED (1.0x)</span>
              <span>INSTITUTIONAL HARD (2.0x)</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-sv-primary hover:bg-sv-primary-hover text-sv-text-inverse rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FiShield className="w-5 h-5" />
              Commit Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-sv-border text-sv-text-muted text-xs uppercase font-bold tracking-wider">
                  <th className="pb-3 px-3">Version</th>
                  <th className="pb-3 px-3">Author</th>
                  <th className="pb-3 px-3">Changes/Reason</th>
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-border">
                {history.map((item) => (
                  <tr key={item._id} className="group hover:bg-sv-surface-muted/50 transition-colors">
                    <td className="py-4 px-3 font-mono font-bold text-sv-primary">v{item.version}</td>
                    <td className="py-4 px-3">
                      <div className="text-sm font-semibold text-sv-text-primary">{item.updatedBy?.name}</div>
                      <div className="text-[10px] text-sv-text-muted">{item.ipAddress}</div>
                    </td>
                    <td className="py-4 px-3 max-w-md">
                      <p className="text-sm text-sv-text-secondary truncate" title={item.changeReason}>{item.changeReason}</p>
                    </td>
                    <td className="py-4 px-3 text-xs text-sv-text-muted whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <button
                        onClick={() => handleRollback(item.version)}
                        className="text-xs bg-sv-surface hover:bg-sv-surface-muted text-sv-text-primary px-3 py-1.5 rounded-lg border border-sv-border font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <FiClock className="w-3.5 h-3.5 text-sv-text-muted" />
                        Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-500">
          <div className="bg-sv-surface-muted p-5 sm:p-6 rounded-2xl border border-sv-border">
            <h3 className="text-xs font-bold text-sv-text-muted uppercase mb-4 tracking-wider">AI Detection Telemetry</h3>
            <div className="space-y-3">
              {[
                { label: 'Fraud Detection Rate', value: '99.2%', trend: 'up' },
                { label: 'False Positive Target', value: '< 0.5%', trend: 'stable' },
                { label: 'Latency (P99)', value: '142ms', trend: 'down' },
                { label: 'Ranking Volatility', value: 'Low', trend: 'stable' }
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center p-3.5 bg-sv-surface rounded-xl border border-sv-border">
                  <span className="text-sm font-medium text-sv-text-secondary">{m.label}</span>
                  <span className="text-sm font-mono font-bold text-sv-primary">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sv-surface-muted p-5 sm:p-6 rounded-2xl border border-sv-border">
            <h3 className="text-xs font-bold text-sv-text-muted uppercase mb-4 tracking-wider">Decision Explainability (Recent Trace)</h3>
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-bold text-sv-primary mb-2">[TRACE_ID: AI_9821_XS] - PRICE_WAR_DAMPEN</div>
              <div className="space-y-1.5">
                <div className="bg-sv-surface border border-sv-border h-2.5 rounded-full w-full overflow-hidden">
                  <div className="bg-sv-primary h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-sv-text-muted">
                  <span>Probability: 0.85</span>
                  <span>Threshold: 0.25</span>
                </div>
              </div>
              <p className="text-xs p-3.5 bg-sv-surface rounded-xl border border-sv-border border-l-4 border-l-sv-primary text-sv-text-secondary leading-relaxed">
                Action triggered by categorized inventory drops across 3 major vendors (Cat: Electronics). Price correlation exceeding 0.78 safety bound.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-sv-surface-elevated border border-sv-border w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl text-sv-text-primary">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-sv-text-primary">
              <FiAlertTriangle className="w-6 h-6 text-sv-warning shrink-0" />
              Authorize Configuration Change
            </h3>
            <p className="text-sv-text-secondary text-sm mb-6 leading-relaxed">You are committing changes to the Platform's core intelligence engine. This action requires re-authentication and a valid business reason.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-sv-text-muted block mb-1.5">Reason for change</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-sv-surface border border-sv-border rounded-xl p-3 text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary outline-none h-24 transition-all"
                  placeholder="e.g. Adjusting risk dial in response to detected refund surge in Gadgets category."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-sv-text-muted block mb-1.5">Admin Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-sv-surface border border-sv-border rounded-xl p-3 text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary outline-none transition-all"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-sv-surface hover:bg-sv-surface-muted border border-sv-border text-sv-text-primary text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 px-4 rounded-xl bg-sv-primary hover:bg-sv-primary-hover text-sv-text-inverse text-sm font-bold shadow-lg transition-all"
              >
                Authorize & Commit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousAIControl;
