import React, { useState, useEffect} from 'react';
import { FaSearch, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useStableCallback, useTimeout } from '../../hooks/institutional';

interface HardenedSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    context?: 'BUYER' | 'VENDOR' | 'ADMIN';
    debounceMs?: number;
}

/**
 * 🛡️ [v104.3] Hardened Search Input Component (Admin)
 * Institutional Lifecycle Governance: Deterministic & Concurrency Safe.
 */
export const HardenedSearchInput: React.FC<HardenedSearchInputProps> = ({
    value,
    onChange,
    placeholder = "Search...",
    className,
    context = 'ADMIN',
    debounceMs = 400
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHardened, setIsHardened] = useState(false);

    // Sync local value with prop (P0 Priority)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Stable Normalization Callback (P1 Priority)
    const handleNormalization = useStableCallback((raw: string) => {
        const normalized = raw
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\u00C0-\u017F]/g, '');

        if (normalized !== value) {
            onChange(normalized);
            setIsHardened(true);
        }
        setIsProcessing(false);
    });

    // Governance: Debounced Dispatch
    const isDirty = localValue !== value;
    useTimeout(() => {
        if (isDirty) {
            handleNormalization(localValue);
        }
    }, isDirty ? debounceMs : null);

    // Track Processing State
    useEffect(() => {
        if (localValue !== value) {
            setIsProcessing(true);
        }
    }, [localValue, value]);

    // Stable Visual Feedback Reset
    const resetHardened = useStableCallback(() => setIsHardened(false));
    useTimeout(resetHardened, isHardened ? 2000 : null);

    return (
        <div className={cn("relative group w-full", className)}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="spinner"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <FaSpinner className="text-sv-primary animate-spin" size={16} />
                        </motion.div>
                    ) : isHardened ? (
                        <motion.div
                            key="shield"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <FaShieldAlt className="text-emerald-500" size={16} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <FaSearch className="text-sv-text-muted group-focus-within:text-sv-primary transition-colors" size={16} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full pl-12 pr-10 py-3 bg-sv-surface border border-sv-border rounded-xl transition-all",
                    "focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary outline-none font-medium",
                    "text-sv-text-primary placeholder:text-sv-text-muted",
                    isHardened && "border-emerald-500/50 bg-emerald-50/10"
                )}
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {context === 'ADMIN' && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-50">
                        Admin Secured
                    </span>
                )}
            </div>
        </div>
    );
};
