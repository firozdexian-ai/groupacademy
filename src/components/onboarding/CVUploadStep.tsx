import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  User,
  AlertCircle,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  const [, setUploadedFile] = useState<string | null>(talent?.cvUrl || null);
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [parseComplete, setParseComplete] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
            <span className="text-xs font-semibold uppercase tracking-wide">Notice</span>
          </div>
          <p className="text-sm font-medium text-rose-700">{parseError}</p>
        </div>
      );
    }

    return (
      <div className="w-full mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Profile updated</span>
        </div>

        {parsedData?.full_name && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-slate-100 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-sm font-semibold text-slate-900">{parsedData.full_name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {parsedData?.skills?.length && (
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-1">Skills found</p>
              <p className="text-lg font-bold text-slate-900">{parsedData.skills.length}</p>
            </div>
          )}
          {parsedData?.experience?.length && (
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-1">Experience</p>
              <p className="text-lg font-bold text-slate-900">{parsedData.experience.length} roles</p>
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
            <p className="text-sm font-medium text-slate-500">Uploading…</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-6 w-full animate-in zoom-in-95">
            <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
            <div className="w-full max-w-[220px] space-y-3 mx-auto">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-700 ease-out"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="text-xs font-medium text-blue-500 text-center">{parseMessage}</p>
            </div>
          </div>
        ) : parseComplete ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-slate-900">Upload complete</p>
            <p className="text-xs text-slate-400">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 group">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
              <FileText className="h-7 w-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="space-y-1.5 text-center">
              <p className="text-lg font-semibold text-slate-900">Upload your resume</p>
              <p className="text-xs text-slate-400">PDF or DOCX, up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {renderParseSummary()}

      <div className="flex flex-col w-full gap-3 mt-10 pt-6 border-t border-slate-200">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={isParsing || isUploading}
          className="w-full h-12 rounded-xl text-base gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-700 h-11 rounded-xl"
          disabled={isParsing || isUploading}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
