import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Link, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SimpleFileUploadProps {
  onFileUploaded: (url: string) => void;
  onUrlProvided: (url: string) => void;
  currentValue?: string;
  accept?: string;
  maxSizeMB?: number;
}

type UploadMode = 'choose' | 'uploading' | 'url-input' | 'success' | 'error';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileUploaded,
  onUrlProvided,
  currentValue,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 10
}) => {
  const [mode, setMode] = useState<UploadMode>(currentValue ? 'success' : 'choose');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentValue || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const uploadFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMode('error');
      setErrorMessage(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setMode('uploading');
    setProgress(0);
    setStatusMessage('Starting upload...');
    setErrorMessage('');

    const fileName = `cv_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/portfolio-uploads/${fileName}`;

    console.log('[SimpleFileUpload] Starting XHR upload:', { fileName, size: file.size, type: file.type });

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Track upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setStatusMessage(`Uploading... ${percent}%`);
        console.log('[SimpleFileUpload] Progress:', percent + '%');
      }
    };

    xhr.onload = () => {
      console.log('[SimpleFileUpload] XHR onload, status:', xhr.status);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/portfolio-uploads/${fileName}`;
        console.log('[SimpleFileUpload] Upload success:', publicUrl);
        setUploadedUrl(publicUrl);
        setMode('success');
        setStatusMessage('Upload complete!');
        onFileUploaded(publicUrl);
      } else {
        console.error('[SimpleFileUpload] Upload failed:', xhr.status, xhr.responseText);
        setMode('error');
        setErrorMessage(`Upload failed (${xhr.status}). Try pasting a link instead.`);
      }
    };

    xhr.onerror = () => {
      console.error('[SimpleFileUpload] XHR error');
      setMode('error');
      setErrorMessage('Network error. Try pasting a Google Drive or Dropbox link instead.');
    };

    xhr.ontimeout = () => {
      console.error('[SimpleFileUpload] XHR timeout');
      setMode('error');
      setErrorMessage('Upload timed out. Try pasting a link instead.');
    };

    xhr.timeout = 120000; // 2 minutes timeout

    try {
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.send(file);
    } catch (err) {
      console.error('[SimpleFileUpload] XHR send error:', err);
      setMode('error');
      setErrorMessage('Failed to start upload. Try pasting a link instead.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      console.log('[SimpleFileUpload] Upload cancelled');
    }
    setMode('choose');
    setProgress(0);
    setStatusMessage('');
  };

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) {
      setErrorMessage('Please enter a valid URL');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
      setUploadedUrl(url);
      setMode('success');
      onUrlProvided(url);
    } catch {
      setErrorMessage('Please enter a valid URL (e.g., https://drive.google.com/...)');
    }
  };

  const handleReset = () => {
    setMode('choose');
    setProgress(0);
    setStatusMessage('');
    setErrorMessage('');
    setUrlInput('');
    setUploadedUrl('');
    onFileUploaded('');
  };

  // Choose mode - show upload and paste link options
  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload or drag & drop</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX (max {maxSizeMB}MB)</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setMode('url-input')}
        >
          <Link className="h-4 w-4 mr-2" />
          Paste Google Drive / Dropbox Link
        </Button>
      </div>
    );
  }

  // Uploading mode - show progress
  if (mode === 'uploading') {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{statusMessage}</p>
            <Progress value={progress} className="h-2 mt-2" />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel Upload
        </Button>
      </div>
    );
  }

  // URL input mode
  if (mode === 'url-input') {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://drive.google.com/file/..."
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setErrorMessage('');
            }}
            className={cn(errorMessage && "border-destructive")}
          />
          <Button type="button" onClick={handleUrlSubmit}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Use
          </Button>
        </div>
        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Paste a public link to your CV from Google Drive, Dropbox, or OneDrive
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMode('choose')}
        >
          ← Back to upload
        </Button>
      </div>
    );
  }

  // Error mode - show error with options
  if (mode === 'error') {
    return (
      <div className="space-y-3">
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Upload Failed</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode('choose')}
            className="flex-1"
          >
            Try Again
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setMode('url-input')}
            className="flex-1"
          >
            <Link className="h-4 w-4 mr-2" />
            Paste Link Instead
          </Button>
        </div>
      </div>
    );
  }

  // Success mode - show uploaded file
  if (mode === 'success') {
    return (
      <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">CV Added Successfully</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {uploadedUrl.includes('storage') ? 'Uploaded file' : 'External link'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
