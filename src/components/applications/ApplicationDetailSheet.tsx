import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTalentCvSignedUrl } from "@/domains/jobs/repo/jobsRepo";
import { updateJobApplication } from "@/domains/jobs/repo/jobsRepo";
import type { PipelineApplication, PipelineStatus } from "@/domains/jobs";
import { ApplicationMessageThread } from "./ApplicationMessageThread";
import { InterviewPanel } from "@/components/interviews/InterviewPanel";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Loader2, ShieldCheck, FileText, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const NEXT_STATUS_CONFIGS: { key: PipelineStatus; label: string; variant: "default" | "secondary" | "destructive" }[] =
  [
    { key: "viewed", label: "Mark Reviewing", variant: "secondary" },
    { key: "shortlisted", label: "Shortlist", variant: "default" },
    { key: "sent_to_employer", label: "Interview", variant: "secondary" },
    { key: "hired", label: "Hire", variant: "default" },
    { key: "rejected", label: "Reject", variant: "destructive" },
  ];

interface ApplicationDetailSheetProps {
  application: PipelineApplication | null;
  onClose: () => void;
  onMove: (to: PipelineStatus) => Promise<void>;
  onChanged: () => void;
  actorRole: "recruiter" | "admin";
}

/**
 * GroUp Academy: Employer Pipeline Evaluation Sheet (V5.6.0)
 * CTO Reference: Authoritative dashboard tracking corporate procurement and applicant progression metrics.
 * Architecture: Optimized via state re-synchronization hooks preventing cross-candidate parameter contamination.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ApplicationDetailSheet({
  application,
  onClose,
  onMove,
  onChanged,
  actorRole,
}: ApplicationDetailSheetProps) {
  const qc = useQueryClient();

  // Local state controls for workspace fields
  const [internalNotesText, setInternalNotesText] = useState("");
  const [activeTabValue, setActiveTabValue] = useState("overview");

  // --- PHASE: TARGET_STATE_SYNCHRONIZATION ---
  // Architecture Fix: Force structural state re-initialization immediately when the underlying candidate reference shifts
  useEffect(() => {
    if (application) {
      // Hydrate notes cleanly from historical ledger parameters or fall back to an empty canvas string safely
      setInternalNotesText(application.external_notes || "");
      setActiveTabValue("overview"); // Reset workspace tabs systematically to protect recruiter layout tracking
    }
  }, [application]);

  // Isolate validation flags to prevent rendering exceptions down the child nodes
  const isOpen = !!application;

  // --- ACTION: TRANSACTION_ISOLATED_PIPELINE_MUTATION ---
  const pipelineMutation = useMutation({
    mutationKey: ["mutate-employer-pipeline-application", application?.id],
    mutationFn: async (targetStatus: PipelineStatus): Promise<void> => {
      if (!application?.id) throw new Error("TRANSACTION_REJECTED: Application missing valid unique ID.");

      // HUD: ATOMIC_PIPELINE_STATUS_TRANSITION_COMMITTED
      await onMove(targetStatus);
    },
    onSuccess: (_, targetStatus) => {
      toast.success(`Application smoothly migrated to status: ${targetStatus}.`);

      // Systematic program cache invalidation across recruitment keys before flushing state trees
      void qc.invalidateQueries({ queryKey: ["employer-pipeline"] });
      void qc.invalidateQueries({ queryKey: ["talent-relationships"] });

      onChanged();
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger: Crucial for debugging recruiter write privilege rejections
      console.error("[Digital Workforce] ANOMALY: Pipeline status write operation rejected.", {
        applicationId: application?.id,
        targetStatus: err?.variables,
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(err?.message || "Failed to commit pipeline status transformation.");
    },
  });

  // --- ACTION: PERSIST_INTERNAL_ASSESSMENT_NOTES_MUTATION ---
  const saveNotesMutation = useMutation({
    mutationKey: ["save-application-internal-notes", application?.id],
    mutationFn: async (targetTextPayload: string): Promise<void> => {
      if (!application?.id) throw new Error("TRANSACTION_REJECTED: Context anchor dropped.");

      // HUD: COMMITTING_INTERNAL_ASSESSMENT_NOTES_UPDATE
      await updateJobApplication(application.id, { external_notes: targetTextPayload.trim() });
    },
    onSuccess: () => {
      toast.success("Internal recruiter notes logged successfully.");
      void qc.invalidateQueries({ queryKey: ["employer-pipeline"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log assessment history notes.");
    },
  });

  // Safe path extractor helper mapping storage locations defensively against layout breaks
  const calculatedSignedCvPath = useMemo(() => {
    if (!application?.cv_url) return null;
    const rawUrlString = String(application.cv_url);

    if (rawUrlString.includes("/talent-cvs/")) {
      return rawUrlString.split("/talent-cvs/")[1];
    }
    return rawUrlString;
  }, [application?.cv_url]);

  // --- HANDLER: SECURE_STORAGE_DOWNLOAD_HANDSHAKE ---
  const handleDownloadCvHandshake = async () => {
    if (!calculatedSignedCvPath) return;

    try {
      // HUD: REPROVISIONING_TEMPORARY_SIGNED_STORAGE_ACCESS_URL
      const signedUrl = await createTalentCvSignedUrl(calculatedSignedCvPath, 60 * 60).catch(
        () => null,
      );

      if (!signedUrl) {
        throw new Error("STORAGE_CHANNEL_REJECTED: Link authentication handshake failed.");
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("[Digital Workforce] FAULT: Secure CV allocation link dropped.", err.message);
      toast.error("Could not generate authorized CV down-link path.");
    }
  };

  if (!application) return null;

  const isMoving = pipelineMutation.isPending;
  const isSavingNotes = saveNotesMutation.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={(nextOpenState) => !nextOpenState && !isMoving && onClose()}>
      <SheetContent
        side="right"
        // Seal viewport edge boundaries while destructive write loops process in background wires
        onPointerDownOutside={(e) => isMoving && e.preventDefault()}
        className="w-full sm:max-w-lg overflow-y-auto select-none text-left rounded-l-3xl border-l-2 p-6 shadow-2xl"
      >
        {/* INTERFACE SECTOR: CANDIDACY IDENTITY HUB */}
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary shrink-0" /> {application.talent_name ?? "Anonymous Node"}
          </SheetTitle>
          <div className="text-xs font-medium text-muted-foreground/80 leading-relaxed pt-1 space-y-0.5">
            <p className="italic font-bold text-foreground/70">
              {application.talent_headline || "Candidate"}
            </p>
            <p className="text-[11px]">
              Applied for position:{" "}
              <span className="font-semibold text-primary uppercase">{application.job_title}</span>
            </p>
          </div>
        </SheetHeader>

        {/* INTERFACE SECTOR: WORKSPACE SELECTION TABS TAB CONTROLS */}
        <Tabs value={activeTabValue} onValueChange={setActiveTabValue} className="mt-6">
          <TabsList className="w-full h-11 border-2 rounded-xl bg-muted/20 p-1">
            <TabsTrigger
              value="overview"
              disabled={isMoving}
              className="flex-1 font-bold text-xs rounded-lg transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="hire"
              disabled={isMoving}
              className="flex-1 font-bold text-xs rounded-lg transition-all"
            >
              Hire
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              disabled={isMoving}
              className="flex-1 font-bold text-xs rounded-lg transition-all"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              disabled={isMoving}
              className="flex-1 font-bold text-xs rounded-lg transition-all"
            >
              Actions
            </TabsTrigger>
          </TabsList>

          {/* TAB CONTENT SECTOR: STATIC PROFILE OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="capitalize h-6 border-2 px-2.5 font-bold italic text-[10px] tracking-wider"
              >
                Status: {application.application_status}
              </Badge>
              {typeof application.ai_match_score === "number" && (
                <Badge variant="secondary" className="h-6 px-2.5 font-black bg-primary/10 text-primary text-[10px]">
                  🔥 {application.ai_match_score}% Match Score
                </Badge>
              )}
            </div>

            {application.cover_letter && (
              <div className="p-4 rounded-xl border bg-muted/5 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" /> Cover Letter Ingress
                </Label>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed italic max-h-40 overflow-y-auto">
                  "{application.cover_letter}"
                </p>
              </div>
            )}

            {application.cv_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMoving}
                onClick={handleDownloadCvHandshake}
                className="w-full h-11 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 transition-all shadow-sm active:scale-[0.99]"
              >
                <Download className="h-4 w-4 text-primary" /> Download Verifiable CV Document
              </Button>
            )}
          </TabsContent>

          {/* TAB CONTENT SECTOR: LIVE INTERVIEW SCHEDULER PANEL */}
          <TabsContent value="hire" className="mt-4 animate-in fade-in duration-300">
            {application.company_id && application.talent_id ? (
              <InterviewPanel
                applicationId={application.id}
                companyId={application.company_id}
                talentId={application.talent_id}
                actorRole={actorRole}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Relational database parameters missing context maps.
              </p>
            )}
          </TabsContent>

          {/* TAB CONTENT SECTOR: CONVERSATIONAL CORRESPONDENCE LINK */}
          <TabsContent value="messages" className="mt-4 animate-in fade-in duration-300">
            <ApplicationMessageThread applicationId={application.id} actorRole={actorRole} />
          </TabsContent>

          {/* TAB CONTENT SECTOR: WORKFLOW ACTIONS CONTROL MATRIX */}
          <TabsContent value="actions" className="space-y-4 mt-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-0.5">
                Pipeline Stage Transitions
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NEXT_STATUS_CONFIGS.filter((config) => config.key !== application.application_status).map((config) => {
                  const isCurrentTargetPending =
                    pipelineMutation.isPending && pipelineMutation.variables === config.key;
                  return (
                    <Button
                      key={config.key}
                      type="button"
                      variant={config.variant}
                      disabled={isMoving}
                      onClick={() => pipelineMutation.mutate(config.key)}
                      className="h-11 justify-start rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      {isCurrentTargetPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2 opacity-40 shrink-0" />
                      )}
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* AUDIT_LEDGER_SECTOR: INTERNAL RECRUITER ASSESSMENT NOTES */}
            <div className="space-y-2 pt-4 border-t-2 border-dashed">
              <div className="flex justify-between items-center px-0.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-primary" /> Internal Workspace Notes
                </Label>
                <span className="text-[8px] font-mono text-muted-foreground/40 uppercase">
                  Visible to recruiters only
                </span>
              </div>
              <Textarea
                value={internalNotesText}
                disabled={isMoving || isSavingNotes}
                onChange={(e) => setInternalNotesText(e.target.value)}
                placeholder="Append strategic assessment logs, candidate performance indicators, or panel notes..."
                rows={4}
                className="rounded-xl border-2 bg-muted/10 italic font-medium p-3 resize-none focus-visible:ring-primary/20 shadow-inner disabled:opacity-50"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isMoving || isSavingNotes || internalNotesText.trim() === (application.external_notes || "")}
                onClick={() => saveNotesMutation.mutate(internalNotesText)}
                className="w-full h-10 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all active:scale-[0.99] disabled:cursor-not-allowed"
              >
                {isSavingNotes && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                Commit Assessment Notes Log
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
