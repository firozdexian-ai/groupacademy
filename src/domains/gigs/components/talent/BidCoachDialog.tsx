import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { aiBidCoach } from "@/domains/gigs/api/gigsApi";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gigId: string;
  gigKind?: "marketplace" | "quick";
  initialDraft?: string;
  onAccept: (improved: { text: string; rationale: string; proof_links: any[] }) => void;
}

/**
 * Premium, performance-hardened AI Bid Coaching Dialogue Modal.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * ensuring tight error boundary tracing and responsive safe-area layout constraints.
 */
export function BidCoachDialog({
  open,
  onOpenChange,
  gigId,
  gigKind = "marketplace",
  initialDraft = "",
  onAccept,
}: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [improved, setImproved] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronize incoming proposal workspace text modifications cleanly safely
  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
      trackEvent("bid_coach_dialog_opened", { gigId, gigKind, hasInitialDraft: !!initialDraft });
    }
  }, [open, initialDraft, gigId, gigKind]);

  if (!gigId) {
    trackError("BidCoachDialog mounted without valid gig identifier parameters.", {
      component: "BidCoachDialog",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleImproveProtocol = async () => {
    if (!draft.trim()) {
      toast.error("Please insert a draft statement text to initiate AI coaching parameters.");
      return;
    }

    setLoading(true);
    trackEvent("bid_coach_generation_requested", { gigId, gigKind, draftLength: draft.length });

    try {
      // Direct RPC execution route mapping over the decentralized serverless client
      let data: any;
      try {
        data = await aiBidCoach({ gig_id: gigId, gig_kind: gigKind, draft_text: draft.trim() });
      } catch (edgeError) {
        throw edgeError;
      }

      const parsedData = data as any;

      // 1. Boundary Condition: Intercept structural billing edge limits gracefully
      if (parsedData?.error === "rate_limited") {
        trackEvent("bid_coach_generation_rate_limited", { gigId });
        toast.error("Traffic congestion limit reached. Please re-trigger optimization in a minute.");
        return;
      }

      if (parsedData?.error === "credits_exhausted") {
        trackEvent("bid_coach_generation_credits_exhausted", { gigId });
        toast.error("AI credit allocations exhausted. Refuel your wallet balance to unlock processing nodes.");
        return;
      }

      setImproved(parsedData);
      trackEvent("bid_coach_generation_success", { gigId, outLength: parsedData?.improved_text?.length });
    } catch (err: any) {
      const exceptionMessage = err instanceof Error ? err.message : String(err);

      // 2. Telemetry Ingestion: Forward processing exceptions to the administrative logs
      trackError(exceptionMessage, {
        component: "BidCoachDialog",
        action: "invoke_ai_bid_coach_edge_fn",
        gigId,
        gigKind,
      });

      toast.error(exceptionMessage || "Couldn't reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProtocol = () => {
    if (!improved?.improved_text) return;

    trackEvent("bid_coach_improvement_accepted", { gigId, gigKind });

    onAccept({
      text: improved.improved_text,
      rationale: improved.rationale || "",
      proof_links: improved.proof_links || [],
    });

    onOpenChange(false);
    setImproved(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setImproved(null);
      }}
    >
      <DialogContent className="max-w-lg w-[94vw] sm:w-full p-5 border border-border/40 bg-background/98 backdrop-blur-xl rounded-2xl shadow-2xl selection:bg-primary/20 max-h-[90vh] max-h-[90svh] overflow-y-auto pt-safe pb-safe-bottom">
        {/* Dynamic Section Header layout */}
        <DialogHeader className="text-left select-none">
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground">
            <Sparkles className="w-4 h-4 text-primary animate-pulse drop-shadow-[0_1px_4px_rgba(var(--primary-rgb),0.2)]" />
            <span>AI Bid Coach Optimization</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-normal mt-1">
            We will dynamically refine your introduction statement by indexing your verified skill sets, mastery
            benchmarks, and previous ecosystem wins.
          </DialogDescription>
        </DialogHeader>

        {/* Input Textarea Tracking Container Panel */}
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-muted-foreground/90 uppercase tracking-wider pl-0.5 select-none">
              Your Professional Draft
            </label>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              disabled={loading}
              placeholder="Provide a few core sentences outlining your methodology, workflow capacity, or project timeline strategy..."
              className="resize-none rounded-xl text-xs sm:text-sm font-medium border-border/40 bg-card/30 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 leading-relaxed"
            />
          </div>

          <Button
            onClick={handleImproveProtocol}
            disabled={loading || !draft.trim()}
            className="w-full h-10 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                <span>Analyzing Competency Logs…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-primary-foreground/10" />
                <span>Refine Proposal With AI</span>
              </>
            )}
          </Button>

          {/* AI Response Block Expansion Track */}
          {improved && (
            <div className="border border-primary/20 rounded-2xl p-4 space-y-3.5 bg-primary/[0.01] dark:bg-primary/[0.003] shadow-inner animate-in zoom-in-95 duration-200 text-left">
              <div className="flex items-center justify-between select-none">
                <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider pl-0.5">
                  Optimized Proposal Variant
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-extrabold bg-primary/5 text-primary border-primary/20 uppercase tracking-widest px-2 shadow-sm"
                >
                  AI ENGINE
                </Badge>
              </div>

              <p className="text-xs sm:text-sm font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed select-text select-none break-words">
                {improved.improved_text}
              </p>

              {improved.rationale && (
                <div className="p-3 bg-muted/40 border border-border/30 rounded-xl">
                  <p className="text-[11px] font-semibold text-muted-foreground/90 leading-relaxed select-text italic">
                    <span className="font-bold not-italic text-foreground/80 block text-[10px] uppercase tracking-wider mb-0.5">
                      Strategy Rationale
                    </span>
                    &ldquo;{improved.rationale}&rdquo;
                  </p>
                </div>
              )}

              {/* Tag Array Attributes Block */}
              {improved.key_strengths?.length > 0 && (
                <div className="space-y-1.5 select-none">
                  <span className="text-[9px] font-extrabold text-muted-foreground/70 uppercase tracking-wider block pl-0.5">
                    Highlighted Credentials
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {improved.key_strengths.map((strengthStr: string, index: number) => {
                      if (!strengthStr) return null;
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-border/20 text-muted-foreground bg-muted/30"
                        >
                          {strengthStr.trim()}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dialogue Actions Ribbon Control Strip */}
              <div className="flex gap-2.5 pt-1.5 select-none">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    trackEvent("bid_coach_retry_clicked", { gigId });
                    setImproved(null);
                  }}
                  className="h-8 text-xs font-bold px-3.5 rounded-xl border-border/60 hover:bg-accent transition-all cursor-pointer"
                >
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleAcceptProtocol}
                  className="h-8 text-xs font-bold px-4 rounded-xl gap-1 shadow-sm active:scale-95 transition-transform cursor-pointer ml-auto"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Apply Variant</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
