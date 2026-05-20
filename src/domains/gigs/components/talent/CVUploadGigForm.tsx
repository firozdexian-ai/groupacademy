import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  User,
  Phone,
  Briefcase,
  CheckCircle,
  FileText,
  Zap,
  ShieldCheck,
  MessageSquare,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CVUploadGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

/**
 * GroUp Academy: CV Intelligence & Outreach Node
 * CTO Reference: Authoritative interface for document parsing and automated lead engagement.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CVUploadGigForm({ gig, talentId, onSubmitted }: CVUploadGigFormProps) {
  const queryClient = useQueryClient();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [outreachMessage, setOutreachMessage] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  // Monitor document parsing workspace impressions via telemetry
  useEffect(() => {
    if (gig?.id) {
      trackEvent("cv_upload_form_rendered", { gigId: gig.id, talentId });
    }
  }, [gig, talentId]);

  if (!gig || !gig.id || !talentId) {
    trackError("CVUploadGigForm mounted without valid structural parameters.", {
      component: "CVUploadGigForm",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleFileIngress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      trackEvent("cv_file_selected", { fileName: file.name, fileSize: file.size });
    }
  };

  const executeIntelligenceChain = async () => {
    if (!cvFile) {
      toast.error("Document required to initialize analysis.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Initializing AI mapping synapse chain...");

    trackEvent("cv_intelligence_chain_started", { talentId, fileName: cvFile.name });

    try {
      // PHASE 1: Storage Node Ingress Lookups
      const fileName = `gig-cvs/${talentId}/${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, cvFile, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);

      setCvUrl(publicUrl);

      // PHASE 2: AI Synapse Parsing Analysis
      let parseRes: any;
      try {
        parseRes = await profileApi.parseCv({ cvUrl: publicUrl, serviceType: "cv_outreach" } as any);
      } catch (parseErr: any) {
        throw new Error(parseErr?.message || "Ecosystem document parsing extraction failed.");
      }
      if (!parseRes?.success) {
        throw new Error("Ecosystem document parsing extraction failed.");
      }

      setParsedData(parseRes.parsed);

      // PHASE 3: Outreach Strategy Synthesis
      let msgRes: any;
      try {
        msgRes = await gigsApi.generateOutreachMessage({
          parsedCV: parseRes.parsed,
          product: "digital-portfolio",
          professionCategory: parseRes.parsed?.profession_category || "Executive",
          senderName: "Academy_Systems",
          language: "auto",
        } as any);
      } catch (msgErr: any) {
        throw new Error(msgErr?.message || "Ecosystem copywriting message generation failed.");
      }

      if (msgErr || !msgRes?.success) {
        throw new Error(msgErr?.message || "Ecosystem copywriting message generation failed.");
      }

      setOutreachMessage(msgRes.message);

      toast.success("Profile mapping completed successfully", { id: toastId });
      trackEvent("cv_intelligence_chain_success", { talentId });
    } catch (err: any) {
      const parsedMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedMsg, {
        component: "CVUploadGigForm",
        action: "execute_intelligence_chain",
        talentId,
      });

      toast.error(`Analysis delay: ${parsedMsg}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const getWhatsAppProtocol = (): string => {
    const rawPhone = parsedData?.phone || parsedData?.contact?.phone || "";
    const cleanDigits = String(rawPhone).replace(/\D/g, "");
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(outreachMessage)}`;
  };

  const finalizeGigSubmission = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Registering submission records into ledger...");

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("gig_submissions")
        .insert({
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
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Dynamically load automated verification scripts inside sandboxed container
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      await triggerAutoReview(inserted.id);

      // Automated Efficiency: Synchronize caching pools instantly across active structures
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["gig_submissions", talentId] });

      toast.success("Artifact submitted cleanly for verification review", { id: toastId });
      onSubmitted();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);

      trackError(msg, {
        component: "CVUploadGigForm",
        action: "finalize_gig_submission",
        gigId: gig.id,
        talentId,
      });

      toast.error("Ledger connection timeout. Submission delayed.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none sm:select-text antialiased max-w-full w-full">
      {/* NODE: FILE_INGRESS Panel wrapper */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5 select-none">
          Document Ingress
        </Label>
        <div className="relative group w-full">
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileIngress}
            className="hidden"
            id="cv-node-upload"
            disabled={isProcessing || isSubmitting}
          />
          <label
            htmlFor="cv-node-upload"
            className={cn(
              "flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl cursor-pointer transition-all duration-300 w-full transform-gpu",
              cvFile
                ? "border-primary bg-primary/5 shadow-inner"
                : "border-border/40 hover:border-primary/30 bg-card/40 hover:bg-card/80 backdrop-blur-md shadow-sm",
              (isProcessing || isSubmitting) && "opacity-40 pointer-events-none cursor-not-allowed",
            )}
          >
            {cvFile ? (
              <div className="text-center space-y-2.5 px-4 max-w-full animate-in zoom-in-98 duration-200">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs sm:text-sm font-bold truncate max-w-xs text-foreground/90 select-text break-all tracking-tight px-2">
                  {cvFile.name}
                </p>
                <Badge
                  variant="outline"
                  className="text-[9px] font-extrabold bg-primary/5 text-primary border-primary/20 rounded-md px-2 py-0.5 select-none tracking-wide uppercase"
                >
                  Document Staged
                </Badge>
              </div>
            ) : (
              <div className="text-center p-4 select-none">
                <div className="h-11 w-11 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-105">
                  <Upload className="h-5 w-5 text-muted-foreground/80" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 pl-0.5">
                  Upload PDF or Word Document
                </span>
              </div>
            )}
          </label>
        </div>
      </div>

      {!parsedData ? (
        <Button
          onClick={executeIntelligenceChain}
          disabled={!cvFile || isProcessing}
          className="w-full rounded-xl h-11 font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
          ) : (
            <Zap className="h-4 w-4 fill-primary-foreground/10" />
          )}
          <span>{isProcessing ? "Processing Synapse Ledger..." : "Initialize AI Mapping Sync"}</span>
        </Button>
      ) : (
        <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-500 w-full min-w-0">
          {/* HUD: IDENTITY_MAPPING Status Box */}
          <div className="bg-card/50 border border-border/40 backdrop-blur-md rounded-2xl p-4 space-y-4 shadow-sm relative overflow-hidden text-left w-full min-w-0">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between select-none border-b border-border/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Extracted Lead Identity
                </span>
              </div>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>

            <div className="grid gap-3.5 w-full min-w-0">
              <div className="flex items-center gap-3 group min-w-0">
                <div className="h-9 w-9 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground/80" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground/90 truncate break-all select-text flex-1">
                  {parsedData.full_name || "Unidentified Resource"}
                </p>
              </div>

              <div className="flex items-center gap-3 group min-w-0">
                <div className="h-9 w-9 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground/80" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground/80 tabular-nums select-text flex-1 truncate">
                  {parsedData.phone || "No connection number mapped"}
                </p>
              </div>

              <div className="flex items-center gap-3 group min-w-0">
                <div className="h-9 w-9 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-muted-foreground/80" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <Badge className="bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-md uppercase tracking-wide truncate max-w-full">
                    {parsedData.profession_category?.replace("_", " ") || "General Domain"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* HUD: OUTREACH_SYNTHESIS Messaging Block */}
          <div className="space-y-3 w-full min-w-0">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 shadow-inner relative overflow-hidden text-left w-full min-w-0">
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none select-none">
                <MessageSquare className="h-10 w-10 text-emerald-500" />
              </div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2.5 block select-none">
                Generated Strategic Messaging
              </Label>
              <p className="text-xs font-semibold leading-relaxed text-foreground/80 bg-background/50 p-4 rounded-xl border border-emerald-500/10 select-text break-words">
                &ldquo;{outreachMessage}&rdquo;
              </p>
            </div>

            {/* Actions Control Ribbon */}
            <div className="grid gap-3 w-full select-none pt-1">
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 font-bold text-xs tracking-wide shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => {
                  trackEvent("whatsapp_dispatch_executed", { talentId });
                  window.open(getWhatsAppProtocol(), "_blank", "noopener,noreferrer");
                }}
              >
                <Share2 className="h-4 w-4 stroke-[2.2]" />
                <span>Launch WhatsApp Distribution</span>
              </Button>

              <Button
                onClick={finalizeGigSubmission}
                disabled={isSubmitting}
                type="button"
                className="w-full rounded-xl h-11 font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all cursor-pointer gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Confirm Lead Submission</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
