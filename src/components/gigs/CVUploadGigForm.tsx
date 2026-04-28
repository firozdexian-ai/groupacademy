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
  User,
  Phone,
  Briefcase,
  CheckCircle,
  FileText,
  Sparkles,
  Share2,
  Zap,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: CV Intelligence & Outreach Node
 * CTO Reference: Authoritative interface for document parsing and automated lead engagement.
 */

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

  const handleFileIngress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const executeIntelligenceChain = async () => {
    if (!cvFile) {
      toast.error("PROTOCOL_ERROR: Document Required");
      return;
    }

    setIsProcessing(true);
    try {
      // PHASE 1: Storage Node Ingress
      const fileName = `gig-cvs/${talentId}/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage.from("portfolio-uploads").upload(fileName, cvFile);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl);

      // PHASE 2: AI Synapse Analysis
      toast.info("AI_SYNAPSE: Analyzing professional profile nodes...");
      const { data: parseRes, error: parseErr } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl, serviceType: "cv_outreach" },
      });
      if (parseErr || !parseRes?.success) throw new Error("INGESTION_FAULT: Parsing failed");
      setParsedData(parseRes.parsed);

      // PHASE 3: Outreach Strategy Synthesis
      const { data: msgRes, error: msgErr } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          parsedCV: parseRes.parsed,
          product: "digital-portfolio",
          professionCategory: parseRes.parsed?.profession_category || "Executive",
          senderName: "Academy_Systems",
          language: "auto",
        },
      });
      if (msgErr || !msgRes?.success) throw new Error("SYNTHESIS_FAULT: Generation failed");
      setOutreachMessage(msgRes.message);

      toast.success("PROFILE_SYNC_COMPLETE");
    } catch (err: any) {
      toast.error("SYNC_ERROR: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getWhatsAppProtocol = () => {
    const rawPhone = parsedData?.phone || parsedData?.contact?.phone || "";
    const clean = String(rawPhone).trim().startsWith("+")
      ? String(rawPhone).replace(/[^\d]/g, "")
      : String(rawPhone).replace(/\D/g, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(outreachMessage)}`;
  };

  const finalizeGigSubmission = async () => {
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
          meta: { engine: "gemini-2.0-flash-exp", timestamp: new Date().toISOString() },
        },
      });
      if (error) throw error;
      toast.success("ARTIFACT_COMMITTED");
      onSubmitted();
    } catch (err: any) {
      toast.error("SUBMISSION_FAULT");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* NODE: FILE_INGRESS */}
      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
          Document_Ingress
        </Label>
        <div className="relative group">
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileIngress}
            className="hidden"
            id="cv-node-upload"
          />
          <label
            htmlFor="cv-node-upload"
            className={cn(
              "flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-[32px] cursor-pointer transition-all duration-500",
              cvFile
                ? "border-primary bg-primary/5 shadow-inner"
                : "border-border/40 hover:border-primary/20 bg-card/50",
            )}
          >
            {cvFile ? (
              <div className="text-center space-y-3 animate-in zoom-in-95">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-black italic tracking-tighter truncate max-w-[250px] uppercase">
                  {cvFile.name.replace(" ", "_")}
                </p>
                <Badge
                  variant="outline"
                  className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary italic"
                >
                  SYNC_READY
                </Badge>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
                  UPLOAD_PROFESSIONAL_NODES
                </span>
              </>
            )}
          </label>
        </div>
      </div>

      {!parsedData ? (
        <Button
          onClick={executeIntelligenceChain}
          disabled={!cvFile || isProcessing}
          className="w-full rounded-2xl h-16 font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current" />}
          {isProcessing ? "SYNAPSE_ANALYZING..." : "INITIALIZE_AI_MAPPING"}
        </Button>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
          {/* HUD: IDENTITY_MAPPING */}
          <div className="bg-card/40 backdrop-blur-xl border-2 border-border/40 rounded-[32px] p-6 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                  Identity_Ledger
                </span>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="grid gap-5">
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors">
                  <User className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-base font-black italic tracking-tighter uppercase">
                  {parsedData.full_name || "UNIDENTIFIED"}
                </p>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center border border-border/10 group-hover:bg-emerald-500/10 transition-colors">
                  <Phone className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500" />
                </div>
                <p className="text-sm font-bold tabular-nums italic opacity-80">
                  {parsedData.phone || "NODE_DISCONNECTED"}
                </p>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors">
                  <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <Badge className="bg-primary border-none text-[9px] font-black uppercase italic px-3 py-1">
                  {parsedData.profession_category || "GENERAL_NODE"}
                </Badge>
              </div>
            </div>
          </div>

          {/* HUD: OUTREACH_SYNTHESIS */}
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[28px] p-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MessageSquare className="h-12 w-12 text-emerald-500" />
              </div>
              <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4 block italic">
                STRATEGY: WHATSAPP_SYNCHRONIZATION
              </Label>
              <p className="text-xs font-medium leading-relaxed italic text-foreground/80 bg-background/30 p-5 rounded-2xl border border-emerald-500/10">
                "{outreachMessage}"
              </p>
            </div>

            <div className="grid gap-4">
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl gap-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 font-black uppercase italic tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
                onClick={() => window.open(getWhatsAppProtocol(), "_blank")}
              >
                <Share2 className="h-5 w-5 fill-current" /> EXECUTE_WHATSAPP_DISTRIBUTION
              </Button>

              <Button
                onClick={finalizeGigSubmission}
                disabled={isSubmitting}
                className="w-full rounded-[24px] h-16 font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all active:scale-95 gap-3"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                CONFIRM_ARTIFACT_SUBMISSION
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
