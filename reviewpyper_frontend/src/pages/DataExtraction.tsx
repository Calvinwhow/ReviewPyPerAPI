import { useState } from 'react';
import { FlaskConical, Play, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useEvaluateExtraction } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

export default function DataExtraction() {
  const { settings } = useConfig();
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? '';
  const { getPipelineState, updatePipelineState } = useProjectState();
  const pipeline = getPipelineState(projectId);
  const [keysToConsider, setKeysToConsider] = useState<string[]>(['methods', 'results']);
  const [newKey, setNewKey] = useState('');
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [questionKey, setQuestionKey] = useState('');
  const [questionValue, setQuestionValue] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [answersBinary, setAnswersBinary] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const evaluateExtraction = useEvaluateExtraction();

  const addKey = () => { if (newKey && !keysToConsider.includes(newKey)) { setKeysToConsider([...keysToConsider, newKey]); setNewKey(''); } };
  const addQuestion = () => { if (questionKey && questionValue) { setQuestions({ ...questions, [questionKey]: questionValue }); setQuestionKey(''); setQuestionValue(''); } };

  const handleRun = async () => {
    if (!pipeline.api_key_path || !pipeline.inclusion_automated_csv_path || !pipeline.json_dir) return;
    setIsRunning(true);
    try {
      const result = await evaluateExtraction.mutateAsync({ api_key_path: pipeline.api_key_path, csv_path: pipeline.inclusion_automated_csv_path, json_file_path: pipeline.json_dir, keys_to_consider: keysToConsider, question: questions, model_choice: settings.defaultModel, test_mode: testMode, answers_binary: answersBinary, summary_type: settings.defaultSummaryType, master_list_path: pipeline.master_list_path ?? null });
      updatePipelineState(projectId, { extraction_json_path: result.evaluated_json_path, extraction_raw_csv_path: result.raw_csv_path, extraction_automated_csv_path: result.automated_csv_path });
    } finally { setIsRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><FlaskConical className="h-7 w-7 text-primary-600" />Data Extraction</h1><p className="text-gray-500 mt-1">Extract structured data from included papers.</p></div>
      {!pipeline.inclusion_automated_csv_path && <Alert variant="warning">Complete Inclusion Evaluation first.</Alert>}
      <Card>
        <CardHeader><CardTitle>Sections to Extract From</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">{keysToConsider.map(key => (<span key={key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">{key}<button onClick={() => setKeysToConsider(keysToConsider.filter(k => k !== key))} className="hover:text-danger-600"><Trash2 className="h-3 w-3" /></button></span>))}</div>
          <div className="flex items-end gap-2"><Input placeholder="e.g., discussion" value={newKey} onChange={e => setNewKey(e.target.value)} /><Button variant="secondary" onClick={addKey} icon={<Plus className="h-4 w-4" />}>Add</Button></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Extraction Questions</CardTitle><CardDescription>Key = field name, Value = question for the model.</CardDescription></CardHeader>
        <CardBody className="space-y-4">
          {Object.entries(questions).length > 0 && <div className="space-y-2">{Object.entries(questions).map(([key, val]) => (<div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div><span className="text-sm font-medium text-gray-900">{key}</span><p className="text-xs text-gray-500">{val}</p></div><button onClick={() => { const u = { ...questions }; delete u[key]; setQuestions(u); }} className="text-gray-400 hover:text-danger-600"><Trash2 className="h-3.5 w-3.5" /></button></div>))}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><Input label="Field Name" placeholder="sample_size" value={questionKey} onChange={e => setQuestionKey(e.target.value)} /><Input label="Question" placeholder="What was the sample size?" value={questionValue} onChange={e => setQuestionValue(e.target.value)} /></div>
          <Button variant="secondary" onClick={addQuestion} icon={<Plus className="h-4 w-4" />}>Add Question</Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Run Extraction</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">Test mode</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={answersBinary} onChange={e => setAnswersBinary(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">Binary answers</span></label>
          </div>
          {pipeline.extraction_raw_csv_path && <Alert variant="success"><CheckCircle className="h-4 w-4 inline mr-1" />Extraction complete.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleRun} loading={isRunning} disabled={!pipeline.api_key_path || !pipeline.inclusion_automated_csv_path || Object.keys(questions).length === 0 || isRunning} icon={<Play className="h-4 w-4" />}>{isRunning ? 'Extracting...' : 'Run Data Extraction'}</Button></CardFooter>
      </Card>
    </div>
  );
}
