import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Brain, CheckCircle, ArrowRight, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';
import { useCreateServerProject, useSaveApiKey } from '../hooks/useApi';

const REVIEW_TYPES = [
  { value: 'standard', label: 'Standard Systematic Review' },
  { value: 'rapid', label: 'Rapid Review' },
  { value: 'scoping', label: 'Scoping Review' },
];

export default function SetupReview() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const { getProject, createProject, setLLMConfig, updatePipelineState } = useProjectState();
  const [projectId, setProjectId] = useState<string | null>(() => localStorage.getItem('reviewpyper_project_id'));
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [reviewType, setReviewType] = useState(settings.defaultReviewType);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const createServerProject = useCreateServerProject();
  const saveApiKey = useSaveApiKey();

  useEffect(() => {
    if (projectId) {
      const project = getProject(projectId);
      if (project) { setName(project.name); setQuestion(project.research_question); setReviewType(project.review_type); }
    }
  }, [projectId, getProject]);

  const handleCreateProject = async () => {
    const serverProject = await createServerProject.mutateAsync(name);
    const id = serverProject.project_id;
    createProject(id, name, question, reviewType as 'standard' | 'rapid' | 'scoping');
    setProjectId(id);
    localStorage.setItem('reviewpyper_project_id', id);
  };

  const handleSaveApiKey = async () => {
    if (!projectId || !apiKey) return;
    const { api_key_path } = await saveApiKey.mutateAsync({ projectId, apiKey });
    setLLMConfig(projectId, { provider: 'openai', api_key: apiKey, model: settings.defaultModel, model_choice: settings.defaultModel });
    updatePipelineState(projectId, { api_key_path });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Settings2 className="h-7 w-7 text-primary-600" />Setup Review</h1>
        <p className="text-gray-500 mt-1">Configure your systematic review project.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Project Details</CardTitle><CardDescription>Define your review project and research question.</CardDescription></CardHeader>
        <CardBody className="space-y-4">
          <Input label="Project Name" placeholder="e.g., Deep Brain Stimulation for OCD" value={name} onChange={e => setName(e.target.value)} />
          <Textarea label="Research Question" placeholder="e.g., What is the effectiveness of..." rows={3} value={question} onChange={e => setQuestion(e.target.value)} />
          <Select label="Review Type" options={REVIEW_TYPES} value={reviewType} onChange={e => setReviewType(e.target.value)} />
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button onClick={handleCreateProject} loading={createServerProject.isPending} disabled={!name || !question || !!projectId} icon={projectId ? <CheckCircle className="h-4 w-4" /> : undefined}>
            {projectId ? 'Project Created' : 'Create Project'}
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary-600" />API Connection</span></CardTitle><CardDescription>Enter your API key to connect to the processing server.</CardDescription></CardHeader>
        <CardBody className="space-y-4">
          {!projectId && <Alert variant="info">Create a project first.</Alert>}
          <Input label="API Key" type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} icon={<Key className="h-4 w-4" />} />
          {saved && <Alert variant="success">API key saved and connected.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleSaveApiKey} loading={saveApiKey.isPending} disabled={!projectId || !apiKey}>Save API Key</Button></CardFooter>
      </Card>
      <div className="flex justify-end">
        <Button size="lg" onClick={() => navigate('/screening')} disabled={!projectId} icon={<ArrowRight className="h-5 w-5" />}>Continue to Title Screening</Button>
      </div>
    </div>
  );
}
