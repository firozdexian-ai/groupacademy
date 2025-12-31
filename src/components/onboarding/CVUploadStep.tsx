import { useState, useCallback } from 'react';
import { FileText, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useTalent } from '@/hooks/useTalent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CVUploadStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function CVUploadStep({ onContinue, onSkip }: CVUploadStepProps) {
  const { talent, updateTalent } = useTalent();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(talent?.cvUrl || null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  async function handleUpload(file: File) {
    if (!talent?.id) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${talent.id}/cv.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-uploads')
        .getPublicUrl(filePath);

      setUploadedFile(publicUrl);
      await updateTalent({ cvUrl: publicUrl });
      toast.success('CV uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload CV');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        Upload Your CV
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        We'll use it to personalize job recommendations
      </p>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-6",
          isDragging && "border-primary bg-primary/5",
          uploadedFile && "border-success bg-success/5",
          !isDragging && !uploadedFile && "border-border hover:border-primary/50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-foreground font-medium">CV Uploaded!</p>
            <p className="text-sm text-muted-foreground">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                Drag & drop your CV here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF or Word • Max 5MB
            </p>
          </div>
        )}
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          disabled={isUploading}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Benefits */}
      <div className="w-full bg-muted/50 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Why upload your CV?</p>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>• Get personalized job matches</li>
              <li>• Auto-fill job applications</li>
              <li>• Better AI career advice</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full gap-3">
        <Button 
          size="lg" 
          onClick={onContinue}
          className="w-full"
        >
          Continue
        </Button>
        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
