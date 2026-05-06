import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ children, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 pb-4 pt-5">
      <div className="min-w-0">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
      {children}
    </h3>
  );
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{children}</p>;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'border-t border-[var(--color-border)] bg-[var(--color-muted)]/40 px-6 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
