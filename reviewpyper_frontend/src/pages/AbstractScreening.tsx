import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Play, ArrowRight, CheckCircle, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FileUpload from '../components/ui/FileUpload';
import Alert from '../components/ui/Alert';
import ProgressBar from '../components/ui/ProgressBar';
import { useUploadFile, useScreenAbstracts } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

const MAX_UPLOAD_MB = 500;

export default function AbstractScreening() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const [projectId] = useState(() => localStorage.getItem('reviewpyper_project_id') ?? '');
  const { getProject, getPipelineState, updatePipelineState } = useProjectState();
  const project = getProject(projectId);
  const pipeline = getPipelineState(projectId);
  const [keywords, setKeywords] = useState('');
  const [columnName, setColumnName] = useState('OpenAI_Screen');
  const [abstractsTxtPath, setAbstractsTxtPath] = useState(pipeline.abstracts_txt_path ?? '');
  const [isScreening, setIsScreening] = useState(false);
  const [uploadFraction, setUploadFraction] = useState<number | undefined>(undefined);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const uploadFile = useUploadFile();
  const screenAbstracts = useScreenAbstracts();

  const handleUploadAbstracts = useCallback(async (files: File[]) => {
    if (!files.length || !projectId) return;
    const file = files[0];
    setUploadFraction(0);
    setUploadedFile({ name: file.name, size: file.size });
    try {
      const result = await uploadFile.mutateAsync({
        projectId,
        file,
        onProgress: (f) => setUploadFraction(f),
      });
      setAbstractsTxtPath(result.path);
      updatePipelineState(projectId, { abstracts_txt_path: result.path });
    } finally {
      setUploadFraction(undefined);
    }
  }, [projectId, uploadFile, updatePipelineState]);

  const handleScreen = async () => {
    if (!pipeline.api_key_path || !pipeline.title_output_csv_path || !abstractsTxtPath) return;
    setIsScreening(true);
    try {
      const result = await screenAbstracts.mutateAsync({ api_key_path: pipeline.api_key_path, title_review_path: pipeline.title_output_csv_path, abstracts_txt_path: abstractsTxtPath, question: project?.research_question ?? '', column_name: columnName, model_choice: settings.defaultModel, keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined });
      updatePipelineState(projectId, { screened_abstract_path: result.screened_abstract_path, master_list_path: result.master_list_path });
    } finally { setIsScreening(false); }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          Step 03
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] flex items-center gap-3">
          <FileCheck className="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />
          Abstract Screening
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          Upload abstracts and screen them against the inclusion criteria established in title screening.
        </p>
      </header>
      {!pipeline.title_output_csv_path && <Alert variant="warning">Complete Title Screening first.</Alert>}
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary-600" />Upload Abstracts File</span></CardTitle></CardHeader>
        <CardBody>
          <FileUpload
            accept=".txt,.csv"
            onFiles={handleUploadAbstracts}
            label="Drop abstracts file here or click to browse"
            hint="TXT or CSV"
            maxSizeMB={MAX_UPLOAD_MB}
            disabled={uploadFile.isPending}
          />
          {uploadFile.isPending && uploadedFile && (
            <div className="mt-4" role="status" aria-live="polite">
              <ProgressBar
                value={uploadFraction}
                label={`Uploading ${uploadedFile.name} · ${
                  uploadFraction !== undefined ? `${Math.round(uploadFraction * 100)}%` : 'preparing…'
                }`}
              />
            </div>
          )}
          {abstractsTxtPath && !uploadFile.isPending && uploadedFile && (
            <Alert variant="success" className="mt-4">
              Uploaded <code className="text-xs font-mono">{uploadedFile.name}</code>{' '}
              <span className="text-gray-500">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </Alert>
          )}
          {uploadFile.isError && (
            <Alert variant="error" className="mt-4" title="Upload failed">
              {(uploadFile.error as Error)?.message ?? 'Unknown error'}
            </Alert>
          )}
        </CardBody>
      </Card>
      {pipeline.title_output_csv_path && abstractsTxtPath && (
        <Card>
          <CardHeader><CardTitle>Run Abstract Screening</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Column Name" value={columnName} onChange={e => setColumnName(e.target.value)} />
              <Input label="Keywords (optional)" placeholder="comma-separated" value={keywords} onChange={e => setKeywords(e.target.value)} />
            </div>
            {pipeline.master_list_path && <Alert variant="success" title="Complete"><CheckCircle className="h-4 w-4 inline mr-1" />Master list: <code className="text-xs">{pipeline.master_list_path.split('/').pop()}</code></Alert>}
          </CardBody>
          <CardFooter className="flex justify-end"><Button onClick={handleScreen} loading={isScreening} disabled={!pipeline.api_key_path || isScreening} icon={<Play className="h-4 w-4" />}>{isScreening ? 'Screening...' : 'Run Abstract Screening'}</Button></CardFooter>
        </Card>
      )}
      <div className="flex justify-end"><Button size="lg" onClick={() => navigate('/pdfs')} disabled={!pipeline.master_list_path} icon={<ArrowRight className="h-5 w-5" />}>Continue to PDF Processing</Button></div>
    </div>
  );
}
