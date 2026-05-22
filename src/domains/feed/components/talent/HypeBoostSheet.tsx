import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Flame, Loader2 } from "lucide-react";

import { trackError, trackEvent } from "@/lib/errorTracking";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 25, 50];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (qty: number) => Promise<void>;
  contextData?: {
    postId?: string;
    creatorTalentId?: string;
    senderTalentId?: string;
  };
}

/**
 * Premium, performance-hardened User Engagement Multi-Hype Multiplier Sheet.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * honoring the 80/20 creator monetization split and digital workforce notification triggers.
 */
export function HypeBoostSheet({ open, onOpenChange, onConfirm, contextData }: Props) {
  const [picked, setPicked] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  // Standard lifestyle metric capture to map interface engagement metrics safely
  useEffect(() => {
    if (open && contextData?.postId) {
      trackEvent("HypeBoostSheet:opened", {
        postId: contextData.postId,
        senderId: contextData.senderTalentId,
      });
    }
  }, [open, contextData]);

  const submit = async () => {
    if (picked <= 0) return;
    setBusy(true);

    trackEvent("HypeBoostSheet:transaction_initiated", {
      ...contextData,
      quantity: picked,
      economicValueBDT: picked * 2, // 1 credit = 2 BDT peg definition
    });

    try {
      // Execute the parent transactional confirmation hook
      await onConfirm(picked);

      // Invalidate target wallet balances and feed states asynchronously across cache contexts
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success(`Post successfully boosted by ${picked} hypes!`);


      onOpenChange(false);
    } catch (err: any) {
      const parsedError = err instanceof Error ? err.message : String(err);

      // Log transaction fault securely to allow immediate multi-tenant ledger verification
      trackError(parsedError, {
        component: "HypeBoostSheet",
        action: "submit_boost_mutation",
        ...contextData,
        attemptedQuantity: picked,
      });


      toast.error("Couldn't boost the post. Please check your credit balance and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl pt-safe pb-safe-bottom select-none"
      >
        <div className="max-w-md mx-auto space-y-4">
          {/* Section Dynamic Header layout */}
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground">
              <Flame className="h-5 w-5 text-orange-500 animate-pulse drop-shadow-[0_1px_4px_rgba(249,115,22,0.3)]" />
              Boost this post
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
              Send multiple hypes in one go. Each hype costs exactly{" "}
              <span className="font-semibold text-foreground tabular-nums">1 credit</span>. An authoritative{" "}
              <span className="font-semibold text-foreground">80/20 monetization split</span> applies—80% flows
              instantly to the creator's wallet ledger.
            </SheetDescription>
          </SheetHeader>

          {/* Preset Visual Selector Grid Matrix */}
          <div className="grid grid-cols-4 gap-2.5 pt-1">
            {PRESETS.map((n) => {
              const isSelected = picked === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPicked(n);
                    trackEvent("HypeBoostSheet:preset_selected", { value: n });
                  }}
                  className={cn(
                    "rounded-xl py-3 border text-sm font-bold flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary shadow-sm"
                      : "bg-card/40 border-border/40 text-foreground hover:border-primary/30 hover:bg-accent/50",
                  )}
                >
                  <span className="tabular-nums tracking-tight text-sm">{n}&times;</span>
                  <span className="text-[10px] font-medium opacity-70 tabular-nums">{n} cr</span>
                </button>
              );
            })}
          </div>

          {/* Core Transaction Confirmation Button */}
          <Button
            onClick={submit}
            disabled={busy}
            className="w-full mt-2 h-10 gap-2 rounded-xl text-xs font-bold tracking-wide active:scale-[0.99] transition-all shadow-sm"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
            ) : (
              <Flame className="h-3.5 w-3.5 fill-current" />
            )}
            Send {picked} hype{picked > 1 ? "s" : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
