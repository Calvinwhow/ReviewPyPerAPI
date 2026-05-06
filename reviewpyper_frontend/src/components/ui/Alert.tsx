import type { ReactNode } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  Variant,
  { icon: typeof Info; bg: string; border: string; iconColor: string; textColor: string; role: 'status' | 'alert' }
> = {
  info: {
    icon: Info,
    bg: 'bg-[var(--color-primary-soft)]',
    border: 'border-[var(--color-primary)]/20',
    iconColor: 'text-[var(--color-primary)]',
    textColor: 'text-[var(--color-foreground)]',
    role: 'status',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-[var(--color-success-soft)]',
    border: 'border-[var(--color-success)]/25',
    iconColor: 'text-[var(--color-success)]',
    textColor: 'text-[var(--color-foreground)]',
    role: 'status',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[var(--color-warning-soft)]',
    border: 'border-[var(--color-warning)]/30',
    iconColor: 'text-[var(--color-warning)]',
    textColor: 'text-[var(--color-foreground)]',
    role: 'status',
  },
  error: {
    icon: XCircle,
    bg: 'bg-[var(--color-danger-soft)]',
    border: 'border-[var(--color-danger)]/25',
    iconColor: 'text-[var(--color-danger)]',
    textColor: 'text-[var(--color-foreground)]',
    role: 'alert',
  },
};

export default function Alert({ variant, title, children, className }: AlertProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;
  return (
    <div
      role={cfg.role}
      className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', cfg.bg, cfg.border, cfg.textColor, className)}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', cfg.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <div className="mb-0.5 font-semibold">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
