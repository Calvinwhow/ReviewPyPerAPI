import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Play, ArrowRight, CheckCircle, Download, FileSearch, ScanText, Globe2, Library } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useDownloadPdfs, usePostprocessPdfs, useOcrPdfs } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';
import { cn } from '../lib/utils';

type RetrievalMode = 'oa' | 'oa_plus_scihub';

const RETRIEVAL_MODES: { value: RetrievalMode; label: string; description: string; icon: typeof Globe2 }[] = [
  { value: 'oa', label: 'Open Access only', description: 'PubMed + Unpaywall. Free, legal everywhere.', icon: Globe2 },
  { value: 'oa_plus_scihub', label: 'Include Sci-Hub fallback', description: 'Try OA first, then Sci-Hub for paywalled papers.', icon: Library },
];

export default function PdfProcessing() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const [projectId] = useState(() => localStorage.getItem('reviewpyper_project_id') ?? '');
  const { getPipelineState, updatePipelineState } = useProjectState();
  const pipeline = getPipelineState(projectId);
  const [email, setEmail] = useState('');
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>('oa');
  const allowScihub = retrievalMode === 'oa_plus_scihub';
  const [pdfDir, setPdfDir] = useState('PDFs');
  const [pageThreshold, setPageThreshold] = useState(String(settings.defaultPageThreshold));
  const [step, setStep] = useState<'download' | 'postprocess' | 'ocr' | 'done'>('download');
  const [isRunning, setIsRunning] = useState(false);
  const downloadPdfs = useDownloadPdfs();
  const postprocessPdfs = usePostprocessPdfs();
  const ocrPdfs = useOcrPdfs();

  const handleDownload = async () => { if (!pipeline.master_list_path) return; setIsRunning(true); try { const result = await downloadPdfs.mutateAsync({ csv_path: pipeline.master_list_path, email, allow_scihub: allowScihub }); updatePipelineState(projectId, { pdf_csv_path: result.csv_path }); setStep('postprocess'); } finally { setIsRunning(false); } };
  const handlePostprocess = async () => { if (!pipeline.master_list_path) return; setIsRunning(true); try { await postprocessPdfs.mutateAsync({ master_list_path: pipeline.master_list_path, pdf_dir: pdfDir }); updatePipelineState(projectId, { pdf_dir: pdfDir }); setStep('ocr'); } finally { setIsRunning(false); } };
  const handleOcr = async () => { if (!pipeline.master_list_path) return; setIsRunning(true); try { const result = await ocrPdfs.mutateAsync({ master_list_path: pipeline.master_list_path, page_threshold: parseInt(pageThreshold) }); updatePipelineState(projectId, { ocr_output_dir: result.output_dir }); setStep('done'); } finally { setIsRunning(false); } };

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Step 04</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] flex items-center gap-3"><FileDown className="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />PDF Processing</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">Download PDFs from PubMed (with optional Sci-Hub fallback), post-process, and OCR them.</p>
      </header>
      {!pipeline.master_list_path && <Alert variant="warning">Complete Abstract Screening first.</Alert>}
      <Card>
        <CardHeader>
          <CardTitle><span className="flex items-center gap-2"><Download className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />Step 1: Retrieve PDFs</span></CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <Input
            label="Email (for PubMed API)"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="NCBI requires an email. Used for rate-limit identification only."
          />

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">Retrieval source</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {RETRIEVAL_MODES.map((m) => {
                const selected = retrievalMode === m.value;
                const Icon = m.icon;
                return (
                  <label
                    key={m.value}
                    className={cn(
                      'cursor-pointer rounded-md border px-4 py-3 transition-colors',
                      'focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2',
                      selected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                    )}
                  >
                    <input
                      type="radio"
                      name="retrieval-mode"
                      value={m.value}
                      checked={selected}
                      onChange={() => setRetrievalMode(m.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-2">
                      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]')} aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="font-display text-sm font-semibold text-[var(--color-foreground)]">{m.label}</div>
                        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{m.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {pipeline.pdf_csv_path && (
            <Alert variant="success">
              <CheckCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />
              PDFs retrieved. Papers without an available copy were marked in the master list.
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleDownload}
            loading={isRunning && step === 'download'}
            disabled={!pipeline.master_list_path || !email || step !== 'download'}
            icon={<Play className="h-4 w-4" />}
          >
            {retrievalMode === 'oa' ? 'Retrieve OA PDFs' : 'Retrieve PDFs'}
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary-600" />Step 2: Post-process</span></CardTitle></CardHeader>
        <CardBody><Input label="PDF Directory" value={pdfDir} onChange={e => setPdfDir(e.target.value)} /></CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handlePostprocess} loading={isRunning && step === 'postprocess'} disabled={step !== 'postprocess'} icon={<Play className="h-4 w-4" />}>Post-process</Button></CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><ScanText className="h-5 w-5 text-primary-600" />Step 3: OCR</span></CardTitle></CardHeader>
        <CardBody>
          <Input label="Page Threshold" type="number" value={pageThreshold} onChange={e => setPageThreshold(e.target.value)} />
          {pipeline.ocr_output_dir && <Alert variant="success" className="mt-4"><CheckCircle className="h-4 w-4 inline mr-1" />OCR complete.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleOcr} loading={isRunning && step === 'ocr'} disabled={step !== 'ocr'} icon={<Play className="h-4 w-4" />}>Run OCR</Button></CardFooter>
      </Card>
      <div className="flex justify-end"><Button size="lg" onClick={() => navigate('/text-sections')} disabled={!pipeline.ocr_output_dir} icon={<ArrowRight className="h-5 w-5" />}>Continue to Text & Sections</Button></div>
    </div>
  );
}
