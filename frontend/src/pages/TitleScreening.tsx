import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FileUpload from '../components/ui/FileUpload';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import { useUploadFile, useScreenTitles } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

export default function TitleScreening() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? '';
  const { getProject, getPipelineState, updatePipelineState } = useProjectState();
  const project = getProject(projectId);
  const pipeline = getPipelineState(projectId);
  const [keywords, setKeywords] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [uploadedPath, setUploadedPath] = useState(pipeline.csv_path ?? '');
  const [outputPath, setOutputPath] = useState(pipeline.title_output_csv_path ?? '');
  const uploadFile = useUploadFile();
  const screenTitles = useScreenTitles();

  const handleUpload = useCallback(async (files: File[]) => {
    if (!files.length || !projectId) return;
    const result = await uploadFile.mutateAsync({ projectId, file: files[0] });
    setUploadedPath(result.path);
    updatePipelineState(projectId, { csv_path: result.path });
  }, [projectId, uploadFile, updatePipelineState]);

  const handleScreen = async () => {
    if (!pipeline.api_key_path || !uploadedPath) return;
    setIsScreening(true);
    try {
      const result = await screenTitles.mutateAsync({ api_key_path: pipeline.api_key_path, csv_path: uploadedPath, question: project?.research_question ?? '', keywords_list: keywords ? keywords.split(',').map(k => k.trim()) : undefined, model_choice: settings.defaultModel });
      setOutputPath(result.output_csv_path);
      updatePipelineState(projectId, { title_output_csv_path: result.output_csv_path });
    } finally { setIsScreening(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-7 w-7 text-primary-600" />Title Screening</h1><p className="text-gray-500 mt-1">Upload a references CSV and screen titles using AI.</p></div>
      {!pipeline.api_key_path && <Alert variant="warning">Configure your API key in Setup first.</Alert>}
      <Card>
        <CardHeader><CardTitle>Upload References CSV</CardTitle><CardDescription>Upload the CSV file exported from your literature search.</CardDescription></CardHeader>
        <CardBody>
          <FileUpload accept=".csv" onFiles={handleUpload} label="Drop CSV file here" hint="CSV file from PubMed or other database export" />
          {uploadFile.isPending && <Spinner label="Uploading..." className="mt-4" />}
          {uploadedPath && !uploadFile.isPending && <Alert variant="success" className="mt-4">File uploaded: <code className="text-xs">{uploadedPath.split('/').pop()}</code></Alert>}
        </CardBody>
      </Card>
      {uploadedPath && (
        <Card>
          <CardHeader><CardTitle>Run Title Screening</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Keywords (comma-separated, optional)" placeholder="e.g., DBS, OCD" value={keywords} onChange={e => setKeywords(e.target.value)} />
            <div className="p-3 rounded-lg bg-gray-50 text-xs font-mono space-y-1">
              <div><span className="text-gray-500">csv_path:</span> {uploadedPath}</div>
              <div><span className="text-gray-500">question:</span> {project?.research_question ?? 'not set'}</div>
            </div>
            {outputPath && <Alert variant="success" title="Screening Complete"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Output: <code className="text-xs">{outputPath.split('/').pop()}</code></div></Alert>}
          </CardBody>
          <CardFooter className="flex justify-end"><Button onClick={handleScreen} loading={isScreening} disabled={!pipeline.api_key_path || isScreening} icon={<Play className="h-4 w-4" />}>{isScreening ? 'Screening...' : 'Run Title Screening'}</Button></CardFooter>
        </Card>
      )}
      <div className="flex justify-end"><Button size="lg" onClick={() => navigate('/abstract-screening')} disabled={!outputPath} icon={<ArrowRight className="h-5 w-5" />}>Continue to Abstract Screening</Button></div>
    </div>
  );
}
