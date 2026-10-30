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
          className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-sv-surface-elevated border border-sv-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Governance Header */}
            <div className="p-4 sm:p-6 border-b border-sv-border bg-sv-surface-muted/40 shrink-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sv-primary rounded-xl text-sv-text-inverse">
                    <FaShieldAlt size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-sv-text-primary uppercase tracking-widest">Institutional Oversight</h3>
                    <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-wider mt-0.5">Sovereign Registry Discovery</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-sv-surface-muted rounded-xl transition-colors text-sv-text-muted hover:text-sv-text-primary"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <HardenedSearchInput 
                value={query}
                onChange={setQuery}
                placeholder="SEARCH REGISTRY (ID, EMAIL, NAME)..."
                className="w-full"
                context="ADMIN"
              />

              <div className="flex gap-2 mt-4 sm:mt-6 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-sv-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                      activeTab === tab.id
                        ? "bg-sv-primary text-sv-text-inverse shadow-xs"
                        : "text-sv-text-secondary hover:text-sv-text-primary hover:bg-sv-surface"
                    )}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discovery Results */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-sv-border">
              {query.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sv-primary animate-pulse" />
                    <span className="text-[10px] font-black text-sv-primary uppercase tracking-widest">Registry Query in Progress...</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-sv-surface border border-sv-border rounded-xl animate-pulse">
                      <div className="h-4 w-1/3 bg-sv-surface-muted rounded mb-2" />
                      <div className="h-3 w-2/3 bg-sv-surface-muted/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 sm:py-20 text-center">
                  <FaHistory className="mx-auto text-sv-border mb-4" size={36} />
                  <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.25em]">Awaiting Authorization Query</p>
                  <p className="text-[10px] text-sv-text-muted/60 mt-1.5 font-bold uppercase tracking-tight">Enter criteria to scan the sovereign registry</p>
                </div>
              )}
            </div>

            {/* Security Footer */}
            <div className="p-3.5 sm:p-4 border-t border-sv-border bg-sv-surface-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-sv-primary opacity-60" size={12} />
                    <span className="text-[9px] font-black text-sv-text-muted uppercase tracking-widest">Sovereign Discovery OS v104.3</span>
                </div>
                <div className="text-[9px] font-bold text-sv-text-muted/60 uppercase">Protected by Institutional WAF</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
