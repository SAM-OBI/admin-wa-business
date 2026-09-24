import React, { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaStore, FaShoppingBag, FaHistory, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { HardenedSearchInput } from './HardenedSearchInput';
import { cn } from '../../utils/cn';
import { useEventListener, useStableCallback } from '../../hooks/institutional';

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🏛️ [v104.3] Admin Discovery Dashboard
 * Centralized governance search for the Institutional Oversight Node.
 * Institutional Lifecycle Governance: Deterministic & Concurrency Safe.
 */
export const GlobalSearchOverlay: React.FC<GlobalSearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'USERS' | 'VENDORS' | 'ORDERS' | 'HISTORY'>('ALL');
  
  // Governance: Stable Close Handler
  const handleClose = useStableCallback(() => onClose());

  // Governance: Deterministic Escape Key Observer
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  }, typeof window !== 'undefined' ? window : null);

  const tabs = [
    { id: 'ALL', label: 'All Entities', icon: FaShieldAlt },
    { id: 'USERS', label: 'Users', icon: FaUserShield },
    { id: 'VENDORS', label: 'Vendors', icon: FaStore },
    { id: 'ORDERS', label: 'Orders', icon: FaShoppingBag },
    { id: 'HISTORY', label: 'Audit Trail', icon: FaHistory },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-xl"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-3xl bg-[#192720] border border-[#26362F] rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Governance Header */}
            <div className="p-6 border-b border-[#26362F] bg-gradient-to-r from-blue-900/10 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#55B98A] rounded-lg text-[#0D1512]">
                    <FaShieldAlt size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#F3F7F5] uppercase tracking-widest">Institutional Oversight</h3>
                    <p className="text-[10px] text-[#7F9188] font-bold uppercase tracking-tighter mt-0.5">Sovereign Registry Discovery</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#26362F] rounded-full transition-colors text-[#7F9188] hover:text-[#F3F7F5]"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <HardenedSearchInput 
                value={query}
                onChange={setQuery}
                placeholder="SEARCH REGISTRY (ID, EMAIL, NAME)..."
                className="scale-105 origin-left"
                context="ADMIN"
              />

              <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                      activeTab === tab.id
                        ? "bg-[#55B98A] text-[#0D1512]"
                        : "text-[#7F9188] hover:text-[#F3F7F5] hover:bg-[#26362F]"
                    )}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discovery Results */}
            <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {query.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6FA9DF] animate-pulse" />
                    <span className="text-[10px] font-black text-[#6FA9DF] uppercase tracking-widest">Registry Query in Progress...</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl animate-pulse">
                      <div className="h-4 w-1/3 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <FaHistory className="mx-auto text-[#26362F] mb-4" size={40} />
                  <p className="text-[#7F9188] text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Authorization Query</p>
                  <p className="text-[9px] text-[#4A5A52] mt-2 font-bold uppercase tracking-tighter">Enter criteria to scan the sovereign registry</p>
                </div>
              )}
            </div>

            {/* Security Footer */}
            <div className="p-4 border-t border-[#26362F] bg-[#0D1512] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-[#6FA9DF] opacity-50" size={12} />
                    <span className="text-[9px] font-black text-[#7F9188] uppercase tracking-widest">Sovereign Discovery OS v104.3</span>
                </div>
                <div className="text-[9px] font-bold text-[#4A5A52] uppercase italic">Protected by Institutional WAF</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
