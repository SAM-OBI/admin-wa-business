import type { ReactNode } from 'react';

/**
 * ADR-005 primitive: genuinely no data — the request succeeded, there's
 * nothing there. Never used when a request failed (use ErrorState).
 */
export interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    className?: string;
}

export function EmptyState({ title, description, icon, className = '' }: EmptyStateProps) {
    return (
        <div className={`text-center py-10 px-4 ${className}`}>
            <div className="w-12 h-12 bg-sv-surface-muted text-sv-text-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {icon ?? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </div>
            <p className="text-sm font-semibold text-sv-text-primary mb-1">{title}</p>
            {description && <p className="text-sm text-sv-text-secondary max-w-sm mx-auto">{description}</p>}
        </div>
    );
}

export default EmptyState;
