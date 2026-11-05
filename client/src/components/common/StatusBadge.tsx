import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const isSmall = size === 'sm';

  if (status === 'SAFE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 ${
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <CheckCircle2 className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Safe Zone
      </span>
    );
  }

  if (status === 'WARNING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 ${
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <AlertTriangle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Warning (Near 75%)
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      } ${className}`}
    >
      <XCircle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      Critical Shortage
    </span>
  );
};

