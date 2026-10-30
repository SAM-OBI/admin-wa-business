import React, { useState} from 'react';
import { MultiSigRequest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTimes, FaClock, FaFingerprint, FaHistory } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface Props {
    requests: MultiSigRequest[];
    onApprove: (id: string) => Promise<void>;
}

export const MultiSigInbox: React.FC<Props> = ({ requests, onApprove }) => {
    const [approving, setApproving] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        setApproving(id);
        try {
            await onApprove(id);
        } finally {
            setApproving(null);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-sv-text-muted mb-6 flex items-center gap-2">
                <FaShieldAlt className="text-sv-primary" /> Governance Queue ({requests.length})
            </h2>
            
            <AnimatePresence>
                {requests.map((request) => (
                    <motion.div
                        key={request._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-sv-surface border border-sv-border p-4 sm:p-5 rounded-xl shadow-sm relative overflow-hidden"
                    >
                        {/* Expiry Countdown */}
                        <div className="absolute top-0 right-0 p-3 flex items-center gap-2 text-[9px] font-black uppercase text-sv-warning bg-sv-warning-soft rounded-bl-[10px]">
                            <FaClock /> {formatDistanceToNow(new Date(request.expiresAt))} LEFT
                        </div>

                        <div className="flex justify-between items-start mb-4 pr-24">
                            <div>
                                <h3 className="text-sm font-black text-sv-text-primary">{request.actionType.replace(/_/g, ' ')}</h3>
                                <p className="text-xs text-sv-text-secondary mt-1">{request.description}</p>
                            </div>
                        </div>

                        {/* Context Panel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-3 bg-sv-surface-muted rounded-xl border border-sv-border">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-sv-text-muted uppercase">Initiator</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-sv-primary/10 text-sv-primary flex items-center justify-center text-[10px]">
                                        <FaFingerprint />
                                    </div>
                                    <span className="text-xs font-medium font-mono truncate text-sv-text-primary">
                                        {typeof request.requestedBy === 'string' ? request.requestedBy : (request.requestedBy as any)?.name || (request.requestedBy as any)?.email}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 sm:text-right">
                                <p className="text-[9px] font-black text-sv-text-muted uppercase">Consensus Status</p>
                                <div className="flex items-center sm:justify-end gap-1">
                                    <span className="text-xs font-black text-sv-primary">{request.approvals.length}</span>
                                    <span className="text-xs text-sv-text-muted">/ {request.requiredApprovals} Signed</span>
                                </div>
                            </div>
                        </div>

                        {/* Diff Visualization (Simplified) */}
                        <div className="p-3 border border-dashed border-sv-border rounded-xl mb-4">
                           <p className="text-[9px] font-black text-sv-text-muted uppercase mb-2">Impact Awareness</p>
                           <div className="flex flex-wrap gap-2">
                               <span className="text-[10px] px-2 py-0.5 bg-sv-danger-soft text-sv-danger font-bold rounded">RISK +15%</span>
                               <span className="text-[10px] px-2 py-0.5 bg-sv-success-soft text-sv-success font-bold rounded">RATIO ADJUST</span>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-6">
                            <button
                                onClick={() => handleApprove(request._id)}
                                disabled={approving === request._id}
                                className="flex-1 bg-sv-primary text-sv-text-inverse h-10 rounded-xl font-bold uppercase text-[10px] shadow-sm flex items-center justify-center gap-2 hover:bg-sv-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {approving === request._id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><FaCheck /> Sign Transaction</>
                                )}
                            </button>
                            <button className="px-4 h-10 border border-sv-border rounded-xl text-sv-text-muted hover:text-sv-danger hover:border-sv-danger transition-colors flex items-center justify-center">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[9px] text-sv-text-muted font-bold">
                             <div className="flex items-center gap-1">
                                 <FaHistory /> Proposal UID: {request._id.slice(-8)}
                             </div>
                             <button className="text-sv-primary hover:underline">Download Forensic PDF</button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const FaShieldAlt = (props: any) => <FaShieldAltIcon {...props} />;
import { FaShieldAlt as FaShieldAltIcon } from 'react-icons/fa';
