import axios from 'axios';
import type { AppConfig } from '../hooks/useConfig';
import { resolveEndpoint } from '../hooks/useConfig';
import type { ProjectInfo, FileInfo, UploadResponse, TitleScreenResponse, AbstractScreenResponse, PdfDownloadResponse, PdfPostProcessResponse, PdfOcrResponse, TextPreprocessResponse, SectionLabelResponse, InclusionEvaluateResponse, ExtractionEvaluateResponse } from '../types';

const http = axios.create();

export const filesApi = {
  createProject: (config: AppConfig, name: string) => {
    const form = new FormData();
    form.append('name', name);
    return http.post<ProjectInfo>(resolveEndpoint(config, 'createProject'), form).then(r => r.data);
  },
  listProjects: (config: AppConfig) => http.get<ProjectInfo[]>(resolveEndpoint(config, 'listProjects')).then(r => r.data),
  deleteProject: (config: AppConfig, projectId: string) => http.delete(resolveEndpoint(config, 'deleteProject', { projectId })).then(r => r.data),
  upload: (config: AppConfig, projectId: string, file: File, subfolder = '') => {
    const form = new FormData();
    form.append('file', file);
    form.append('subfolder', subfolder);
    return http.post<UploadResponse>(resolveEndpoint(config, 'uploadFile', { projectId }), form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  download: (config: AppConfig, path: string) => http.get(resolveEndpoint(config, 'downloadFile', { path }), { responseType: 'blob' }).then(r => r.data),
  list: (config: AppConfig, projectId: string, subfolder = '') => http.get<FileInfo[]>(resolveEndpoint(config, 'listFiles', { projectId }), { params: { subfolder } }).then(r => r.data),
  delete: (config: AppConfig, path: string) => http.delete(resolveEndpoint(config, 'deleteFile', { path })).then(r => r.data),
  saveApiKey: (config: AppConfig, projectId: string, apiKey: string) => {
    const form = new FormData();
    form.append('api_key', apiKey);
    return http.post<{ api_key_path: string }>(resolveEndpoint(config, 'saveApiKey', { projectId }), form).then(r => r.data);
  },
  getProjectState: <T = Record<string, unknown>>(config: AppConfig, projectId: string) =>
    http.get<T>(resolveEndpoint(config, 'getProjectState', { projectId })).then(r => r.data),
  putProjectState: <T extends Record<string, unknown>>(config: AppConfig, projectId: string, state: T) =>
    http.put<T>(resolveEndpoint(config, 'putProjectState', { projectId }), state).then(r => r.data),
};

export const pipelineApi = {
  screenTitles: (config: AppConfig, params: Record<string, unknown>) => http.post<TitleScreenResponse>(resolveEndpoint(config, 'screenTitles'), params).then(r => r.data),
  screenAbstracts: (config: AppConfig, params: Record<string, unknown>) => http.post<AbstractScreenResponse>(resolveEndpoint(config, 'screenAbstracts'), params).then(r => r.data),
  downloadPdfs: (config: AppConfig, params: Record<string, unknown>) => http.post<PdfDownloadResponse>(resolveEndpoint(config, 'downloadPdfs'), params).then(r => r.data),
  postprocessPdfs: (config: AppConfig, params: Record<string, unknown>) => http.post<PdfPostProcessResponse>(resolveEndpoint(config, 'postprocessPdfs'), params).then(r => r.data),
  ocrPdfs: (config: AppConfig, params: Record<string, unknown>) => http.post<PdfOcrResponse>(resolveEndpoint(config, 'ocrPdfs'), params).then(r => r.data),
  preprocessText: (config: AppConfig, params: Record<string, unknown>) => http.post<TextPreprocessResponse>(resolveEndpoint(config, 'preprocessText'), params).then(r => r.data),
  labelSections: (config: AppConfig, params: Record<string, unknown>) => http.post<SectionLabelResponse>(resolveEndpoint(config, 'labelSections'), params).then(r => r.data),
  evaluateInclusion: (config: AppConfig, params: Record<string, unknown>) => http.post<InclusionEvaluateResponse>(resolveEndpoint(config, 'evaluateInclusion'), params).then(r => r.data),
  evaluateExtraction: (config: AppConfig, params: Record<string, unknown>) => http.post<ExtractionEvaluateResponse>(resolveEndpoint(config, 'evaluateExtraction'), params).then(r => r.data),
  healthCheck: (config: AppConfig) => http.get(resolveEndpoint(config, 'healthCheck')).then(r => r.data),
};
