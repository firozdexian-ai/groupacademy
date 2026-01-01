import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Link as LinkIcon, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
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

export function BatchTalentUpload({ onComplete }: BatchTalentUploadProps) {
  const [urlsInput, setUrlsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<BatchUpload | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);

  const parseCvUrls = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')));
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to upload CVs');
        setIsUploading(false);
        return;
      }

      // Create batch record
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

      // Start batch processing
      const { error: invokeError } = await supabase.functions.invoke('batch-parse-cvs', {
        body: { cvUrls: urls, batchId: batch.id }
      });

      if (invokeError) throw invokeError;

      toast.success(`Started processing ${urls.length} CVs`);
      
      // Start polling for progress
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
            onComplete?.();
          } else {
            toast.error('Batch processing failed');
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  }, [onComplete]);

  const getProgressPercentage = () => {
    if (!currentBatch || currentBatch.file_count === 0) return 0;
    const total = currentBatch.processed_count + currentBatch.skipped_count + currentBatch.failed_count;
    return Math.round((total / currentBatch.file_count) * 100);
  };

  const urlCount = parseCvUrls(urlsInput).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Batch CV Upload
        </CardTitle>
        <CardDescription>
          Upload multiple CVs at once. Paste public URLs (one per line). CVs parsed within 90 days will be skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cv-urls">CV URLs (one per line)</Label>
          <Textarea
            id="cv-urls"
            placeholder="https://example.com/cv1.pdf
https://example.com/cv2.pdf
https://storage.supabase.co/..."
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

            {currentBatch.status === 'completed' && currentBatch.failed_count > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowErrorLog(true)}
              >
                View Error Log
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={startBatchUpload} 
            disabled={isUploading || urlCount === 0}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {urlCount} CV{urlCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          
          {showProgress && currentBatch?.status === 'completed' && (
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProgress(false);
                setCurrentBatch(null);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          )}
        </div>
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
