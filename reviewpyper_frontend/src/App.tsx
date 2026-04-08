import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ConfigProvider } from './hooks/useConfig';
import type { AppConfig } from './hooks/useConfig';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ui/Toast';
import { getErrorMessage } from './services/errorMessage';
import SetupReview from './pages/SetupReview';
import TitleScreening from './pages/TitleScreening';
import AbstractScreening from './pages/AbstractScreening';
import PdfProcessing from './pages/PdfProcessing';
import TextSections from './pages/TextSections';
import InclusionEvaluation from './pages/InclusionEvaluation';
import DataExtraction from './pages/DataExtraction';

function AppRoutes() {
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? undefined;
  return (
    <Routes>
      <Route element={<AppLayout projectId={projectId} />}>
        <Route path="/" element={<SetupReview />} />
        <Route path="/setup" element={<SetupReview />} />
        <Route path="/screening" element={<TitleScreening />} />
        <Route path="/abstract-screening" element={<AbstractScreening />} />
        <Route path="/pdfs" element={<PdfProcessing />} />
        <Route path="/text-sections" element={<TextSections />} />
        <Route path="/inclusion" element={<InclusionEvaluation />} />
        <Route path="/extraction" element={<DataExtraction />} />
      </Route>
    </Routes>
  );
}

/**
 * Builds a QueryClient whose query/mutation failures push toasts.
 * Created inside the provider tree so it can call useToast().
 */
function QueryProviderWithToasts({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
        queryCache: new QueryCache({
          onError: (err) => toast.error(getErrorMessage(err), 'Request failed'),
        }),
        mutationCache: new MutationCache({
          onError: (err) => toast.error(getErrorMessage(err), 'Action failed'),
        }),
      }),
    [toast],
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

interface AppProps { config: AppConfig; }

export default function App({ config }: AppProps) {
  return (
    <ErrorBoundary>
      <ConfigProvider value={config}>
        <ToastProvider>
          <QueryProviderWithToasts>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </QueryProviderWithToasts>
        </ToastProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
