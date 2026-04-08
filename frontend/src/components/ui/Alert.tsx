import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface AlertProps { variant: 'info' | 'success' | 'warning' | 'error'; title?: string; children: ReactNode; className?: string; }

export default function Alert({ variant, title, children, className }: AlertProps) {
  return (
    <div className={clsx('p-4 rounded-lg border text-sm',
      variant === 'info' && 'bg-primary-50 border-primary-200 text-primary-800',
      variant === 'success' && 'bg-success-50 border-success-200 text-success-800',
      variant === 'warning' && 'bg-warning-50 border-warning-200 text-warning-800',
      variant === 'error' && 'bg-danger-50 border-danger-200 text-danger-800',
      className
    )}>
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      {children}
    </div>
  );
}
