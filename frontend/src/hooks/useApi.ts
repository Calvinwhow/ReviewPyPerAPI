import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { filesApi, pipelineApi } from '../services/api';
import {
  ScreenTitlesParams,
  ScreenAbstractsParams,
  DownloadPdfsParams,
  PostprocessPdfsParams,
  OcrPdfsParams,
  PreprocessTextParams,
  LabelSectionsParams,
  EvaluateInclusionParams,
  EvaluateExtractionParams,
  validateOrThrow,
} from '../services/schemas';

export function useServerProjects() {
  const config = useConfig();
  return useQuery({ queryKey: ['server-projects'], queryFn: () => filesApi.listProjects(config) });
}

export function useCreateServerProject() {
  const config = useConfig();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (name: string) => filesApi.createProject(config, name), onSuccess: () => qc.invalidateQueries({ queryKey: ['server-projects'] }) });
}

export function useDeleteServerProject() {
  const config = useConfig();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (projectId: string) => filesApi.deleteProject(config, projectId), onSuccess: () => qc.invalidateQueries({ queryKey: ['server-projects'] }) });
}

export function useUploadFile() {
  const config = useConfig();
  return useMutation({ mutationFn: ({ projectId, file, subfolder }: { projectId: string; file: File; subfolder?: string }) => filesApi.upload(config, projectId, file, subfolder) });
}

export function useProjectFiles(projectId: string | undefined, subfolder = '') {
  const config = useConfig();
  return useQuery({ queryKey: ['project-files', projectId, subfolder], queryFn: () => filesApi.list(config, projectId!, subfolder), enabled: !!projectId });
}

export function useSaveApiKey() {
  const config = useConfig();
  return useMutation({ mutationFn: ({ projectId, apiKey }: { projectId: string; apiKey: string }) => filesApi.saveApiKey(config, projectId, apiKey) });
}

export function useScreenTitles() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.screenTitles(config, validateOrThrow(ScreenTitlesParams, params)),
  });
}
export function useScreenAbstracts() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.screenAbstracts(config, validateOrThrow(ScreenAbstractsParams, params)),
  });
}
export function useDownloadPdfs() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.downloadPdfs(config, validateOrThrow(DownloadPdfsParams, params)),
  });
}
export function usePostprocessPdfs() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.postprocessPdfs(config, validateOrThrow(PostprocessPdfsParams, params)),
  });
}
export function useOcrPdfs() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.ocrPdfs(config, validateOrThrow(OcrPdfsParams, params)),
  });
}
export function usePreprocessText() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.preprocessText(config, validateOrThrow(PreprocessTextParams, params)),
  });
}
export function useLabelSections() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.labelSections(config, validateOrThrow(LabelSectionsParams, params)),
  });
}
export function useEvaluateInclusion() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.evaluateInclusion(config, validateOrThrow(EvaluateInclusionParams, params)),
  });
}
export function useEvaluateExtraction() {
  const config = useConfig();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      pipelineApi.evaluateExtraction(config, validateOrThrow(EvaluateExtractionParams, params)),
  });
}
export function useHealthCheck() { const config = useConfig(); return useQuery({ queryKey: ['health'], queryFn: () => pipelineApi.healthCheck(config), retry: false }); }
