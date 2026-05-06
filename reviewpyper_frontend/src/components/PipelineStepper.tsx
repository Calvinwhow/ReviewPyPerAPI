import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { PipelineState } from '../types';
import { cn } from '../lib/utils';

interface Step {
  id: number;
  label: string;
  short: string;
  path: string;
  /** Has this step's output been produced? */
  isComplete: (p: PipelineState) => boolean;
}

const STEPS: Step[] = [
  { id: 1, label: 'Setup',     short: 'Setup',      path: '/setup',              isComplete: (p) => !!p.api_key_path },
  { id: 2, label: 'Titles',    short: 'Titles',     path: '/screening',          isComplete: (p) => !!p.title_output_csv_path },
  { id: 3, label: 'Abstracts', short: 'Abstracts',  path: '/abstract-screening', isComplete: (p) => !!p.master_list_path },
  { id: 4, label: 'PDFs',      short: 'PDFs',       path: '/pdfs',               isComplete: (p) => !!p.ocr_output_dir },
  { id: 5, label: 'Sections',  short: 'Sections',   path: '/text-sections',      isComplete: (p) => !!p.json_dir },
  { id: 6, label: 'Inclusion', short: 'Inclusion',  path: '/inclusion',          isComplete: (p) => !!p.inclusion_automated_csv_path },
  { id: 7, label: 'Extraction',short: 'Extract',    path: '/extraction',         isComplete: (p) => !!p.extraction_automated_csv_path },
];

interface PipelineStepperProps {
  pipeline: PipelineState;
}

export default function PipelineStepper({ pipeline }: PipelineStepperProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = STEPS.findIndex(
    (s) => location.pathname === s.path || (s.path === '/setup' && location.pathname === '/'),
  );

  return (
    <nav aria-label="Pipeline progress" className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
      <ol className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2 sm:px-6">
        {STEPS.map((step, idx) => {
          const done = step.isComplete(pipeline);
          const current = idx === activeIndex;
          const reachable = idx === 0 || STEPS[idx - 1].isComplete(pipeline) || done || current;

          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => navigate(step.path)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-muted)]',
                  current && 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm',
                  !current && reachable && 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]',
                  !reachable && 'text-[var(--color-muted-foreground)]/50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0',
                    done && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
                    !done && current && 'bg-[var(--color-foreground)] text-[var(--color-background)]',
                    !done && !current && 'bg-[var(--color-border)] text-[var(--color-muted-foreground)]',
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : step.id}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
                <span className="sm:hidden whitespace-nowrap">{step.short}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <span
                  className={cn(
                    'h-px w-3 sm:w-6 flex-shrink-0',
                    done ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
