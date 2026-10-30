import React, { type ReactNode} from 'react';
import { useCapabilities, Capability } from '../../hooks/useCapabilities';
import { FaLock } from 'react-icons/fa';

interface WithCapabilityProps {
  capability: Capability;
  children: ReactNode;
  fallback?: ReactNode; // Custom fallback UI
  hideEntirely?: boolean; // If true, return null instead of fallback when lacking capability
}

/**
 * UI Permission Guard
 * Renders children only if the user possesses the required capability.
 */
export const WithCapability: React.FC<WithCapabilityProps> = ({ 
  capability, 
  children, 
  fallback, 
  hideEntirely = false 
}) => {
  const { hasCapability, loading } = useCapabilities();

  if (loading) {
    // Optionally return a skeleton or null while checking permissions
    return null;
  }

  if (!hasCapability(capability)) {
    if (hideEntirely) return null;
    
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center p-6 bg-sv-surface-muted border border-dashed border-sv-border rounded-xl text-sv-text-muted">
        <div className="flex flex-col items-center gap-2">
          <FaLock size={16} className="text-sv-text-muted/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-center">
            Missing Capability<br/>
            <span className="text-sv-danger opacity-80">{capability}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
