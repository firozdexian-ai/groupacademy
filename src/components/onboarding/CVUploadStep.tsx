import { useState, useCallback } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, Sparkles, User, Briefcase, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useTalent } from '@/hooks/useTalent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CVUploadStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  current_status?: string;
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  experience?: Array<{ company?: string; title?: string; description?: string }>;
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 20, message: 'Uploading your CV...' },
  { progress: 40, message: 'Reading document...' },
  { progress: 60, message: 'Extracting information...' },
  { progress: 80, message: 'Analyzing skills & experience...' },
  { progress: 95, message: 'Preparing your profile...' },
];

export function CVUploadStep({ onContinue, onSkip }: CVUploadStepProps) {
  const { talent, updateTalent } = useTalent();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(talent?.cvUrl || null);
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);

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

  const simulateProgress = () => {
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setParseProgress(PARSING_STAGES[stageIndex].progress);
        setParseMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return interval;
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
    setIsParsing(false);
    setParsedData(null);

    try {
      // Step 1: Upload file
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
      setIsUploading(false);
      setIsParsing(true);

      // Start progress simulation
      const progressInterval = simulateProgress();

      // Step 2: Call parse-cv edge function
      console.log('Calling parse-cv with URL:', publicUrl);
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-cv', {
        body: { cvUrl: publicUrl }
      });

      clearInterval(progressInterval);

      if (parseError) {
        console.error('Parse CV error:', parseError);
        // Still save the CV URL even if parsing fails
        await updateTalent({ cvUrl: publicUrl });
        toast.warning('CV uploaded but parsing failed. You can fill in details manually.');
        setIsParsing(false);
        return;
      }

      if (parseResult?.success && parseResult.parsed) {
        const parsed = parseResult.parsed as ParsedCVData;
        setParsedData(parsed);
        setParseProgress(100);
        setParseMessage('Profile ready!');

        // Auto-fill profile with parsed data
        const updateData: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        if (parsed.full_name && (!talent.fullName || talent.fullName === talent.email?.split('@')[0])) {
          updateData.fullName = parsed.full_name;
        }
        if (parsed.phone && !talent.phone) {
          updateData.phone = parsed.phone;
        }
        if (parsed.skills && parsed.skills.length > 0 && (!talent.skills || talent.skills.length === 0)) {
          updateData.skills = parsed.skills;
        }
        if (parsed.experience && parsed.experience.length > 0 && (!talent.experience || (talent.experience as any[]).length === 0)) {
          updateData.experience = parsed.experience.map(exp => ({
            company: exp.company || '',
            position: exp.title || '',
            description: exp.description || ''
          }));
        }
        if (parsed.education && parsed.education.length > 0 && (!talent.education || (talent.education as any[]).length === 0)) {
          updateData.education = parsed.education.map(edu => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.field || ''
          }));
        }

        await updateTalent(updateData);
        toast.success('CV parsed successfully! Your profile has been updated.');
      } else {
        await updateTalent({ cvUrl: publicUrl });
        toast.success('CV uploaded successfully!');
      }

      setIsParsing(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload CV');
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const renderParsedSummary = () => {
    if (!parsedData) return null;

    const stats = [];
    if (parsedData.skills && parsedData.skills.length > 0) {
      stats.push({ icon: Sparkles, label: `${parsedData.skills.length} skills` });
    }
    if (parsedData.experience && parsedData.experience.length > 0) {
      stats.push({ icon: Briefcase, label: `${parsedData.experience.length} experience` });
    }
    if (parsedData.education && parsedData.education.length > 0) {
      stats.push({ icon: GraduationCap, label: `${parsedData.education.length} education` });
    }

    if (stats.length === 0) return null;

    return (
      <div className="w-full mt-4 p-4 bg-success/10 border border-success/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold text-foreground">We found:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <stat.icon className="h-4 w-4" />
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        {parsedData.full_name && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{parsedData.full_name}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        Upload Your CV
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        We'll automatically fill your profile with your experience
      </p>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-full border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          (uploadedFile || parsedData) && "border-success bg-success/5",
          !isDragging && !uploadedFile && !parsedData && "border-border hover:border-primary/50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading your CV...</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="w-full max-w-[200px]">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{parseMessage}</p>
          </div>
        ) : uploadedFile || parsedData ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-foreground font-medium">CV Uploaded & Parsed!</p>
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
          disabled={isUploading || isParsing}
        />
      </div>

      {/* Parsed Data Summary */}
      {renderParsedSummary()}

      {/* Benefits */}
      {!parsedData && !isParsing && (
        <div className="w-full bg-muted/50 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Why upload your CV?</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Auto-fill your profile instantly</li>
                <li>• Get personalized job matches</li>
                <li>• Better AI career advice</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col w-full gap-3 mt-6">
        <Button 
          size="lg" 
          onClick={onContinue}
          className="w-full"
          disabled={isUploading || isParsing}
        >
          {parsedData ? 'Continue with Profile' : 'Continue'}
        </Button>
        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="text-muted-foreground"
          disabled={isUploading || isParsing}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
