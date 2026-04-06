import { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface ProfessionCategory {
  id: string;
  name: string;
}

const PARSING_STAGES = [
  { progress: 20, message: "Uploading your CV..." },
  { progress: 40, message: "Reading document..." },
  { progress: 60, message: "Extracting information..." },
  { progress: 80, message: "Analyzing skills & experience..." },
  { progress: 95, message: "Preparing your profile..." },
];

export function CVUploadStep({ onContinue, onSkip }: CVUploadStepProps) {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(talent?.cvUrl || null);
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [parseComplete, setParseComplete] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Profession Category State
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(talent?.professionCategoryId || "none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("profession_categories").select("id, name").order("name");

      if (!error && data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isUploading && !isParsing) setIsDragging(true);
    },
    [isUploading, isParsing],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isUploading || isParsing) return;
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [isUploading, isParsing],
  );

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

    // START LOADING IMMEDIATELY
    setIsUploading(true);
    setIsParsing(false);
    setParsedData(null);
    setParseComplete(false);
    setParseError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/cv.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      setUploadedFile(publicUrl);
      setIsUploading(false); // Done uploading
      setIsParsing(true); // Start parsing UI

      const progressInterval = simulateProgress();

      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      clearInterval(progressInterval);

      if (parseError) {
        // Fallback: save URL only
        await updateTalent({ cvUrl: publicUrl });
        setParseError("Uploaded successfully (Auto-fill unavailable)");
        toast.warning("CV uploaded. Please fill details manually.");
        setIsParsing(false);
        setParseComplete(true);
        return;
      }

      if (parseResult?.success && parseResult.parsed) {
        const parsed = parseResult.parsed as ParsedCVData;
        setParsedData(parsed);
        setParseProgress(100);
        setParseMessage("Profile ready!");

        const updateData: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        // Intelligent Merging
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

        toast.success("CV parsed successfully!");
        setParseComplete(true);
      } else {
        await updateTalent({ cvUrl: publicUrl });
        toast.success("CV uploaded successfully!");
        setParseComplete(true);
      }

      setIsParsing(false);
    } catch (error) {
      console.error("[CVUpload] Error:", error);
      toast.error("Upload failed. Please try again.");
      setParseError("Upload failed.");
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const handleContinueWithProfession = async () => {
    if (selectedCategory === "none") {
      toast.error("Please select a profession category to continue.");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedCategory !== talent?.professionCategoryId) {
        await updateTalent({ professionCategoryId: selectedCategory });
        await refreshTalent();
      }
      onContinue();
    } catch (error) {
      console.error("Failed to save profession:", error);
      toast.error("Failed to save your profession. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderParsedSummary = () => {
    if (!parsedData && !parseComplete) return null;

    if (parseError) {
      return (
        <div className="w-full mt-4 p-4 bg-warning/10 border border-warning/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <span className="font-semibold text-foreground">CV Uploaded</span>
          </div>
          <p className="text-sm text-muted-foreground">{parseError}</p>
        </div>
      );
    }

    if (!parsedData) return null;

    const stats = [];
    if (parsedData.skills?.length)
      stats.push({ icon: Sparkles, label: `${parsedData.skills.length} skills`, items: parsedData.skills.slice(0, 5) });
    if (parsedData.experience?.length)
      stats.push({
        icon: Briefcase,
        label: `${parsedData.experience.length} jobs`,
        items: parsedData.experience
          .slice(0, 2)
          .map((e) => e.company || e.title)
          .filter(Boolean),
      });
    if (parsedData.education?.length)
      stats.push({
        icon: GraduationCap,
        label: `${parsedData.education.length} degrees`,
        items: parsedData.education
          .slice(0, 2)
          .map((e) => e.institution || e.degree)
          .filter(Boolean),
      });

    if (stats.length === 0) return null;

    return (
      <div className="w-full mt-4 p-4 bg-success/10 border border-success/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold text-foreground">Profile Updated Automatically!</span>
        </div>

        {parsedData.full_name && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-background/50 rounded-lg">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{parsedData.full_name}</span>
          </div>
        )}

        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <stat.icon className="h-4 w-4 text-primary" />
                <span>{stat.label}</span>
              </div>
              {stat.items && <div className="pl-5 text-xs text-muted-foreground truncate">{stat.items.join(", ")}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isUploadingOrParsing = isUploading || isParsing || isSaving;
  const showSuccessState = !!(parsedData || (uploadedFile && parseComplete));
  const isContinueReady = !isUploadingOrParsing && selectedCategory !== "none";

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Upload Your CV</h2>
      <p className="text-muted-foreground text-center mb-6">
        We'll automatically fill your profile with your experience
      </p>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-full border-2 border-dashed rounded-xl p-8 text-center transition-all",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          showSuccessState && "border-success bg-success/5",
          !isDragging && !showSuccessState && "border-border hover:border-primary/50",
          (isUploading || isParsing) && "pointer-events-none opacity-90",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="font-medium">Uploading your file...</p>
              <p className="text-xs text-muted-foreground">This typically takes 2-3 seconds</p>
            </div>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-4 py-2 animate-in fade-in zoom-in">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="w-full max-w-[200px]">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{parseMessage}</p>
              <p className="text-xs text-muted-foreground">Reading your skills & experience...</p>
            </div>
          </div>
        ) : showSuccessState ? (
          <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in zoom-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-foreground font-bold text-lg">{parsedData ? "CV Analyzed!" : "Upload Complete!"}</p>
              <p className="text-xs text-muted-foreground mt-1">Your profile is ready below.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setParsedData(null);
                setUploadedFile(null);
                setParseComplete(false);
              }}
            >
              Upload different file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">Tap to Upload CV</p>
              <p className="text-sm text-muted-foreground mt-1">PDF or Word (Max 5MB)</p>
            </div>
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileSelect}
          disabled={isUploading || isParsing}
        />
      </div>

      {renderParsedSummary()}

      {/* Mandatory Profession Selection */}
      <div className="w-full mt-8 p-5 bg-card border rounded-xl shadow-sm">
        <Label htmlFor="profession" className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-primary" />
          What is your primary profession? <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isUploadingOrParsing}>
          <SelectTrigger
            id="profession"
            className="w-full bg-background border-muted-foreground/30 focus:ring-primary/50"
          >
            <SelectValue placeholder="Select your career category..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="none" disabled>
              Select a category...
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          We use this to precisely match you with the right job opportunities and assign your dedicated AI instructor.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full gap-3 mt-6">
        <Button
          size="lg"
          onClick={handleContinueWithProfession}
          className="w-full shadow-lg shadow-primary/20"
          disabled={!isContinueReady}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : parsedData ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Review & Continue
            </>
          ) : parseComplete ? (
            "Continue to Profile"
          ) : (
            "Save & Continue"
          )}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground" disabled={isUploadingOrParsing}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
