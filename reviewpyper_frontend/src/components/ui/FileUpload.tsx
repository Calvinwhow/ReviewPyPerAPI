import { useCallback, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Upload, FileWarning } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  maxSizeMB?: number;
  /** Disable the dropzone (e.g. while an upload is in flight). */
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function FileUpload({
  accept,
  multiple,
  onFiles,
  label = 'Drop files here or click to browse',
  hint,
  maxSizeMB,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (files: File[]): { ok: File[]; reason?: string } => {
      if (!files.length) return { ok: [] };
      if (maxSizeMB) {
        const limit = maxSizeMB * 1024 * 1024;
        const oversized = files.find((f) => f.size > limit);
        if (oversized) {
          return {
            ok: [],
            reason: `${oversized.name} is ${formatBytes(oversized.size)} — exceeds the ${maxSizeMB} MB limit.`,
          };
        }
      }
      return { ok: files };
    },
    [maxSizeMB],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      setError(null);
      const result = validate(files);
      if (result.reason) {
        setError(result.reason);
        return;
      }
      if (result.ok.length) onFiles(result.ok);
    },
    [validate, onFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(Array.from(e.target.files));
      // reset so picking the same file twice still triggers onChange
      e.target.value = '';
    },
    [handleFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, handleFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled],
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={hint || error ? 'file-upload-hint' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed border-gray-300',
          !disabled && dragActive && 'border-primary-500 bg-primary-50',
          !disabled && !dragActive && 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer',
          error && 'border-danger-400',
        )}
      >
        <Upload className={clsx('h-8 w-8 mb-2', dragActive ? 'text-primary-600' : 'text-gray-400')} aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && (
          <span id="file-upload-hint" className="text-xs text-gray-500 mt-1">
            {hint}
            {maxSizeMB ? ` · max ${maxSizeMB} MB` : ''}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-danger-700">
          <FileWarning className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
