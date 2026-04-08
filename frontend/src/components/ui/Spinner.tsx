import { clsx } from 'clsx';

interface SpinnerProps { label?: string; className?: string; }

export default function Spinner({ label, className }: SpinnerProps) {
  return (
    <div className={clsx('flex items-center justify-center gap-3', className)}>
      <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}
