import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps { children: ReactNode; className?: string; }
export function Card({ children, className }: CardProps) {
  return <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)}>{children}</div>;
}

interface CardHeaderProps { children: ReactNode; action?: ReactNode; }
export function CardHeader({ children, action }: CardHeaderProps) {
  return <div className="flex items-start justify-between px-6 pt-5 pb-2">{<div>{children}</div>}{action}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-900">{children}</h3>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500 mt-0.5">{children}</p>;
}

interface CardBodyProps { children: ReactNode; className?: string; }
export function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}

interface CardFooterProps { children: ReactNode; className?: string; }
export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={clsx('px-6 py-4 border-t border-gray-100 bg-gray-50/50', className)}>{children}</div>;
}
