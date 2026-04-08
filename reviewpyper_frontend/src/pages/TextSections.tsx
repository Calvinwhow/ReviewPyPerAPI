import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileType, Play, ArrowRight, CheckCircle, Layers, Tags } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { usePreprocessText, useLabelSections } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

const ARTICLE_TYPES = [{ value: 'research', label: 'Research Article' }, { value: 'review', label: 'Review Article' }, { value: 'case_report', label: 'Case Report' }, { value: 'clinical_trial', label: 'Clinical Trial' }];

export default function TextSections() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? '';
  const { getProject, getPipelineState, updatePipelineState } = useProjectState();
  const project = getProject(projectId);
  const pipeline = getPipelineState(projectId);
  const [articleType, setArticleType] = useState(settings.defaultArticleType);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isLabeling, setIsLabeling] = useState(false);
  const preprocessText = usePreprocessText();
  const labelSections = useLabelSections();

  const handlePreprocess = async () => { if (!pipeline.ocr_output_dir) return; setIsPreprocessing(true); try { const result = await preprocessText.mutateAsync({ input_dir: pipeline.ocr_output_dir }); updatePipelineState(projectId, { preprocessed_dir: result.preprocessed_dir }); } finally { setIsPreprocessing(false); } };
  const handleLabel = async () => { if (!pipeline.preprocessed_dir) return; setIsLabeling(true); try { const result = await labelSections.mutateAsync({ folder_path: pipeline.preprocessed_dir, article_type: articleType, api_key_path: pipeline.api_key_path ?? null, question: project?.research_question ?? null }); updatePipelineState(projectId, { json_dir: result.json_dir }); } finally { setIsLabeling(false); } };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><FileType className="h-7 w-7 text-primary-600" />Text & Sections</h1><p className="text-gray-500 mt-1">Preprocess text and label paper sections.</p></div>
      {!pipeline.ocr_output_dir && <Alert variant="warning">Complete PDF Processing (OCR) first.</Alert>}
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary-600" />Step 1: Preprocess Text</span></CardTitle></CardHeader>
        <CardBody>
          <div className="p-3 rounded-lg bg-gray-50 text-xs font-mono"><span className="text-gray-500">input_dir:</span> {pipeline.ocr_output_dir ?? 'not set'}</div>
          {pipeline.preprocessed_dir && <Alert variant="success" className="mt-4"><CheckCircle className="h-4 w-4 inline mr-1" />Preprocessed.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handlePreprocess} loading={isPreprocessing} disabled={!pipeline.ocr_output_dir || isPreprocessing} icon={<Play className="h-4 w-4" />}>Preprocess Text</Button></CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Tags className="h-5 w-5 text-primary-600" />Step 2: Label Sections</span></CardTitle><CardDescription>Identify methods, results, discussion, etc.</CardDescription></CardHeader>
        <CardBody className="space-y-4">
          <Select label="Article Type" options={ARTICLE_TYPES} value={articleType} onChange={e => setArticleType(e.target.value)} />
          {pipeline.json_dir && <Alert variant="success"><CheckCircle className="h-4 w-4 inline mr-1" />Sections labeled.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleLabel} loading={isLabeling} disabled={!pipeline.preprocessed_dir || isLabeling} icon={<Play className="h-4 w-4" />}>Label Sections</Button></CardFooter>
      </Card>
      <div className="flex justify-end"><Button size="lg" onClick={() => navigate('/inclusion')} disabled={!pipeline.json_dir} icon={<ArrowRight className="h-5 w-5" />}>Continue to Inclusion Evaluation</Button></div>
    </div>
  );
}
