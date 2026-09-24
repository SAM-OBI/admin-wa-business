import React, { useState} from 'react';
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
      case 'CRITICAL': return 'text-sv-danger bg-sv-danger-soft border-sv-danger/30';
      case 'HIGH': return 'text-sv-warning bg-sv-warning-soft border-sv-warning/30';
      case 'MEDIUM': return 'text-sv-warning bg-sv-warning-soft border-sv-warning/30';
      default: return 'text-sv-info bg-sv-info-soft border-sv-info/30';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-sv-surface rounded-xl shadow-2xl border border-sv-border overflow-hidden max-w-2xl w-full"
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
        <div className="flex items-center justify-between p-4 bg-sv-surface-muted rounded-lg border border-sv-border">
          <div>
            <p className="text-sm text-sv-text-secondary font-medium">Risk Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${incident.riskScore >= 80 ? 'text-sv-danger' : 'text-sv-text-primary'}`}>
                {incident.riskScore}
              </span>
              <span className="text-sv-text-muted font-bold">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-sv-text-secondary font-medium">Occurrences</p>
            <p className="text-2xl font-bold text-sv-text-primary">{incident.occurrences}</p>
          </div>
        </div>

        {/* Triggered Signals */}
        <div>
          <h3 className="text-sm font-bold text-sv-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <BsExclamationTriangle /> Triggered Signals
          </h3>
          <div className="flex flex-wrap gap-2">
            {incident.triggeredSignals.map((signal, i) => (
              <span key={i} className="px-3 py-1 bg-sv-danger-soft text-sv-danger border border-sv-danger/30 rounded-full text-xs font-bold font-mono">
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Device & Context */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-sv-surface-muted rounded border border-sv-border">
            <p className="text-[10px] text-sv-text-muted font-black uppercase">Device Fingerprint</p>
            <p className="text-xs font-mono break-all text-sv-text-secondary mt-1">{incident.context?.fingerprint || 'N/A'}</p>
          </div>
          <div className="p-3 bg-sv-surface-muted rounded border border-sv-border">
            <p className="text-[10px] text-sv-text-muted font-black uppercase">Source IP</p>
            <p className="text-xs font-mono text-sv-text-secondary mt-1">{incident.context?.ip || 'N/A'}</p>
          </div>
        </div>

        {/* Resolution Section */}
        {!incident.resolved ? (
          <div className="mt-8 border-t border-sv-border pt-6">
            <h3 className="text-sm font-bold text-sv-text-primary mb-4 flex items-center gap-2">
              <BsHammer /> Resolution Workflow
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-sv-text-secondary uppercase mb-2">Primary Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full p-3 bg-sv-surface-muted border border-sv-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-sv-primary focus:outline-none transition-all"
                >
                  <option value="CLEARED">Clear Incident (False Positive)</option>
                  <option value="ACCOUNT_SUSPENDED">Suspend Account (Enforce Lock)</option>
                  <option value="WITHDRAWALS_FROZEN">Freeze Withdrawals Only</option>
                  <option value="DEVICE_BLOCKED">Block Device Hash</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-sv-text-secondary uppercase mb-2">Resolution Note (Internal)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe investigation outcome..."
                    className="w-full p-3 bg-sv-surface-muted border border-sv-border rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-sv-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sv-text-secondary uppercase mb-2">Governance Justification</label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Mandated audit trail reason..."
                    className="w-full p-3 bg-sv-surface-muted border border-sv-border rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-sv-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="w-full py-4 bg-sv-primary text-sv-text-inverse rounded-xl font-bold hover:bg-sv-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="mt-8 bg-sv-success-soft p-4 border border-sv-success/30 rounded-xl flex items-center gap-4">
            <BsCheckCircle className="text-sv-success" size={24} />
            <div>
              <p className="text-sv-success font-bold">Resolved as {incident.context?.resolutionAction || 'CLEARED'}</p>
              <p className="text-sv-success text-xs">This case is closed for further investigation.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FraudInvestigationPanel;
