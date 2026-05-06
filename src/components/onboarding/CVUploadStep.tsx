import { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  User,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTalent } from "@/hooks/useTalent";
import { computeCVFingerprint } from "@/lib/onboarding/cvFingerprint";
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
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  experience?: Array<{ company?: string; title?: string; description?: string }>;
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 20, message: "Uploading document..." },
  { progress: 40, message: "Analyzing text structure..." },
  { progress: 60, message: "Extracting skills and experience..." },
  { progress: 80, message: "Building professional profile..." },
  { progress: 95, message: "Finalizing..." },
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

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(talent?.professionCategoryId || "none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("profession_categories").select("id, name").order("name");
      if (!error && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const simulateProgress = () => {
    let stageIndex = 0;
    return setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setParseProgress(PARSING_STAGES[stageIndex].progress);
        setParseMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      }
    }, 1200);
  };

  async function handleCVUpload(file: File) {
    if (!talent?.id) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }

    setIsUploading(true);
    setIsParsing(false);
    setParseError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/cv_v3.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);
      setUploadedFile(publicUrl);
      setIsUploading(false);
      setIsParsing(true);

      const progressInterval = simulateProgress();
      const { data: parseResult, error: invokeError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });
      clearInterval(progressInterval);

      if (invokeError || !parseResult?.success) {
        await updateTalent({ cvUrl: publicUrl });
        setParseError("We couldn't read the file automatically — you can fill in details later.");
        toast.warning("File uploaded.");
        setIsParsing(false);
        setParseComplete(true);
        return;
      }

      const parsed = parseResult.parsed as ParsedCVData;
      setParsedData(parsed);
      setParseProgress(100);

      // Merge parsed fields into the talent profile (don't overwrite user-edited values)
      const updatePayload: Record<string, any> = {
        cvUrl: publicUrl,
        cvParsedAt: new Date().toISOString(),
      };

      const currentName = talent.fullName ? String(talent.fullName) : "";
      const emailPrefix = talent.email ? String(talent.email).split("@")[0] : "";

      if (parsed.full_name && (!currentName || currentName === emailPrefix)) {
        updatePayload.fullName = parsed.full_name;
      }
      if (parsed.skills?.length && (!talent.skills || talent.skills.length === 0)) {
        updatePayload.skills = parsed.skills;
      }
      if (parsed.experience?.length && (!talent.experience || talent.experience.length === 0)) {
        updatePayload.experience = parsed.experience;
      }
      if (parsed.education?.length && (!talent.education || talent.education.length === 0)) {
        updatePayload.education = parsed.education;
      }

      // Compute fingerprint and check for duplicates server-side
      try {
        const fingerprint = await computeCVFingerprint(parsed);
        if (fingerprint) {
          updatePayload.cvFingerprint = fingerprint;
          const { data: dupResult } = await supabase.rpc("check_cv_duplicate", {
            _fingerprint: fingerprint,
            _self_user_id: talent.userId,
          });
          const dup = Array.isArray(dupResult) ? dupResult[0] : dupResult;
          if (dup?.duplicate) {
            updatePayload.isSuspectedDuplicate = true;
          }
        }
      } catch (e) {
        console.warn("[CVUpload] fingerprint check failed", e);
      }

      await updateTalent(updatePayload);
      await refreshTalent();

      toast.success("Resume parsed and saved.");
      setParseComplete(true);
      setIsParsing(false);
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const renderParseSummary = () => {
    if (!parsedData && !parseComplete) return null;

    if (parseError) {
      return (
        <div className="w-full mt-8 p-6 bg-rose-50 border border-rose-100 rounded-[24px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-2 text-rose-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold uppercase text-[10px] tracking-widest">Notice</span>
          </div>
          <p className="text-sm font-medium text-rose-700">{parseError}</p>
        </div>
      );
    }

    return (
      <div className="w-full mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-5">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="font-bold uppercase text-[10px] tracking-widest text-emerald-600">Profile updated</span>
        </div>

        {parsedData?.full_name && (
          <div className="flex items-center gap-4 mb-4 p-4 bg-white border border-slate-100 rounded-[20px] shadow-sm">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-base font-black uppercase tracking-tight text-slate-900">{parsedData.full_name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {parsedData?.skills?.length && (
            <div className="p-4 bg-white rounded-[20px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-widest">Skills found</p>
              <p className="text-xl font-black text-slate-900">{parsedData.skills.length}</p>
            </div>
          )}
          {parsedData?.experience?.length && (
            <div className="p-4 bg-white rounded-[20px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-widest">Experience</p>
              <p className="text-xl font-black text-slate-900">{parsedData.experience.length} roles</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-xl mx-auto text-left w-full">
      <div className="mb-6 space-y-2 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Add your resume
        </h2>
        <p className="text-sm text-slate-500">
          Upload your CV so we can pre-fill your profile. You can skip and add it later.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "relative w-full border-2 border-dashed rounded-[32px] p-12 text-center transition-all duration-500",
          isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
          (isUploading || isParsing) && "pointer-events-none opacity-60",
          parseComplete && "border-emerald-200 bg-emerald-50/50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dt = e.dataTransfer;
          if (dt && dt.files && dt.files.length > 0) {
            const file = dt.files.item(0);
            if (file) {
              handleCVUpload(file);
            }
          }
        }}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            const target = e.target;
            if (target && target.files && target.files.length > 0) {
              const file = target.files.item(0);
              if (file) {
                handleCVUpload(file);
              }
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-5 animate-in fade-in">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Uploading…</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-6 w-full animate-in zoom-in-95">
            <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
            <div className="w-full max-w-[200px] space-y-4 mx-auto">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-700 ease-out"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 text-center">
                {parseMessage}
              </p>
            </div>
          </div>
        ) : parseComplete ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-lg font-black tracking-tighter text-slate-900">Upload complete</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 group">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
              <FileText className="h-7 w-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black tracking-tighter text-slate-900">Upload your resume</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF or DOCX, up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {renderParseSummary()}

      {/* HUD: CATEGORY_LEDGER */}
      <div className="w-full mt-8 p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-3">
          <Briefcase className="h-4 w-4" /> Choose your career track <span className="text-rose-500">*</span>
        </Label>

        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isParsing}>
          <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold focus:ring-blue-500/20 text-slate-900">
            <SelectValue placeholder="Pick your main focus…" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="font-bold text-sm py-3 text-slate-700">
                {cat.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] font-medium text-slate-400 mt-4 leading-relaxed">
          This sets your AI mentor and tailors the learning paths we recommend.
        </p>
      </div>

      {/* FOOTER: ACTION_INGRESS */}
      <div className="flex flex-col w-full gap-4 mt-12 pt-8 border-t border-slate-200">
        <Button
          size="lg"
          onClick={async () => {
            if (selectedCategory === "none") return toast.error("Please choose a career track to continue.");
            setIsSaving(true);
            await updateTalent({ professionCategoryId: selectedCategory });
            onContinue();
          }}
          disabled={isParsing || isUploading || selectedCategory === "none"}
          className="w-full h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm gap-3"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
          {!isSaving && <ArrowRight className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors h-12 rounded-full"
          disabled={isParsing || isUploading}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
