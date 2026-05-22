import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { openGigDispute } from "@/domains/gigs/repo/gigsRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Scale, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  gigId: string;
  submissionId?: string;
  verificationId?: string;
  role: "poster" | "talent";
  trigger?: React.ReactNode;
}

const REASONS = [
  { v: "unfair_rejection", label: "Unfair rejection" },
  { v: "scope_mismatch", label: "Scope mismatch" },
  { v: "quality_dispute", label: "Quality dispute" },
  { v: "non_payment", label: "Non-payment" },
  { v: "other", label: "Other" },
];

/**
 * GroUp Academy: Arbitration & Consensus Controller (OpenDisputeButton)
 * CTO Reference: Authoritative interaction element initializing cryptographic dispute loops.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function OpenDisputeButton({ gigId, submissionId, verificationId, role, trigger }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("unfair_rejection");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Monitor dispute resolution initialization parameters via telemetry metrics
  useEffect(() => {
    if (open && gigId) {
      trackEvent("dispute_arbitration_modal_opened", {
        gigId,
        submissionId,
        verificationId,
        openedByRole: role,
      });
    }
  }, [open, gigId, submissionId, verificationId, role]);

  if (!gigId) {
    trackError("OpenDisputeButton component mounted without structural target gig id variables.", {
      component: "OpenDisputeButton",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleDisputeSubmission = async () => {
    const sanitizedNarrative = text.trim();

    if (sanitizedNarrative.length < 20) {
      toast.error("Please supply a rigorous narrative statement describing the event context (≥ 20 characters).");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Registering dispute records into adjudication ledger...");

    trackEvent("dispute_arbitration_submission_requested", { gigId, reasonCode: reason });

    try {
      // Direct criteria query execution mapping over decentralized Supabase RPC schema
      await openGigDispute({
        gigId,
        submissionId: submissionId ?? null,
        verificationId: verificationId ?? null,
        openedByRole: role,
        reasonCode: reason,
        narrative: sanitizedNarrative,
        evidence: [],
      });

      trackEvent("dispute_arbitration_submission_success", { gigId, reasonCode: reason });

      // Automated Efficiency: Broadcast explicit query updates across cache pools instantly
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["gig-matches-for-you"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Dispute logged successfully. An impartial reviewer panel has been assigned.", { id: toastId });

      setOpen(false);
      setText("");
    } catch (err: any) {
      const parsedMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedMsg, {
        component: "OpenDisputeButton",
        action: "invoke_open_gig_dispute_rpc",
        gigId,
        openedByRole: role,
      });

      toast.error(`Arbitration deployment fault: ${parsedMsg}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(visibleState) => {
        setOpen(visibleState);
        if (!visibleState) {
          trackEvent("dispute_arbitration_modal_dismissed", { gigId });
          setText("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="h-8 rounded-xl text-xs font-bold border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 select-none cursor-pointer active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1 stroke-[2.2]" />
            <span>Open dispute</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="max-w-md w-[94vw] sm:w-full p-5 border border-border/40 bg-background/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] max-h-[90svh] overflow-y-auto pt-safe pb-safe-bottom antialiased"
        style={{ contentVisibility: "auto" }}
      >
        {/* Immersive Section Header */}
        <DialogHeader className="text-left select-none">
          <DialogTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Scale className="h-4 w-4 text-destructive animate-pulse stroke-[2.2]" />
            <span>Escalate to Arbitration Board</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/90 leading-normal mt-1">
            Provide comprehensive context details regarding this milestone dispute. A verified community governance
            panel will evaluate data evidence pools and adjust the ledger.
          </DialogDescription>
        </DialogHeader>

        {/* Form Inputs Control Track */}
        <div className="space-y-4 mt-3 select-none">
          <div className="space-y-1 text-left w-full">
            <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
              Dispute Category Classification
            </label>
            <Select
              value={reason}
              onValueChange={(val) => {
                setReason(val);
                trackEvent("dispute_arbitration_reason_changed", { gigId, reason: val });
              }}
              disabled={submitting}
            >
              <SelectTrigger className="w-full h-10 rounded-xl border border-border/40 bg-card/40 focus:ring-1 focus:ring-ring text-xs font-bold text-foreground/90 tracking-tight cursor-pointer">
                <SelectValue placeholder="Select primary reason code" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/40 shadow-xl bg-background/95 backdrop-blur-md font-semibold text-xs text-foreground/90 select-none">
                {REASONS.map((reasonItem) => (
                  <SelectItem
                    key={reasonItem.v}
                    value={reasonItem.v}
                    className="cursor-pointer font-bold tracking-tight text-xs py-2"
                  >
                    {reasonItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 text-left w-full">
            <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
              Factual Narrative Statement
            </label>
            <Textarea
              placeholder="State explicit parameters regarding target deliverables, specific timeline scope modifications, or metrics inconsistencies with strict detail transparency..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={submitting}
              className="resize-none rounded-xl text-xs sm:text-sm font-medium border border-border/40 bg-card/30 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 leading-relaxed p-4 select-text"
            />
          </div>

          {/* Form Action Dispatcher Ribbon */}
          <Button
            disabled={submitting || text.trim().length < 20}
            onClick={handleDisputeSubmission}
            type="button"
            className="w-full h-10 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2 mt-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Publishing Case Log Update…</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 fill-current/10 shrink-0 stroke-[2.2]" />
                <span>Submit Dispute Case</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
