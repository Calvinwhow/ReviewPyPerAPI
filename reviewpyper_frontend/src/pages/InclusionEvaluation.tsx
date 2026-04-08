import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Play, ArrowRight, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useEvaluateInclusion } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

export default function InclusionEvaluation() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? '';
  const { getPipelineState, updatePipelineState } = useProjectState();
  const pipeline = getPipelineState(projectId);
  const [keysToConsider, setKeysToConsider] = useState<string[]>(['methods', 'results']);
  const [newKey, setNewKey] = useState('');
  const [questions, setQuestions] = useState<Record<string, number>>({});
  const [questionKey, setQuestionKey] = useState('');
  const [questionValue, setQuestionValue] = useState('1');
  const [testMode, setTestMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const evaluateInclusion = useEvaluateInclusion();

  const addKey = () => { if (newKey && !keysToConsider.includes(newKey)) { setKeysToConsider([...keysToConsider, newKey]); setNewKey(''); } };
  const addQuestion = () => { if (questionKey) { setQuestions({ ...questions, [questionKey]: parseInt(questionValue) }); setQuestionKey(''); setQuestionValue('1'); } };

  const handleRun = async () => {
    if (!pipeline.api_key_path || !pipeline.json_dir) return;
    setIsRunning(true);
    try {
      const result = await evaluateInclusion.mutateAsync({ api_key_path: pipeline.api_key_path, json_file_path: pipeline.json_dir, keys_to_consider: keysToConsider, question: questions, model_choice: settings.defaultModel, test_mode: testMode, master_list_path: pipeline.master_list_path ?? null });
      updatePipelineState(projectId, { inclusion_json_path: result.evaluated_json_path, inclusion_raw_csv_path: result.raw_csv_path, inclusion_automated_csv_path: result.automated_csv_path });
    } finally { setIsRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><ClipboardCheck className="h-7 w-7 text-primary-600" />Inclusion Evaluation</h1><p className="text-gray-500 mt-1">Evaluate papers against inclusion/exclusion criteria.</p></div>
      {!pipeline.json_dir && <Alert variant="warning">Complete Text & Sections first.</Alert>}
      <Card>
        <CardHeader><CardTitle>Sections to Evaluate</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">{keysToConsider.map(key => (<span key={key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">{key}<button onClick={() => setKeysToConsider(keysToConsider.filter(k => k !== key))} className="hover:text-danger-600"><Trash2 className="h-3 w-3" /></button></span>))}</div>
          <div className="flex items-end gap-2"><Input placeholder="e.g., discussion" value={newKey} onChange={e => setNewKey(e.target.value)} /><Button variant="secondary" onClick={addKey} icon={<Plus className="h-4 w-4" />}>Add</Button></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Inclusion Questions</CardTitle><CardDescription>Define questions with binary scores.</CardDescription></CardHeader>
        <CardBody className="space-y-4">
          {Object.entries(questions).length > 0 && <div className="space-y-2">{Object.entries(questions).map(([key, val]) => (<div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><span className="text-sm text-gray-700">{key}</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-500">score: {val}</span><button onClick={() => { const u = { ...questions }; delete u[key]; setQuestions(u); }} className="text-gray-400 hover:text-danger-600"><Trash2 className="h-3.5 w-3.5" /></button></div></div>))}</div>}
          <div className="flex items-end gap-2"><Input label="Question" placeholder="Does the study use randomization?" value={questionKey} onChange={e => setQuestionKey(e.target.value)} className="flex-1" /><Input label="Score" type="number" value={questionValue} onChange={e => setQuestionValue(e.target.value)} className="w-20" /><Button variant="secondary" onClick={addQuestion} icon={<Plus className="h-4 w-4" />}>Add</Button></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Run Evaluation</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">Test mode (process subset)</span></label>
          {pipeline.inclusion_raw_csv_path && <Alert variant="success"><CheckCircle className="h-4 w-4 inline mr-1" />Inclusion evaluation complete.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleRun} loading={isRunning} disabled={!pipeline.api_key_path || !pipeline.json_dir || Object.keys(questions).length === 0 || isRunning} icon={<Play className="h-4 w-4" />}>{isRunning ? 'Evaluating...' : 'Run Inclusion Evaluation'}</Button></CardFooter>
      </Card>
      <div className="flex justify-end"><Button size="lg" onClick={() => navigate('/extraction')} disabled={!pipeline.inclusion_raw_csv_path} icon={<ArrowRight className="h-5 w-5" />}>Continue to Data Extraction</Button></div>
    </div>
  );
}
