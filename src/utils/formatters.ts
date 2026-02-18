/**
 * Formatting Utilities
 */

/**
 * Format currency with locale awareness (Intl.NumberFormat)
 */
export const formatCurrency = (
  amount: number,
  currency: 'NGN' | 'USD' = 'NGN',
  locale: string = 'en-NG'
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch {
    // Fallback for failed formatting
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  }
};

/**
 * Unified Time Utility
 */
export const formatDate = (
  date: string | Date,
  variant: 'relative' | 'absolute' | 'full' = 'relative'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';

  if (variant === 'relative') {
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 84400)}d ago`;
    // Fall back to absolute if more than a week
  }

  if (variant === 'full') {
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
