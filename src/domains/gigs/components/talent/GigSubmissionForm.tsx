import { useEffect } from "react";
import { useTalent } from "@/hooks/useTalent";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Coins, Sparkles, AlertCircle, Zap } from "lucide-react";
import { CVUploadGigForm } from "./CVUploadGigForm";
import { JobPostingGigForm } from "./JobPostingGigForm";
import { JobSharingGigForm } from "./JobSharingGigForm";
import { CourseSharingGigForm } from "./CourseSharingGigForm";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Gig Submission Orchestrator
 * CTO Reference: Authoritative factory for polymorphic gig payload ingestion.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

interface Gig {
  id: string;
  title: string;
  category: string;
  credit_reward: number;
}

interface GigSubmissionFormProps {
  gig: Gig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GigSubmissionForm({ gig, open, onOpenChange }: GigSubmissionFormProps) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // Monitor orchestrator modal lifecycles across active analytics channels
  useEffect(() => {
    if (open && gig?.id) {
      trackEvent("gig_orchestrator_modal_opened", {
        gigId: gig.id,
        category: gig.category,
        talentId: talent?.id,
      });
    }
  }, [open, gig, talent?.id]);

  if (!talent?.id) {
    if (open) {
      trackError("GigSubmissionForm triggered while talent session state is un-authenticated.", {
        component: "GigSubmissionForm",
        action: "security_context_assertion_fault",
      });
    }
    return null;
  }

  // PROTOCOL: Robust cache invalidation sequence for ledger synchronization
  const handleExecutiveSubmission = () => {
    trackEvent("gig_orchestrator_submission_completed", { gigId: gig.id, talentId: talent.id });

    // Automated Efficiency: Synchronize cache pools instantly across viewports
    queryClient.invalidateQueries({ queryKey: ["gig-submission-counts", talent.id] });
    queryClient.invalidateQueries({ queryKey: ["my-gig-submissions", talent.id] });
    queryClient.invalidateQueries({ queryKey: ["talent-stats", talent.id] });
    queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

    onOpenChange(false);
  };

  // ROUTER: Specialized Form Ingress Factory
  const renderSpecializedProtocol = () => {
    const functionalProps = { gig, talentId: talent.id, onSubmitted: handleExecutiveSubmission };

    switch (gig.category) {
      case "cv_upload":
        return <CVUploadGigForm {...functionalProps} />;
      case "job_posting":
        return <JobPostingGigForm {...functionalProps} />;
      case "job_sharing":
        return <JobSharingGigForm {...functionalProps} />;
      case "course_resell":
        return <CourseSharingGigForm {...functionalProps} />;
      default:
        trackError(`Polymorphic factory hit an unmapped workflow key segment: [${gig.category}]`, {
          component: "GigSubmissionForm",
          action: "factory_switch_fallback",
          gigId: gig.id,
        });
        return (
          <div className="py-12 text-center space-y-3.5 select-none">
            <AlertCircle className="h-10 w-10 text-destructive/40 mx-auto animate-bounce" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 italic">
              Protocol Node Offline
            </p>
          </div>
        );
    }
  };

  // DYNAMIC_GEOMETRY: Adaptive layout widths mapped precisely to input form sizes
  const getExecutiveWidth = () => {
    if (["course_resell", "job_posting"].includes(gig.category)) return "sm:max-w-xl";
    if (gig.category === "job_sharing") return "sm:max-w-lg";
    return "sm:max-w-md";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(visibleState) => {
        onOpenChange(visibleState);
        if (!visibleState) {
          trackEvent("gig_orchestrator_modal_dismissed", { gigId: gig.id });
        }
      }}
    >
      <DialogContent
        className={cn(
          "rounded-3xl border border-border/40 bg-background/98 backdrop-blur-xl shadow-2xl overflow-hidden w-[94vw] sm:w-full select-none sm:select-text transform-gpu",
          getExecutiveWidth(),
          "max-h-[90vh] max-h-[90svh] overflow-y-auto p-0 pt-safe pb-safe-bottom", // Zero padding rules handled dynamically
        )}
        style={{ contentVisibility: "auto" }}
      >
        {/* HEADER_SYNC: High-fidelity metadata display panel layout */}
        <DialogHeader className="p-6 sm:p-7 pb-3 space-y-4 text-left border-b border-border/20 select-none">
          <div className="flex items-center gap-3 w-full min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary fill-primary/10 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1 truncate w-full break-all">
                {gig.title ? gig.title.replace(/_/g, " ") : "Task Update Ingress"}
              </DialogTitle>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide mt-0.5 leading-none">
                <Zap className="h-3 w-3 text-primary stroke-[2.2]" />
                <span>Orchestration Node Ingress</span>
              </div>
            </div>
          </div>

          <DialogDescription className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between shadow-inner w-full gap-4">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Yield Potential Status
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-tight">
                  Verification Auditing Required
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-amber-500/10 shrink-0 select-none border border-white/5 tabular-nums">
              <Coins className="h-4 w-4 fill-white/10 text-white stroke-[2.2]" />
              <span className="text-xs font-black tracking-tight">+{gig.credit_reward || 0} CR</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* INGRESS: Task Specific Forms Inject Section Frame */}
        <div className="p-6 sm:p-7 pt-4 w-full min-w-0">{renderSpecializedProtocol()}</div>
      </DialogContent>
    </Dialog>
  );
}
