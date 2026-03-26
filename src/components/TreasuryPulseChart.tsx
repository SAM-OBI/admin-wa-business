import React from 'react';
import { TreasuryHealth } from '../types';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

interface Props {
    health: TreasuryHealth;
}

export const TreasuryPulseChart: React.FC<Props> = ({ health }) => {
    const status = health.interpretedStatus || 'HEALTHY';
    
    const colors = {
        HEALTHY: 'emerald',
        WARNING: 'amber',
        CRITICAL: 'red'
    };
    
    const color = colors[status];

    return (
        <div className={`p-6 rounded-[5px] border border-${color}-100 dark:border-${color}-500/20 bg-${color}-50/30 dark:bg-${color}-500/5 transition-all duration-500`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-${color}-100 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400`}>
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Treasury Guard Status</h3>
                        <p className={`text-xl font-black text-${color}-600 dark:text-${color}-400`}>{status}</p>
                    </div>
                </div>
                
                <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Liquidity Ratio</p>
                    <p className="text-2xl font-black font-mono">{health.liquidityRatio?.toFixed(2) || '0.00'}</p>
                </div>
            </div>

            {/* Drilldown Panel - Decision Transparency */}
            {health.drilldown && health.drilldown.mainCause !== 'NONE' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-[5px] bg-white/50 dark:bg-black/20 border-l-4 border-${color}-500`}
                >
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className={`mt-1 text-${color}-500`} />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">Decision Context</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-bold">Root Cause:</span> {health.drilldown.mainCause.replace(/_/g, ' ')}
                            </p>
                            <div className="mt-2 text-[10px] p-2 bg-red-100/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black rounded uppercase">
                                RECOMMENDED ACTION: {health.drilldown.recommendedAction.replace(/_/g, ' ')}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Micro-Interaction: Status Lockdown UI (Mock for Now) */}
            {status === 'CRITICAL' && (
                <div className="mt-4 animate-pulse">
                    <div className="bg-red-600 text-white text-[9px] font-black py-1 px-3 rounded-full uppercase text-center tracking-tighter">
                        Platform Protection Mode Active: Sensitivity-Based Gating Enabled
                    </div>
                </div>
            )}
        </div>
    );
};
