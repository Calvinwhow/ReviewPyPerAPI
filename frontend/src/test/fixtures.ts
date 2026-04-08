import type { AppConfig } from '../hooks/useConfig';

export const testConfig: AppConfig = {
  testMode: false,
  settings: {
    defaultModel: 'gpt-4o',
    defaultReviewType: 'standard',
    defaultArticleType: 'rct',
    defaultPageThreshold: 10,
    defaultSummaryType: 'short',
  },
  endpoints: {
    createProject: { url: '/api/files/projects', method: 'POST', description: '' },
    listProjects: { url: '/api/files/projects', method: 'GET', description: '' },
    deleteProject: { url: '/api/files/projects/{projectId}', method: 'DELETE', description: '' },
    uploadFile: { url: '/api/files/upload/{projectId}', method: 'POST', description: '' },
    downloadFile: { url: '/api/files/download/{path}', method: 'GET', description: '' },
    listFiles: { url: '/api/files/list/{projectId}', method: 'GET', description: '' },
    deleteFile: { url: '/api/files/delete/{path}', method: 'DELETE', description: '' },
    saveApiKey: { url: '/api/files/apikey/{projectId}', method: 'POST', description: '' },
    getProjectState: { url: '/api/files/projects/{projectId}/state', method: 'GET', description: '' },
    putProjectState: { url: '/api/files/projects/{projectId}/state', method: 'PUT', description: '' },
    screenTitles: { url: '/api/pipeline/titles/screen', method: 'POST', description: '' },
    screenAbstracts: { url: '/api/pipeline/abstracts/screen', method: 'POST', description: '' },
    downloadPdfs: { url: '/api/pipeline/pdfs/download', method: 'POST', description: '' },
    postprocessPdfs: { url: '/api/pipeline/pdfs/postprocess', method: 'POST', description: '' },
    ocrPdfs: { url: '/api/pipeline/pdfs/ocr', method: 'POST', description: '' },
    preprocessText: { url: '/api/pipeline/text/preprocess', method: 'POST', description: '' },
    labelSections: { url: '/api/pipeline/sections/label', method: 'POST', description: '' },
    evaluateInclusion: { url: '/api/pipeline/inclusion/evaluate', method: 'POST', description: '' },
    evaluateExtraction: { url: '/api/pipeline/extraction/evaluate', method: 'POST', description: '' },
    healthCheck: { url: '/api/health', method: 'GET', description: '' },
  },
};
