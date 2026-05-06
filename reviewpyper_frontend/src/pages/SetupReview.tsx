import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, CheckCircle2, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';
import { useCreateServerProject, useSaveApiKey } from '../hooks/useApi';
import { PROJECT_ID_STORAGE_KEY } from '../lib/utils';

const REVIEW_TYPES = [
  { value: 'standard', label: 'Standard Systematic Review' },
  { value: 'rapid', label: 'Rapid Review' },
  { value: 'scoping', label: 'Scoping Review' },
];

export default function SetupReview() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const { getProject, createProject, setLLMConfig, updatePipelineState } = useProjectState();

  // Lazy init from localStorage so render stays pure.
  const [projectId, setProjectId] = useState<string | null>(() =>
    localStorage.getItem(PROJECT_ID_STORAGE_KEY),
  );
  const existing = projectId ? getProject(projectId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [question, setQuestion] = useState(existing?.research_question ?? '');
  const [reviewType, setReviewType] = useState(existing?.review_type ?? settings.defaultReviewType);
  const [userApiKey, setUserApiKey] = useState('');

  const createServerProject = useCreateServerProject();
  const saveApiKey = useSaveApiKey();

  const handleCreateProject = async () => {
    const serverProject = await createServerProject.mutateAsync(name);
    const id = serverProject.project_id;
    createProject(id, name, question, reviewType as 'standard' | 'rapid' | 'scoping');
    setProjectId(id);
    localStorage.setItem(PROJECT_ID_STORAGE_KEY, id);

    // Server-managed key path takes priority (ReviewPyPer service has its own credits).
    if (serverProject.api_key_path) {
      setLLMConfig(id, {
        provider: 'openai',
        api_key: '(server-managed)',
        model: settings.defaultModel,
        model_choice: settings.defaultModel,
      });
      updatePipelineState(id, { api_key_path: serverProject.api_key_path });
    } else if (userApiKey) {
      const result = await saveApiKey.mutateAsync({ projectId: id, apiKey: userApiKey });
      setLLMConfig(id, {
        provider: 'openai',
        api_key: '(saved)',
        model: settings.defaultModel,
        model_choice: settings.defaultModel,
      });
      updatePipelineState(id, { api_key_path: result.api_key_path });
    }
  };

  const isManaged = !!existing && existing.llm_config?.api_key === '(server-managed)';
  const canSubmit = !!name && !!question && !projectId;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          Step 01
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] flex items-center gap-3">
          <Settings2 className="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />
          Setup Review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          Define a research question and review type. ReviewPyPer will run the full
          screening &amp; extraction pipeline against your corpus.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
          <CardDescription>The research question and review type drive every downstream step.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Project name"
            placeholder="e.g. Deep Brain Stimulation for Treatment-Resistant OCD"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Research question"
            placeholder="e.g. What is the effectiveness of DBS for treatment-resistant OCD?"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            hint="Stated as a PICO question if possible — population, intervention, comparator, outcome."
          />
          <Select
            label="Review type"
            options={REVIEW_TYPES}
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API access</CardTitle>
          <CardDescription>How ReviewPyPer will reach the screening model.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          {!projectId && (
            <Alert variant="info" title="Credits managed for you">
              <p>
                Your ReviewPyPer account has credits available — the API key is provided
                automatically when you create the project. You can override with your own key below.
              </p>
            </Alert>
          )}

          {!projectId && (
            <Input
              label="Override with your own key (optional)"
              type="password"
              placeholder="sk-…"
              icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              hint="Leave blank to use credits provided with your ReviewPyPer account."
            />
          )}

          {isManaged && (
            <Alert variant="success" title="Credits active">
              Using server-managed API credits.
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleCreateProject}
            loading={createServerProject.isPending || saveApiKey.isPending}
            disabled={!canSubmit}
            icon={projectId ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          >
            {projectId ? 'Project Created' : 'Create Project'}
          </Button>
        </CardFooter>
      </Card>

      {projectId && (
        <Alert variant="success">
          Project created — continue to title screening to upload your references CSV.
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => navigate('/screening')}
          disabled={!projectId}
          icon={<ArrowRight className="h-5 w-5" />}
        >
          Continue to Title Screening
        </Button>
      </div>
    </div>
  );
}
