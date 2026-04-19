import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  MessageSquare,
  User,
  Phone,
  Briefcase,
  CheckCircle,
  FileText,
  Sparkles,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CVUploadGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function CVUploadGigForm({ gig, talentId, onSubmitted }: CVUploadGigFormProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [outreachMessage, setOutreachMessage] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const processCVChain = async () => {
    if (!cvFile) {
      toast.error("Upload a document to begin");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Storage Upload
      const fileName = `gig-cvs/${talentId}/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage.from("portfolio-uploads").upload(fileName, cvFile);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl);

      // 2. AI Parsing
      toast.info("AI is analyzing the professional profile...");
      const { data: parseRes, error: parseErr } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl, serviceType: "cv_outreach" },
      });
      if (parseErr || !parseRes?.success) throw new Error("Parsing failed");
      setParsedData(parseRes.parsed);

      // 3. Message Generation
      const { data: msgRes, error: msgErr } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          parsedCV: parseRes.parsed,
          product: "digital-portfolio",
          professionCategory: parseRes.parsed?.profession_category || "Professional",
          senderName: "Academy Support",
          language: "auto",
        },
      });
      if (msgErr || !msgRes?.success) throw new Error("Message generation failed");
      setOutreachMessage(msgRes.message);

      toast.success("Profile Analyzed & Message Generated");
    } catch (err: any) {
      toast.error(err.message || "Pipeline error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getWhatsAppLink = () => {
    // Global-friendly: keep raw international digits as-is.
    // If the parsed phone already has a +country code, use it; else just strip non-digits.
    const rawPhone = parsedData?.phone || parsedData?.contact?.phone || "";
    const trimmed = String(rawPhone).trim();
    // Preserve leading + if present, otherwise pass digits straight through (no country guessing).
    const clean = trimmed.startsWith("+")
      ? trimmed.replace(/[^\d]/g, "")
      : trimmed.replace(/\D/g, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(outreachMessage)}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          cv_document: cvUrl,
          lead_profile: {
            name: parsedData?.full_name || parsedData?.name,
            phone: parsedData?.phone || parsedData?.contact?.phone,
            email: parsedData?.email || parsedData?.contact?.email,
            profession: parsedData?.profession_category,
          },
          generated_outreach: outreachMessage,
          meta: { engine: "gemini-1.5-pro", timestamp: new Date().toISOString() },
        },
      });
      if (error) throw error;
      toast.success("Gig submitted for review!");
      onSubmitted();
    } catch (err: any) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* File Upload Zone */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Candidate Document
        </Label>
        <div className="relative group">
          <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" id="cv-upload" />
          <label
            htmlFor="cv-upload"
            className={cn(
              "flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-[24px] cursor-pointer transition-all",
              cvFile ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/20 bg-card",
            )}
          >
            {cvFile ? (
              <div className="text-center space-y-2">
                <FileText className="h-8 w-8 text-primary mx-auto" />
                <p className="text-xs font-bold truncate max-w-[200px]">{cvFile.name}</p>
                <Badge variant="secondary" className="text-[9px] font-black uppercase">
                  Selected
                </Badge>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Upload PDF/DOCX
                </span>
              </>
            )}
          </label>
        </div>
      </div>

      {!parsedData ? (
        <Button
          onClick={processCVChain}
          disabled={!cvFile || isProcessing}
          className="w-full rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {isProcessing ? "AI Analyzing..." : "Process with Intelligence"}
        </Button>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-top-2">
          {/* Profile Preview */}
          <div className="bg-card border border-border/40 rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Identity Mapping</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <p className="text-sm font-black tracking-tight">
                  {parsedData.full_name || parsedData.name || "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Phone className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold">{parsedData.phone || parsedData.contact?.phone || "No Contact"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">
                  {parsedData.profession_category || "General"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Outreach Action */}
          <div className="space-y-3">
            <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[24px] p-5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 block">
                Strategy: WhatsApp Outreach
              </Label>
              <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">"{outreachMessage}"</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 font-black uppercase tracking-widest text-[10px]"
                onClick={() => window.open(getWhatsAppLink(), "_blank")}
              >
                <Share2 className="h-4 w-4" /> Share on WhatsApp
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm Submission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
