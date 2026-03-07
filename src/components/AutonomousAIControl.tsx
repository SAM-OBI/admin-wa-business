import React, { useState, useEffect } from 'react';
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
      <FiRefreshCw className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiShield className="w-8 h-8 text-blue-400" />
            Autonomous AI Control Panel
          </h2>
          <p className="text-white/60 text-sm mt-1">Institutional Oversight & Market Stabilization Engine</p>
        </div>
        <div className="flex bg-white/5 rounded-lg p-1">
          {['control', 'history', 'telemetry'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === tab ? 'bg-blue-600' : 'hover:bg-white/10'
              } capitalize text-sm`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'control' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Main Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiSliders className="w-5 h-5 text-blue-300" />
                Intelligence Kill Switches
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'aiRankingEnabled', label: 'Autonomous Ranking Engine' },
                  { id: 'aiRiskEnabled', label: 'Frictionless Risk Evaluation' },
                  { id: 'aiSentimentEnabled', label: 'Dynamic Market Sentiment' },
                  { id: 'aiTunerEnabled', label: 'Self-Optimizing Ad Tuner' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{item.label}</span>
                    <button
                      onClick={() => setSettings({ ...settings, [item.id]: !settings[item.id] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings?.[item.id] ? 'bg-blue-600' : 'bg-white/10'
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

            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiAlertTriangle className="w-5 h-5 text-red-300" />
                Economic Stability Engine
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'priceWarDetectionEnabled', label: 'Price War Dampening' },
                  { id: 'collusionDetectionEnabled', label: 'Collusion Prevention' },
                  { id: 'shortageDetectionEnabled', label: 'Artificial Shortage Guard' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{item.label}</span>
                    <button
                      onClick={() => setStability({ ...stability, [item.id]: !stability[item.id] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        stability?.[item.id] ? 'bg-red-500' : 'bg-white/10'
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
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-6 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Global Risk Sensitivity Dial</h3>
                <p className="text-xs text-white/50">Adjusts friction platform-wide. Values {'>'} 1.0 enhance security.</p>
              </div>
              <span className="text-3xl font-mono text-blue-400">{settings?.riskDialFactor?.toFixed(2)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={settings?.riskDialFactor || 1.0}
              onChange={(e) => setSettings({ ...settings, riskDialFactor: parseFloat(e.target.value) })}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] mt-2 text-white/40 px-1">
              <span>AGRESSIVE GROWTH (0.5x)</span>
              <span>BALANCED (1.0x)</span>
              <span>INSTITUTIONAL HARD (2.0x)</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
            >
              <FiShield className="w-5 h-5" />
              Commit Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase">
                  <th className="pb-3 px-2">Version</th>
                  <th className="pb-3 px-2">Author</th>
                  <th className="pb-3 px-2">Changes/Reason</th>
                  <th className="pb-3 px-2">Timestamp</th>
                  <th className="pb-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr key={item._id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2 font-mono text-blue-400">v{item.version}</td>
                    <td className="py-4 px-2">
                      <div className="text-sm">{item.updatedBy?.name}</div>
                      <div className="text-[10px] text-white/40">{item.ipAddress}</div>
                    </td>
                    <td className="py-4 px-2 max-w-md">
                      <p className="text-sm truncate" title={item.changeReason}>{item.changeReason}</p>
                    </td>
                    <td className="py-4 px-2 text-xs text-white/60">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-2">
                      <button
                        onClick={() => handleRollback(item.version)}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded border border-white/10 flex items-center gap-1 transition-all"
                      >
                        <FiClock className="w-3 h-3" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          <div className="bg-black/20 p-6 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold text-white/50 uppercase mb-4 tracking-wider">AI Detection Telemetry</h3>
            <div className="space-y-4">
              {[
                { label: 'Fraud Detection Rate', value: '99.2%', trend: 'up' },
                { label: 'False Positive Target', value: '< 0.5%', trend: 'stable' },
                { label: 'Latency (P99)', value: '142ms', trend: 'down' },
                { label: 'Ranking Volatility', value: 'Low', trend: 'stable' }
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/70">{m.label}</span>
                  <span className="text-sm font-mono text-blue-400">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold text-white/50 uppercase mb-4 tracking-wider">Decision Explainability (Recent Trace)</h3>
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-blue-300 mb-2">[TRACE_ID: AI_9821_XS] - PRICE_WAR_DAMPEN</div>
              <div className="space-y-1">
                <div className="bg-blue-500/20 h-2 rounded-full w-full">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Probability: 0.85</span>
                  <span>Threshold: 0.25</span>
                </div>
              </div>
              <p className="text-xs p-3 bg-white/5 rounded border-l-2 border-blue-500 text-white/80">
                Action triggered by categorized inventory drops across 3 major vendors (Cat: Electronics). Price correlation exceeding 0.78 safety bound.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 w-full max-w-md rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiAlertTriangle className="w-6 h-6 text-yellow-500" />
              Authorize Configuration Change
            </h3>
            <p className="text-white/60 text-sm mb-6">You are committing changes to the Platform's core intelligence engine. This action requires re-authentication and a valid business reason.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 block mb-1">Reason for change</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
                  placeholder="e.g. Adjusting risk dial in response to detected refund surge in Gadgets category."
                />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Admin Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
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
