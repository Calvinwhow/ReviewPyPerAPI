import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { BookOpen, FileText, FileCheck, FileDown, FileType, ClipboardCheck, FlaskConical, Settings2, Menu, X } from 'lucide-react';

const navSteps = [
  { step: 0, label: 'Setup Review', path: '/setup', icon: Settings2 },
  { step: 1, label: 'Title Screening', path: '/screening', icon: FileText },
  { step: 2, label: 'Abstract Screening', path: '/abstract-screening', icon: FileCheck },
  { step: 3, label: 'PDF Processing', path: '/pdfs', icon: FileDown },
  { step: 4, label: 'Text & Sections', path: '/text-sections', icon: FileType },
  { step: 5, label: 'Inclusion Eval', path: '/inclusion', icon: ClipboardCheck },
  { step: 6, label: 'Data Extraction', path: '/extraction', icon: FlaskConical },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white"><BookOpen className="h-5 w-5" /></div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">ReviewPyPer</h1>
          <p className="text-xs text-gray-500">Systematic Review</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navSteps.map(({ step, label, path, icon: Icon }) => {
          const active = location.pathname === path || (path === '/setup' && location.pathname === '/');
          return (
            <button key={step} onClick={() => { navigate(path); setMobileOpen(false); }}
              className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
              <span className={clsx('flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold flex-shrink-0',
                active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500')}>{step}</span>
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <button className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={clsx('fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform lg:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>{sidebar}</aside>
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">{sidebar}</aside>
    </>
  );
}
