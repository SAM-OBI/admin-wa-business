import React, { useState } from 'react';
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
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <FaShieldAlt className="text-primary" /> Governance Queue ({requests.length})
            </h2>
            
            <AnimatePresence>
                {requests.map((request) => (
                    <motion.div
                        key={request._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 p-5 rounded-[5px] shadow-sm relative overflow-hidden"
                    >
                        {/* Expiry Countdown */}
                        <div className="absolute top-0 right-0 p-3 flex items-center gap-2 text-[9px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-500/10 rounded-bl-[10px]">
                            <FaClock /> {formatDistanceToNow(new Date(request.expiresAt))} LEFT
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 dark:text-gray-100">{request.actionType.replace(/_/g, ' ')}</h3>
                                <p className="text-xs text-gray-500 mt-1">{request.description}</p>
                            </div>
                        </div>

                        {/* Context Panel */}
                        <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-gray-50 dark:bg-black/20 rounded-[5px] border border-gray-100 dark:border-white/5">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Initiator</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                                        <FaFingerprint />
                                    </div>
                                    <span className="text-xs font-medium font-mono truncate">{request.requestedBy}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Consensus Status</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-xs font-black text-primary">{request.approvals.length}</span>
                                    <span className="text-xs text-gray-400">/ {request.requiredApprovals} Signed</span>
                                </div>
                            </div>
                        </div>

                        {/* Diff Visualization (Simplified) */}
                        <div className="p-3 border border-dashed border-gray-200 dark:border-white/10 rounded-[5px] mb-4">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Impact Awareness</p>
                           <div className="flex gap-2">
                               <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded">RISK +15%</span>
                               <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded">RATIO ADJUST</span>
                           </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => handleApprove(request._id)}
                                disabled={approving === request._id}
                                className="flex-1 bg-primary text-white h-10 rounded-[5px] font-black uppercase text-[10px] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {approving === request._id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><FaCheck /> Sign Transaction</>
                                )}
                            </button>
                            <button className="px-4 h-10 border border-gray-200 dark:border-white/10 rounded-[5px] text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center text-[9px] text-gray-400 font-bold">
                             <div className="flex items-center gap-1">
                                 <FaHistory /> Proposal UID: {request._id.slice(-8)}
                             </div>
                             <button className="text-primary hover:underline">Download Forensic PDF</button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const FaShieldAlt = (props: any) => <FaShieldAltIcon {...props} />;
import { FaShieldAlt as FaShieldAltIcon } from 'react-icons/fa';
