import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { openVerificationAppeal } from "@/domains/gigs/repo/gigsRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface Verification {
  id: string;
  verdict: string;
  score: number | null;
  rationale: string | null;
  criteria_results: Array<{ criterion: string; pass: boolean; note?: string }>;
  risk_flags: string[];
  suggested_revisions: string[];
}

const verdictMeta: Record<string, { label: string; icon: any; tone: string; className: string }> = {
  pending: {
    label: "Verifying Account...",
    icon: Clock,
    tone: "secondary",
    className: "bg-muted text-muted-foreground border-border/40",
  },
  auto_approved: {
    label: "Approved Systematically",
    icon: CheckCircle2,
    tone: "default",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  human_approved: {
    label: "Approved Verified",
    icon: CheckCircle2,
    tone: "default",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  auto_revise: {
    label: "Revision Required",
    icon: AlertTriangle,
    tone: "secondary",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  escalated: {
    label: "Under Review Panel",
    icon: Clock,
    tone: "secondary",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  human_rejected: {
    label: "Audit Rejected",
    icon: XCircle,
    tone: "destructive",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
};

/**
 * GroUp Academy: Mission Audit Ledger (VerificationVerdictCard)
 * CTO Reference: Authoritative interface component tracking verification audit logs and appeal actions.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function VerificationVerdictCard({ verification }: { verification: Verification }) {
  const queryClient = useQueryClient();
  const [appealReason, setAppealReason] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor verification lookup states safely over event streams
  useEffect(() => {
    if (verification?.id) {
      trackEvent("verification_verdict_card_rendered", {
        verificationId: verification.id,
        verdictMode: verification.verdict,
        hasScore: verification.score !== null,
      });
    }
  }, [verification]);

  if (!verification || !verification.id) {
    trackError("VerificationVerdictCard mounted without an explicit validation index parameter.", {
      component: "VerificationVerdictCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const meta = verdictMeta[verification.verdict] ?? verdictMeta.pending;
  const Icon = meta.icon;

  const handleAppealProtocol = async () => {
    const sanitizedReasonText = appealReason.trim();
    if (!sanitizedReasonText) return;

    if (sanitizedReasonText.length < 20) {
      toast.error("Please supply a rigorous narrative statement describing the event context (≥ 20 characters).");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Registering appeal case into adjudication ledger...");

    trackEvent("verification_appeal_submission_requested", { verificationId: verification.id });

    try {
      // Direct criteria query execution mapping over decentralized Supabase RPC schema
      await openVerificationAppeal({
        verificationId: verification.id,
        reason: sanitizedReasonText,
        evidence: [],
      });

      trackEvent("verification_appeal_submission_success", { verificationId: verification.id });

      // Automated Efficiency: Broadcast explicit query updates across cache pools instantly
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["share-active-courses"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Appeal case logged successfully. A reviewer panel will adjudicate status updates.", {
        id: toastId,
      });

      setOpen(false);
      setAppealReason("");
    } catch (err: any) {
      const parsedMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedMsg, {
        component: "VerificationVerdictCard",
        action: "invoke_open_verification_appeal_rpc",
        verificationId: verification.id,
      });

      toast.error(`Arbitration deployment fault: ${parsedMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEligibleForAppeal = verification.verdict === "human_rejected" || verification.verdict === "auto_revise";

  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm relative overflow-hidden select-none text-left w-full max-w-full">
      {/* Immersive Badge Status Row */}
      <div className="flex items-center gap-2 flex-wrap select-none">
        <Icon
          className={cn(
            "h-4 w-4 stroke-[2.2]",
            meta.tone === "destructive"
              ? "text-rose-500"
              : meta.tone === "secondary"
                ? "text-amber-500 animate-pulse"
                : "text-emerald-500",
          )}
        />
        <Badge
          variant={meta.tone as any}
          className={cn(
            "text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-md border h-5.5 shadow-sm select-none",
            meta.className,
          )}
        >
          {meta.label}
        </Badge>
        {verification.score != null && (
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold tracking-wide rounded-md border border-border/40 text-foreground/80 bg-background/40 px-2.5 h-5.5 tabular-nums shadow-inner select-none"
          >
            Synapse Fit: {Math.round(verification.score)} Score
          </Badge>
        )}
      </div>

      {verification.rationale && (
        <p className="text-xs font-medium text-muted-foreground/90 leading-relaxed select-text selection:bg-primary/20 mt-2.5 break-words">
          {verification.rationale}
        </p>
      )}

      {/* Criteria Breakdown Grid List Array */}
      {verification.criteria_results?.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-border/10 mt-3 w-full min-w-0">
          <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider block pl-0.5 select-none">
            Audit Metric Compliance
          </span>
          <ul className="space-y-1.5 text-xs font-bold text-foreground/90 tracking-tight w-full">
            {verification.criteria_results.map((criterionItem, index) => {
              if (!criterionItem || !criterionItem.criterion) return null;
              return (
                <li key={index} className="flex items-start gap-2 w-full group min-w-0">
                  {criterionItem.pass ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 stroke-[2.5]" />
                  )}
                  <span className="break-all font-semibold leading-tight select-text flex-1">
                    <strong className="font-bold text-foreground pr-1">{criterionItem.criterion}</strong>
                    {criterionItem.note && (
                      <span className="text-muted-foreground/80 font-medium font-mono text-[11px] block sm:inline sm:pl-1">
                        &mdash; {criterionItem.note}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Risk Alert Flag Badges Array Container */}
      {verification.risk_flags?.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-border/10 mt-3 select-none">
          <span className="text-[9px] font-extrabold text-rose-500/80 uppercase tracking-wider block pl-0.5">
            Anomaly Anomaly Risk Signatures
          </span>
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {verification.risk_flags.map((flagStr) => {
              if (!flagStr) return null;
              return (
                <Badge
                  key={flagStr}
                  variant="destructive"
                  className="text-[10px] font-extrabold bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg px-2 py-0.5 tracking-wide shadow-sm uppercase"
                >
                  {flagStr.replace(/_/g, " ")}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* System Suggested Iterations Block */}
      {verification.suggested_revisions?.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-muted/10 p-3 text-xs text-left mt-3 select-text select-none animate-in slide-in-from-bottom-2 duration-200 w-full">
          <div className="font-bold text-foreground/80 text-[11px] uppercase tracking-wider mb-1.5 pl-0.5 select-none flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 stroke-[2.2]" />
            <span>Suggested System Revisions</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground/90 font-medium leading-relaxed select-text selection:bg-primary/10 break-words">
            {verification.suggested_revisions.map((revisionStr, index) => {
              if (!revisionStr) return null;
              return <li key={index}>{revisionStr}</li>;
            })}
          </ul>
        </div>
      )}

      {/* Governance Intercept Action Ribbon Trigger Drawer */}
      {isEligibleForAppeal && (
        <div className="pt-3 border-t border-border/10 mt-3 select-none">
          <Sheet
            open={open}
            onOpenChange={(visibleState) => {
              setOpen(visibleState);
              if (!visibleState) {
                trackEvent("verification_appeal_modal_dismissed", { verificationId: verification.id });
                setAppealReason("");
              }
            }}
          >
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="w-full sm:w-auto h-8 px-4 rounded-xl text-xs font-bold border-border/60 hover:bg-accent cursor-pointer active:scale-95 transition-transform shadow-sm"
              >
                <span>Appeal Audit Verdict</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl max-h-[85vh] max-h-[85svh] overflow-y-auto pt-safe pb-safe-bottom shadow-2xl select-none"
              style={{ contentVisibility: "auto" }}
            >
              <div className="max-w-md mx-auto">
                <SheetHeader className="text-center mb-5">
                  <div className="mx-auto w-12 h-1 bg-muted/60 rounded-full mb-2" />
                  <SheetTitle className="text-sm font-bold tracking-tight text-foreground flex items-center justify-center gap-2 uppercase tracking-wider">
                    <Scale className="h-4 w-4 text-primary animate-pulse stroke-[2.2]" />
                    <span>Dispute Audit Settlement</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground/90 leading-normal">
                    Provide precise contextual counter-arguments regarding the rejection markers or metric failures
                    flagged during systematic verification checks.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 mt-2">
                  <div className="space-y-1 text-left w-full">
                    <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
                      Factual Narrative Arguments
                    </label>
                    <Textarea
                      placeholder="Detail specific evidence paths, missing portfolio files link validation references, or transactional ledger context indicators cleanly..."
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      rows={4}
                      disabled={isSubmitting}
                      className="resize-none rounded-xl text-xs sm:text-sm font-medium border border-border/40 bg-card/30 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 leading-relaxed p-4 select-text"
                    />
                  </div>

                  <Button
                    onClick={handleAppealProtocol}
                    disabled={isSubmitting || !appealReason.trim()}
                    type="button"
                    className="w-full h-10 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-transform select-none cursor-pointer gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                        <span>Publishing Case Log Update…</span>
                      </>
                    ) : (
                      <span>Submit Arbitration Appeal</span>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </Card>
  );
}
