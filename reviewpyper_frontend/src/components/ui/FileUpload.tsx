import { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps { accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; label?: string; hint?: string; maxSizeMB?: number; }

export default function FileUpload({ accept, multiple, onFiles, label = 'Drop files here', hint }: FileUploadProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(Array.from(e.target.files));
  }, [onFiles]);

  return (
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
      <Upload className="h-8 w-8 text-gray-400 mb-2" />
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {hint && <span className="text-xs text-gray-400 mt-1">{hint}</span>}
      <input type="file" className="hidden" accept={accept} multiple={multiple} onChange={handleChange} />
    </label>
  );
}
