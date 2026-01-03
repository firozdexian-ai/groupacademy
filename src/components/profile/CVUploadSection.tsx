import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface ParsedCVData {
  fullName?: string;
  phone?: string;
  email?: string;
  education?: any[];
  experience?: any[];
  skills?: any[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  achievements?: any[];
  profileType?: string;
  currentStatus?: string;
  institution?: string;
  fieldOfStudy?: string;
  customProfession?: string;
  professionCategoryId?: string;
}

const PARSING_STAGES = [
  { progress: 0, message: "Uploading CV..." },
  { progress: 20, message: "Reading document..." },
  { progress: 40, message: "Extracting information..." },
  { progress: 60, message: "Analyzing experience and skills..." },
  { progress: 80, message: "Matching profession category..." },
  { progress: 95, message: "Updating your profile..." },
];

export function CVUploadSection() {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const hasCV = !!talent?.cvUrl;

  const simulateProgress = () => {
    let stage = 0;
    const interval = setInterval(() => {
      if (stage < PARSING_STAGES.length - 1) {
        stage++;
        setCurrentStage(stage);
        setUploadProgress(PARSING_STAGES[stage].progress);
      } else {
        clearInterval(interval);
      }
    }, 2000);
    return interval;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setCurrentStage(0);

    const progressInterval = simulateProgress();

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${talent?.id || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("CV upload error:", uploadError);
        throw new Error(`Failed to upload CV: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('portfolio-uploads')
        .getPublicUrl(filePath);

      const cvUrl = urlData?.publicUrl;

      // Call parse-cv edge function
      setCurrentStage(2);
      setUploadProgress(40);

      const { data: parseData, error: parseError } = await supabase.functions
        .invoke('parse-cv', {
          body: { cvUrl }
        });

      if (parseError) throw parseError;

      clearInterval(progressInterval);
      setCurrentStage(5);
      setUploadProgress(95);

      // Update talent profile with parsed data
      if (parseData?.success && parseData?.parsedData) {
        const parsed: ParsedCVData = parseData.parsedData;
        
        const updateData: any = {
          cvUrl,
          cvParsedAt: new Date().toISOString(),
        };

        // Only update fields that were parsed and are not empty
        if (parsed.fullName) updateData.fullName = parsed.fullName;
        if (parsed.phone) updateData.phone = parsed.phone;
        if (parsed.education && parsed.education.length > 0) updateData.education = parsed.education;
        if (parsed.experience && parsed.experience.length > 0) updateData.experience = parsed.experience;
        if (parsed.skills && parsed.skills.length > 0) updateData.skills = parsed.skills;
        if (parsed.linkedinUrl) updateData.linkedinUrl = parsed.linkedinUrl;
        if (parsed.customProfession) updateData.customProfession = parsed.customProfession;
        if (parsed.professionCategoryId) updateData.professionCategoryId = parsed.professionCategoryId;
        if (parsed.achievements && parsed.achievements.length > 0) updateData.achievements = parsed.achievements;

        await updateTalent(updateData);
        await refreshTalent();

        setUploadProgress(100);
        toast.success("CV uploaded and profile updated!", {
          description: "Your information has been extracted and saved."
        });
      } else {
        // Even if parsing failed partially, save the CV URL
        await updateTalent({ cvUrl, cvParsedAt: new Date().toISOString() });
        await refreshTalent();
        
        toast.success("CV uploaded!", {
          description: "We couldn't extract all details, but your CV is saved."
        });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("CV upload error:", err);
      setError(err.message || "Failed to process CV. Please try again.");
      toast.error("Failed to process CV", {
        description: err.message || "Please try again or contact support."
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload CV
            </CardTitle>
            <CardDescription>
              Upload your CV to auto-fill your profile information
            </CardDescription>
          </div>
          {hasCV && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              CV on file
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{PARSING_STAGES[currentStage]?.message}</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              This may take up to 30 seconds...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Upload failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : hasCV ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="font-medium">CV uploaded</p>
                <p className="text-sm text-muted-foreground">
                  Your profile has been populated from your CV
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New CV
              </Button>
              {talent?.cvUrl && (
                <Button variant="outline" asChild>
                  <a href={talent.cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Click to upload your CV</p>
            <p className="text-sm text-muted-foreground mb-3">
              PDF or Word document, max 5MB
            </p>
            <Button variant="secondary" size="sm">
              Select File
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your CV will be parsed to auto-fill your education, experience, and skills
        </p>
      </CardContent>
    </Card>
  );
}
