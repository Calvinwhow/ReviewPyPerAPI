import { clsx } from 'clsx';

interface ProgressBarProps {
  /** 0..1, or undefined for indeterminate. */
  value?: number;
  label?: string;
  className?: string;
}

/**
 * Determinate or indeterminate progress bar. Use this while a long-running
 * mutation is pending — pages can pass `useMutation().isPending` to drive it.
 */
export default function ProgressBar({ value, label, className }: ProgressBarProps) {
  const indeterminate = value === undefined;
  const pct = Math.max(0, Math.min(1, value ?? 0)) * 100;

  return (
    <div
      className={clsx('w-full', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      aria-label={label}
    >
      {label && <div className="text-xs text-gray-600 mb-1">{label}</div>}
      <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
        {indeterminate ? (
          <div className="h-full w-1/3 animate-[progress-indeterminate_1.4s_ease-in-out_infinite] bg-primary-600" />
        ) : (
          <div
            className="h-full bg-primary-600 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <style>{`
        @keyframes progress-indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
