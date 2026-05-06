import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, FileCheck, FileDown, FileType, ClipboardCheck, FlaskConical, Settings2, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const navSteps = [
  { step: 1, label: 'Setup Review',       path: '/setup',              icon: Settings2 },
  { step: 2, label: 'Title Screening',    path: '/screening',          icon: FileText },
  { step: 3, label: 'Abstract Screening', path: '/abstract-screening', icon: FileCheck },
  { step: 4, label: 'PDF Processing',     path: '/pdfs',               icon: FileDown },
  { step: 5, label: 'Text & Sections',    path: '/text-sections',      icon: FileType },
  { step: 6, label: 'Inclusion',          path: '/inclusion',          icon: ClipboardCheck },
  { step: 7, label: 'Data Extraction',    path: '/extraction',         icon: FlaskConical },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] px-6 py-6">
        <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
          ReviewPyPer
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
          v3
        </span>
      </div>
      <p className="px-6 pb-4 pt-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
        Pipeline
      </p>
      <nav aria-label="Pipeline navigation" className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {navSteps.map(({ step, label, path, icon: Icon }) => {
          const active = location.pathname === path || (path === '/setup' && location.pathname === '/');
          return (
            <button
              key={step}
              onClick={() => {
                navigate(path);
                setMobileOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
                active
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center font-mono text-[10px] font-semibold',
                  active
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)]',
                )}
                aria-hidden="true"
              >
                {String(step).padStart(2, '0')}
              </span>
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
        Automated systematic review
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 transform border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        {sidebar}
      </aside>
    </>
  );
}
