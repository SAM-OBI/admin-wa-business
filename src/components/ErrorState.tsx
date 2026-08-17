/**
 * ADR-005 primitive: "failed to load" — a request that did not succeed.
 * Never used for "genuinely no data" (use EmptyState) — those are distinct
 * states that must never collapse into each other (the audit found
 * `catch (error) { setX([]) }` doing exactly that across this app's pages,
 * e.g. Vendors.tsx).
 *
 * `message` should already be a safe, user-facing string — never a raw
 * backend/SDK error message.
 */
export interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
}

export function ErrorState({ message, onRetry, retryLabel = 'Try again', className = '' }: ErrorStateProps) {
    return (
        <div className={`text-center py-10 px-4 ${className}`}>
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Something went wrong</p>
            <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    {retryLabel}
                </button>
            )}
        </div>
    );
}

export default ErrorState;
