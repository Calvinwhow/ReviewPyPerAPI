import { useId } from 'react';
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

const fieldClass = cn(
  'w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-foreground)]',
  'placeholder:text-[var(--color-muted-foreground)]/60',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-60',
);

const labelClass = 'block text-sm font-medium text-[var(--color-foreground)]';
const hintClass = 'text-xs text-[var(--color-muted-foreground)]';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  error?: string;
}

export function Input({ label, hint, icon, error, className, id: externalId, ...props }: InputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(fieldClass, icon && 'pl-10', error && 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]')}
          aria-invalid={!!error || undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
      </div>
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id: externalId, ...props }: TextareaProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <textarea id={id} className={fieldClass} aria-describedby={hintId} {...props} />
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}

export function Select({
  label,
  options,
  placeholder,
  hint,
  className,
  id: externalId,
  ...props
}: SelectProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <select id={id} className={fieldClass} aria-describedby={hintId} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}
