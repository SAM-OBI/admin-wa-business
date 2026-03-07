import React, { useState } from 'react';
import { adminService } from '../api/admin.service';
import { toast } from 'react-hot-toast';
import { 
  BsShieldLock, 
  BsExclamationTriangle, 
  BsCheckCircle, 
  BsXCircle,
  BsHammer
} from 'react-icons/bs';
import { motion } from 'framer-motion';

interface FraudIncident {
  _id: string;
  incidentType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  context: any;
  riskScore: number;
  triggeredSignals: string[];
  resolved: boolean;
  occurrences: number;
  lastOccurred: string;
}

interface Props {
  incident: FraudIncident;
  onResolved: () => void;
  onClose: () => void;
}

const FraudInvestigationPanel: React.FC<Props> = ({ incident, onResolved, onClose }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('CLEARED');
  const [note, setNote] = useState('');
  const [justification, setJustification] = useState('');

  const handleResolve = async () => {
    if (!note || !justification) {
      toast.error('Note and Justification are required for resolution');
      return;
    }

    setIsResolving(true);
    try {
      await adminService.resolveFraudIncident(incident._id, resolutionAction, note, justification);
      toast.success('Incident resolved successfully');
      onResolved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resolve incident');
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-w-2xl w-full"
    >
      <div className={`p-4 border-b flex justify-between items-center ${getSeverityColor(incident.severity)}`}>
        <div className="flex items-center gap-3">
          <BsShieldLock size={20} />
          <h2 className="font-bold text-lg uppercase tracking-tight">Fraud Investigation: {incident.incidentType}</h2>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <BsXCircle size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk Score Gauge */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div>
            <p className="text-sm text-slate-500 font-medium">Risk Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${incident.riskScore >= 80 ? 'text-red-600' : 'text-slate-800'}`}>
                {incident.riskScore}
              </span>
              <span className="text-slate-400 font-bold">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Occurrences</p>
            <p className="text-2xl font-bold text-slate-800">{incident.occurrences}</p>
          </div>
        </div>

        {/* Triggered Signals */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BsExclamationTriangle /> Triggered Signals
          </h3>
          <div className="flex flex-wrap gap-2">
            {incident.triggeredSignals.map((signal, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-bold font-mono">
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Device & Context */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase">Device Fingerprint</p>
            <p className="text-xs font-mono break-all text-slate-600 mt-1">{incident.context?.fingerprint || 'N/A'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase">Source IP</p>
            <p className="text-xs font-mono text-slate-600 mt-1">{incident.context?.ip || 'N/A'}</p>
          </div>
        </div>

        {/* Resolution Section */}
        {!incident.resolved ? (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BsHammer /> Resolution Workflow
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Action</label>
                <select 
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="CLEARED">Clear Incident (False Positive)</option>
                  <option value="ACCOUNT_SUSPENDED">Suspend Account (Enforce Lock)</option>
                  <option value="WITHDRAWALS_FROZEN">Freeze Withdrawals Only</option>
                  <option value="DEVICE_BLOCKED">Block Device Hash</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resolution Note (Internal)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe investigation outcome..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Governance Justification</label>
                  <textarea 
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Mandated audit trail reason..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResolving ? 'Processing...' : (
                  <>
                    <BsCheckCircle /> Finalize Resolution & Close Case
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-green-50 p-4 border border-green-200 rounded-xl flex items-center gap-4">
            <BsCheckCircle className="text-green-600" size={24} />
            <div>
              <p className="text-green-800 font-bold">Resolved as {incident.context?.resolutionAction || 'CLEARED'}</p>
              <p className="text-green-600 text-xs">This case is closed for further investigation.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FraudInvestigationPanel;
