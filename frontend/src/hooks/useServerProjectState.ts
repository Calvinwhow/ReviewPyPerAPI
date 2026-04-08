import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { filesApi } from '../services/api';
import type { Project, PipelineState } from '../types';

/**
 * Server-backed project state.
 *
 * Source of truth lives in the project folder on the gateway as state.json.
 * The frontend's old `useProjectState` hook is kept for backwards compat —
 * pages can migrate to this hook one at a time.
 *
 * Returns React Query state for `project` plus a `patchPipeline` helper that
 * does an optimistic update + PUT.
 */
export function useServerProjectState(projectId: string | undefined) {
  const config = useConfig();
  const qc = useQueryClient();
  const key = ['project-state', projectId] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: () => filesApi.getProjectState<Project>(config, projectId!),
    enabled: !!projectId,
  });

  const putState = useMutation({
    mutationFn: (state: Project) => filesApi.putProjectState(config, projectId!, state as unknown as Record<string, unknown>) as Promise<Project>,
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Project>(key);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });

  function patchPipeline(patch: Partial<PipelineState>) {
    const current = query.data;
    if (!current) return;
    putState.mutate({
      ...current,
      pipeline_state: { ...(current.pipeline_state ?? {}), ...patch },
    });
  }

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
    putState: putState.mutate,
    patchPipeline,
    isSaving: putState.isPending,
  };
}
