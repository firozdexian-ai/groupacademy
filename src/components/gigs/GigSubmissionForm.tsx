import { useTalent } from "@/hooks/useTalent";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Coins, Sparkles, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { CVUploadGigForm } from "./CVUploadGigForm";
import { JobPostingGigForm } from "./JobPostingGigForm";
import { JobSharingGigForm } from "./JobSharingGigForm";
import { CourseSharingGigForm } from "./CourseSharingGigForm";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Gig Submission Orchestrator
 * CTO Reference: Authoritative factory for polymorphic gig payload ingestion.
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

  // PROTOCOL: Robust cache invalidation sequence for ledger synchronization
  const handleExecutiveSubmission = () => {
    queryClient.invalidateQueries({ queryKey: ["gig-submission-counts"] });
    queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
    queryClient.invalidateQueries({ queryKey: ["talent-stats"] }); // Synchronize global wallet balance
    onOpenChange(false);
  };

  if (!talent?.id) return null;

  // ROUTER: Specialized Form Ingress
  const renderSpecializedProtocol = () => {
    const props = { gig, talentId: talent.id, onSubmitted: handleExecutiveSubmission };

    switch (gig.category) {
      case "cv_upload":
        return <CVUploadGigForm {...props} />;
      case "job_posting":
        return <JobPostingGigForm {...props} />;
      case "job_sharing":
        return <JobSharingGigForm {...props} />;
      case "course_resell":
        return <CourseSharingGigForm {...props} />;
      default:
        return (
          <div className="py-16 text-center space-y-4 animate-pulse">
            <AlertCircle className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              PROTOCOL_NODE_OFFLINE
            </p>
          </div>
        );
    }
  };

  // DYNAMIC_GEOMETRY: Adaptive dialog widths based on task complexity
  const getExecutiveWidth = () => {
    if (["content_creation", "job_posting"].includes(gig.category)) return "max-w-xl";
    if (gig.category === "job_sharing") return "max-w-lg";
    return "max-w-md";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-[40px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl no-scrollbar",
          getExecutiveWidth(),
          "max-h-[92vh] overflow-y-auto p-0", // Zero padding on content for custom form spacing
        )}
      >
        {/* HEADER_SYNC: Industrial metadata display */}
        <DialogHeader className="p-8 pb-4 space-y-6 text-left">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
              <Sparkles className="h-6 w-6 text-primary fill-current" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {gig.title.replace("_", " ")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-60">
                <Zap className="h-3 w-3" /> Protocol_V2.0_Ingress
              </div>
            </div>
          </div>

          <DialogDescription className="bg-amber-500/5 border-2 border-amber-500/10 rounded-[24px] p-5 flex items-center justify-between shadow-inner">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-1">
                YIELD_POTENTIAL
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-black text-amber-600 uppercase italic">Verification_Required</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-2xl shadow-[0_10px_20px_rgba(245,158,11,0.3)] scale-105">
              <Coins className="h-5 w-5 fill-white/20" />
              <span className="text-sm font-black italic tracking-tighter">+{gig.credit_reward} CR</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* INGRESS: Task Specific Forms */}
        <div className="px-8 pb-10">
          <div className="h-px bg-border/40 mb-8" />
          {renderSpecializedProtocol()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
