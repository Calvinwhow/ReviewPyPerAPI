import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useProjectState } from '../../hooks/useProjectState';

interface AppLayoutProps { projectId?: string; }

export default function AppLayout({ projectId }: AppLayoutProps) {
  const { getProject } = useProjectState();
  const project = projectId ? getProject(projectId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3 pl-12 lg:pl-0">
              {project ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium capitalize">{project.review_type}</span>
                </>
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">ReviewPyPer</h2>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {project && <span>Created {new Date(project.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </header>
        <main className="p-6 max-w-6xl mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
