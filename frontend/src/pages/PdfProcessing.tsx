import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Play, ArrowRight, CheckCircle, Download, FileSearch, ScanText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useDownloadPdfs, usePostprocessPdfs, useOcrPdfs } from '../hooks/useApi';
import { useProjectState } from '../hooks/useProjectState';
import { useConfig } from '../hooks/useConfig';

export default function PdfProcessing() {
  const navigate = useNavigate();
  const { settings } = useConfig();
  const projectId = localStorage.getItem('reviewpyper_project_id') ?? '';
  const { getPipelineState, updatePipelineState } = useProjectState();
  const pipeline = getPipelineState(projectId);
  const [email, setEmail] = useState('');
  const [allowScihub, setAllowScihub] = useState(true);
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
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><FileDown className="h-7 w-7 text-primary-600" />PDF Processing</h1><p className="text-gray-500 mt-1">Download, post-process, and OCR PDFs.</p></div>
      {!pipeline.master_list_path && <Alert variant="warning">Complete Abstract Screening first.</Alert>}
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Download className="h-5 w-5 text-primary-600" />Step 1: Download PDFs</span></CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email (for PubMed API)" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" checked={allowScihub} onChange={e => setAllowScihub(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">Allow Sci-Hub fallback</span></label>
          </div>
          {pipeline.pdf_csv_path && <Alert variant="success"><CheckCircle className="h-4 w-4 inline mr-1" />PDFs downloaded.</Alert>}
        </CardBody>
        <CardFooter className="flex justify-end"><Button onClick={handleDownload} loading={isRunning && step === 'download'} disabled={!pipeline.master_list_path || !email || step !== 'download'} icon={<Play className="h-4 w-4" />}>Download PDFs</Button></CardFooter>
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
