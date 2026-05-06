import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import PipelineStepper from '../PipelineStepper';
import { useProjectState } from '../../hooks/useProjectState';

interface AppLayoutProps {
  projectId?: string;
}

export default function AppLayout({ projectId }: AppLayoutProps) {
  const { getProject, getPipelineState } = useProjectState();
  const project = projectId ? getProject(projectId) : undefined;
  const pipeline = projectId ? getPipelineState(projectId) : {};

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-baseline gap-4 pl-12 lg:pl-0 min-w-0">
              {project ? (
                <>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-foreground)] truncate">
                    {project.name}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] flex-shrink-0">
                    {project.review_type} review
                  </span>
                </>
              ) : (
                <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  New Review
                </h2>
              )}
            </div>
            {project && (
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)] flex-shrink-0">
                {new Date(project.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
          <PipelineStepper pipeline={pipeline} />
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-8 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
