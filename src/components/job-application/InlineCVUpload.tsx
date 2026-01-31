import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InlineCVUploadProps {
  onUploadComplete?: () => void;
}

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: any[];
  experience?: any[];
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 15, message: "Uploading CV..." },
  { progress: 35, message: "Reading document..." },
  { progress: 55, message: "Extracting profile..." },
  { progress: 75, message: "Analyzing skills..." },
  { progress: 90, message: "Updating profile..." },
];

export function InlineCVUpload({ onUploadComplete }: InlineCVUploadProps) {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const hasCV = !!talent?.cvUrl;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading && !isParsing) setIsDragging(true);
  }, [isUploading, isParsing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading || isParsing) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [isUploading, isParsing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const simulateProgress = () => {
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setProgress(PARSING_STAGES[stageIndex].progress);
        setMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return interval;
  };

  const processFile = async (file: File) => {
    if (!talent?.id) {
      toast.error("Please sign in to upload your CV");
      return;
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setIsParsing(false);
    setError(null);
    setUploadSuccess(false);
    setProgress(0);
    setMessage("Uploading CV...");

    const progressInterval = simulateProgress();

    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/cv.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolio-uploads")
        .getPublicUrl(filePath);

      setIsUploading(false);
      setIsParsing(true);

      // Parse CV
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      clearInterval(progressInterval);

      if (parseError) {
        // Fallback: save URL only
        await updateTalent({ cvUrl: publicUrl });
        await refreshTalent();
        setProgress(100);
        setMessage("CV uploaded!");
        setUploadSuccess(true);
        toast.success("CV uploaded successfully!");
        onUploadComplete?.();
        return;
      }

      if (parseResult?.success && parseResult.parsed) {
        const parsed = parseResult.parsed as ParsedCVData;
        
        const updateData: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        // Intelligent merge - only update empty fields
        if (parsed.full_name && (!talent.fullName || talent.fullName === talent.email?.split("@")[0])) {
          updateData.fullName = parsed.full_name;
        }
        if (parsed.phone && !talent.phone) updateData.phone = parsed.phone;
        if (parsed.skills?.length && !talent.skills?.length) updateData.skills = parsed.skills;

        if (parsed.experience?.length && (!talent.experience || (talent.experience as any[]).length === 0)) {
          updateData.experience = parsed.experience.map((exp) => ({
            company: exp.company || "",
            position: exp.title || "",
            description: exp.description || "",
          }));
        }

        if (parsed.education?.length && (!talent.education || (talent.education as any[]).length === 0)) {
          updateData.education = parsed.education.map((edu) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.field || "",
          }));
        }

        await updateTalent(updateData);
        await refreshTalent();

        setProgress(100);
        setMessage("Profile updated!");
        setUploadSuccess(true);
        toast.success("CV parsed and profile updated!");
        onUploadComplete?.();
      } else {
        await updateTalent({ cvUrl: publicUrl });
        await refreshTalent();
        setProgress(100);
        setMessage("CV uploaded!");
        setUploadSuccess(true);
        toast.success("CV uploaded successfully!");
        onUploadComplete?.();
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("[InlineCVUpload] Error:", err);
      setError(err.message || "Upload failed. Please try again.");
      toast.error("Failed to upload CV");
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const isProcessing = isUploading || isParsing;

  // Already has CV - show success state
  if (hasCV && !isProcessing && !error) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-background flex items-center justify-center border">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Current Resume</p>
            <p className="text-xs text-muted-foreground">Ready to send</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            Change
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-xs text-muted-foreground truncate">{error}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setError(null);
              fileInputRef.current?.click();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="p-4 bg-primary/5 border rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          {isParsing ? (
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          This may take up to 30 seconds...
        </p>
      </div>
    );
  }

  // Just completed upload
  if (uploadSuccess) {
    return (
      <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-success">CV Uploaded!</p>
            <p className="text-xs text-muted-foreground">Your profile has been updated</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => {
            setUploadSuccess(false);
            fileInputRef.current?.click();
          }}
        >
          Change
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // Empty state - upload prompt (this is what shows when user has no CV)
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
        isDragging && "border-primary bg-primary/5 scale-[1.01]",
        !isDragging && "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Upload your CV to apply</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF or Word • Max 5MB • Auto-fills profile
          </p>
        </div>
        <Button variant="secondary" size="sm" className="mt-2">
          Select File
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
