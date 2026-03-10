import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Link as LinkIcon, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchUpload {
  id: string;
  file_count: number;
  processed_count: number;
  skipped_count: number;
  failed_count: number;
  status: string;
  error_log: any[] | null;
  created_at: string;
  completed_at: string | null;
}

interface BatchTalentUploadProps {
  onComplete?: () => void;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function BatchTalentUpload({ onComplete }: BatchTalentUploadProps) {
  const [urlsInput, setUrlsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<BatchUpload | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCvUrls = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${file.name}: Not a PDF file`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files per batch`);
      setSelectedFiles(validFiles.slice(0, MAX_FILES));
    } else {
      setSelectedFiles(validFiles);
    }

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesAndProcess = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select PDF files to upload');
      return;
    }

    setUploadingFiles(true);
    setIsUploading(true);
    setShowProgress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to upload CVs');
        setIsUploading(false);
        setUploadingFiles(false);
        return;
      }

      // Upload files to storage and collect public URLs
      const urls: string[] = [];
      const uploadErrors: string[] = [];

      for (const file of selectedFiles) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${user.id}/${timestamp}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('talent-cvs')
          .upload(filePath, file, { contentType: 'application/pdf' });

        if (uploadError) {
          uploadErrors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('talent-cvs')
          .getPublicUrl(filePath);

        urls.push(publicUrlData.publicUrl);
      }

      if (uploadErrors.length > 0) {
        uploadErrors.forEach(err => toast.error(err));
      }

      if (urls.length === 0) {
        toast.error('No files were uploaded successfully');
        setIsUploading(false);
        setUploadingFiles(false);
        setShowProgress(false);
        return;
      }

      setUploadingFiles(false);

      // Create batch record and invoke edge function
      const { data: batch, error: batchError } = await supabase
        .from('batch_uploads')
        .insert({
          uploaded_by: user.id,
          file_count: urls.length,
          status: 'pending'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      setCurrentBatch(batch as BatchUpload);

      const { error: invokeError } = await supabase.functions.invoke('batch-parse-cvs', {
        body: { cvUrls: urls, batchId: batch.id }
      });

      if (invokeError) throw invokeError;

      toast.success(`Started processing ${urls.length} CVs from uploaded files`);
      pollBatchProgress(batch.id);

    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error.message || 'Failed to upload files');
      setIsUploading(false);
      setUploadingFiles(false);
      setShowProgress(false);
    }
  };

  const startBatchUpload = async () => {
    const urls = parseCvUrls(urlsInput);
    
    if (urls.length === 0) {
      toast.error('Please enter valid CV URLs (one per line)');
      return;
    }

    if (urls.length > 100) {
      toast.error('Maximum 100 CVs per batch');
      return;
    }

    setIsUploading(true);
    setShowProgress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to upload CVs');
        setIsUploading(false);
        return;
      }

      const { data: batch, error: batchError } = await supabase
        .from('batch_uploads')
        .insert({
          uploaded_by: user.id,
          file_count: urls.length,
          status: 'pending'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      setCurrentBatch(batch as BatchUpload);

      const { error: invokeError } = await supabase.functions.invoke('batch-parse-cvs', {
        body: { cvUrls: urls, batchId: batch.id }
      });

      if (invokeError) throw invokeError;

      toast.success(`Started processing ${urls.length} CVs`);
      pollBatchProgress(batch.id);

    } catch (error: any) {
      console.error('Batch upload error:', error);
      toast.error(error.message || 'Failed to start batch upload');
      setIsUploading(false);
      setShowProgress(false);
    }
  };

  const pollBatchProgress = useCallback(async (batchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: batch, error } = await supabase
          .from('batch_uploads')
          .select('*')
          .eq('id', batchId)
          .single();

        if (error) {
          console.error('Poll error:', error);
          return;
        }

        setCurrentBatch(batch as BatchUpload);

        if (batch.status === 'completed' || batch.status === 'failed') {
          clearInterval(pollInterval);
          setIsUploading(false);
          
          if (batch.status === 'completed') {
            toast.success(`Batch completed: ${batch.processed_count} processed, ${batch.skipped_count} skipped, ${batch.failed_count} failed`);
            setUrlsInput('');
            setSelectedFiles([]);
            onComplete?.();
          } else {
            toast.error('Batch processing failed');
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);

    setTimeout(() => clearInterval(pollInterval), 600000);
  }, [onComplete]);

  const getProgressPercentage = () => {
    if (!currentBatch || currentBatch.file_count === 0) return 0;
    const total = currentBatch.processed_count + currentBatch.skipped_count + currentBatch.failed_count;
    return Math.round((total / currentBatch.file_count) * 100);
  };

  const urlCount = parseCvUrls(urlsInput).length;

  const resetBatch = () => {
    setShowProgress(false);
    setCurrentBatch(null);
    setSelectedFiles([]);
    setUrlsInput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Batch CV Upload
        </CardTitle>
        <CardDescription>
          Upload multiple CVs at once via links or PDF files. Duplicates are automatically skipped (matched by email).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links" disabled={isUploading}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Paste Links
            </TabsTrigger>
            <TabsTrigger value="files" disabled={isUploading}>
              <FileUp className="w-4 h-4 mr-2" />
              Upload Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            <div>
              <Label htmlFor="cv-urls">CV URLs (one per line)</Label>
              <Textarea
                id="cv-urls"
                placeholder={"https://example.com/cv1.pdf\nhttps://example.com/cv2.pdf\nhttps://storage.supabase.co/..."}
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                rows={6}
                disabled={isUploading}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  <LinkIcon className="w-3 h-3 inline mr-1" />
                  {urlCount} valid URL{urlCount !== 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-muted-foreground">Max 100 per batch</p>
              </div>
            </div>
            <Button
              onClick={startBatchUpload}
              disabled={isUploading || urlCount === 0}
              className="w-full"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload {urlCount} CV{urlCount !== 1 ? 's' : ''}</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div>
              <Label>PDF Files (max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to select PDF files</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / (1024 * 1024)).toFixed(1)}MB
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => removeFile(idx)}
                        disabled={isUploading}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={uploadFilesAndProcess}
              disabled={isUploading || selectedFiles.length === 0}
              className="w-full"
            >
              {uploadingFiles ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading files...</>
              ) : isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload {selectedFiles.length} PDF{selectedFiles.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {showProgress && currentBatch && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">Batch Progress</span>
              <Badge variant={
                currentBatch.status === 'completed' ? 'default' :
                currentBatch.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {currentBatch.status}
              </Badge>
            </div>
            
            <Progress value={getProgressPercentage()} className="h-2" />
            
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{currentBatch.file_count} total</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{currentBatch.processed_count} done</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>{currentBatch.skipped_count} skipped</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{currentBatch.failed_count} failed</span>
              </div>
            </div>

            {currentBatch.status === 'completed' && (
              <div className="flex gap-2">
                {currentBatch.failed_count > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowErrorLog(true)}>
                    View Error Log
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={resetBatch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Batch
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Error Log Dialog */}
      <Dialog open={showErrorLog} onOpenChange={setShowErrorLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Error Log</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {(currentBatch?.error_log as any[])?.map((err, idx) => (
                <div key={idx} className="p-3 bg-destructive/10 rounded text-sm">
                  <p className="font-medium truncate">{err.url || err.email}</p>
                  <p className="text-muted-foreground">{err.error}</p>
                </div>
              )) || <p className="text-muted-foreground">No errors recorded</p>}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowErrorLog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
