import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInviteToApply } from "@/domains/jobs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { Loader2, Zap, ShieldCheck, MailPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteToApplyDialogProps {
  open: boolean;
  onOpenChange: (openStateBool: boolean) => void;
  companyId: string;
  talentId: string;
}

interface ActiveJobNode {
  id: string;
  title: string;
}

/**
 * GroUp Academy: Employer Job Invitation Dispatch Gateway Terminal (InviteToApplyDialog)
 * An authoritative operational sandbox managing async invitation routing, telemetry checks, and corporate ledger sync tasks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function InviteToApplyDialog({ open, onOpenChange, companyId, talentId }: InviteToApplyDialogProps) {
  const queryClient = useQueryClient();
  const jobInvitationMutation = useInviteToApply();
  const isMountedRef = useRef<boolean>(true);

  const [jobs, setJobs] = useState<ActiveJobNode[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    if (open) {
      trackEvent("job_invitation_dialog_opened", { companyId, talentId });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [open, companyId, talentId]);

  // Secure Ingress Pass: Fetch active institutional openings defensively with explicit cleanups
  useEffect(() => {
    let isRequestActive = true;
    if (!open || !companyId) return;

    if (isMountedRef.current) {
      setFetchingJobs(true);
    }

    (supabase as any)
      .from("jobs")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("status", "active")
      .limit(50)
      .then(({ data: jobsDataPayload, error: jobsQueryError }: { data: ActiveJobNode[] | null; error: any }) => {
        if (jobsQueryError) {
          trackError(jobsQueryError, {
            component: "InviteToApplyDialog",
            action: "fetch_company_active_jobs",
            companyId,
          });
          if (isRequestActive && isMountedRef.current) {
            setFetchingJobs(false);
          }
          return;
        }

        if (isRequestActive && isMountedRef.current) {
          const typedJobsList = (jobsDataPayload || []) as ActiveJobNode[];
          setJobs(typedJobsList);
          setFetchingJobs(false);
          trackEvent("job_invitation_active_openings_loaded", { listingsCount: typedJobsList.length });
        }
      });

    return () => {
      isRequestActive = false;
    };
  }, [open, companyId]);

  const safeJobsCollection = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    return jobs.filter((jobItem) => jobItem && typeof jobItem.id === "string");
  }, [jobs]);

  const handleExecutiveInvitationSubmit = async () => {
    const targetSelectedJobId = jobId;
    if (!targetSelectedJobId) {
      toast.error("Selection Fault: You must specify a target active corporate opening to deploy an invitation.");
      return;
    }

    setSaving(true);
    trackEvent("job_invitation_dispatch_initiated", { targetSelectedJobId });
    const dynamicToastTrackerId = toast.loading(
      "Processing cryptography handshake parameters over secure tracking rows…",
    );

    try {
      await jobInvitationMutation.mutateAsync({
        job_id: targetSelectedJobId,
        company_id: companyId,
        talent_id: talentId,
        note: note.trim() || null,
      });

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["job-invitations"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile", talentId] });

      if (isMountedRef.current) {
        toast.success("Ecosystem invitation pipeline successfully broadcast to target talent node.", {
          id: dynamicToastTrackerId,
        });
        trackEvent("job_invitation_dispatch_success", { targetSelectedJobId });

        // Form field baseline resets
        setJobId("");
        setNote("");
        onOpenChange(false);
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "InviteToApplyDialog",
        action: "commit_job_invitation_mutation_api",
        targetSelectedJobId,
      });

      toast.error(`Ecosystem write validation error: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpenState) => {
        if (!isOpenState && !saving) {
          onOpenChange(isOpenState);
          trackEvent("job_invitation_dialog_cancelled");
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-left antialiased overflow-hidden transform-gpu select-none sm:select-text flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTAINER */}
        <DialogHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <MailPlus className="h-4 w-4 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                Authorize Talent Pipeline Invitation
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                Deploy dynamic application invitations with contextual communication note attachments
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* HUD LEVEL 2: COMPOSITE INPUT ENTRY SCHEMATIC MATRIX FORMS */}
        <div className="space-y-4 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90">
          {/* JOB SPECIFICATION OPENINGS SELECT COMPONENT */}
          <div className="space-y-1.5 text-left w-full min-w-0">
            <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
              Target Position Placement Node *
            </Label>
            <Select
              value={jobId}
              disabled={saving || fetchingJobs}
              onValueChange={(val) => {
                trackEvent("job_invitation_opening_selected", { targetSelectedJobId: val });
                setJobId(val);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                {fetchingJobs ? (
                  <span className="flex items-center gap-2 text-muted-foreground/40 italic">
                    <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                    <span>Parsing tracking records...</span>
                  </span>
                ) : (
                  <SelectValue placeholder="Pick an active structural corporate vacancy..." />
                )}
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs max-h-60">
                {safeJobsCollection.length === 0 && !fetchingJobs ? (
                  <p className="text-[10px] font-mono font-bold text-center py-3 uppercase tracking-wide text-muted-foreground/40 italic">
                    No operational vacancy slots found.
                  </p>
                ) : (
                  safeJobsCollection.map((jobNodeItem) => (
                    <SelectItem
                      key={jobNodeItem.id}
                      value={jobNodeItem.id}
                      className="cursor-pointer text-xs font-semibold py-2 rounded-lg uppercase tracking-wide"
                    >
                      {jobNodeItem.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* PERSONAL COMMUNICATION SUMMARY TEXT AREA ROW */}
          <div className="space-y-1.5 text-left w-full min-w-0">
            <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
              Personalized Ingress Note Summary{" "}
              <span className="text-muted-foreground/40 font-normal lowercase tracking-normal">(optional)</span>
            </Label>
            <Textarea
              rows={3}
              value={note}
              disabled={saving}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Inject precise conversion messaging notes detailing platform alignment, salary parities, or custom deliverables…"
              className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3.5 leading-relaxed resize-none shadow-inner"
              maxLength={400}
            />
          </div>
        </div>

        {/* HUD LEVEL 3: FOOTER DISPATCH ACTION STRIP CONTROL BUTTON ROW */}
        <DialogFooter className="mt-5 gap-2.5 sm:gap-0 select-none border-t border-border/10 pt-4 w-full shrink-0 flex items-center justify-end font-bold text-xs">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
          >
            Abort Ingress
          </Button>

          <Button
            type="button"
            onClick={handleExecutiveInvitationSubmit}
            disabled={saving || !jobId || fetchingJobs}
            className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Syncing Pipeline Ledger…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                <span>Transmit Secure Invitation</span>
              </>
            )}
          </Button>
        </DialogFooter>

        {/* HUD LEVEL 4: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="shrink-0 pt-2 mt-4 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none uppercase w-full flex items-center justify-center gap-1.5 h-6">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Talent attraction acquisition protocol transmission calibration sync core complete</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
