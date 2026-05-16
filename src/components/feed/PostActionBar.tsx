import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useHype } from "@/hooks/useHype";
import { usePostReactions } from "@/hooks/usePostReactions";
import { ReactionBar } from "./ReactionBar";
import { CommentList } from "./CommentList";
import { HypeBoostSheet } from "./HypeBoostSheet";
import { recordShare } from "@/hooks/useCreatorAnalytics";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  if (n < 1000) return n.toLocaleString();
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.floor(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

interface Props {
  postId: string;
  initialHypeCount?: number;
  postTitle: string;
  postUrl: string;
  postDescription?: string;
}

const HOLD_MS = 450;

/**
 * Premium, performance-hardened Interactive Engagement Action Bar.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * ensuring strict credit ledger alignment and realtime cache cohesion across viewports.
 */
export function PostActionBar({ postId, initialHypeCount = 0, postTitle, postUrl, postDescription }: Props) {
  const queryClient = useQueryClient();
  const { count, hype, isHyping } = useHype(postId, initialHypeCount);
  const { reactions, userReaction, toggleReaction, isLoading: reactionsLoading } = usePostReactions(postId);

  const totalReactions = Object.values(reactions).reduce((s, n) => s + n, 0);
  const [hasHyped, setHasHyped] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);

  // Trace card interaction impressions under Automated Efficiency parameters
  useEffect(() => {
    if (postId) {
      trackEvent("post_action_bar_rendered", { postId });
    }
  }, [postId]);

  const startHold = () => {
    heldRef.current = false;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      trackEvent("hype_hold_gesture_triggered", { postId });
      setBoostOpen(true);
    }, HOLD_MS);
  };

  const endHold = async () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (!heldRef.current) {
      trackEvent("hype_tap_detected", { postId });
      try {
        await hype();
        setHasHyped(true);
        // Force synchronous invalidations across connected wallet interfaces
        queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      } catch (err) {
        trackError(err instanceof Error ? err : String(err), {
          component: "PostActionBar",
          action: "execute_single_hype",
          postId,
        });
      }
    }
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    };
  }, []);

  const sendBoost = async (qty: number) => {
    trackEvent("hype_boost_sequential_burst_started", { postId, quantity: qty });
    try {
      for (let i = 0; i < qty; i++) {
        void hype();
        await new Promise((r) => setTimeout(r, 130));
      }
      setHasHyped(true);

      // Post-burst atomic sync over server state snapshots
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PostActionBar",
        action: "execute_boost_sequence",
        postId,
        requestedQty: qty,
      });
    }
  };

  const handleShare = async () => {
    const fullUrl = postUrl.startsWith("http") ? postUrl : `${window.location.origin}${postUrl}`;
    const payload = {
      title: postTitle,
      text: postDescription || postTitle,
      url: fullUrl,
    };

    trackEvent("post_share_intent_triggered", { postId, postUrl: fullUrl });

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(payload);
        recordShare(postId, "native");
        return;
      }
      await navigator.clipboard.writeText(fullUrl);
      recordShare(postId, "copy_link");
      toast.success("Link copied to clipboard");
    } catch (err) {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success("Link copied to clipboard");
      } catch (clipErr) {
        trackError(err instanceof Error ? err : String(err), {
          component: "PostActionBar",
          action: "handleShare_clipboard_fallback",
          postId,
        });
        toast.error("Couldn't process sharing link.");
      }
    }
  };

  return (
    <div className="w-full space-y-2 select-none sm:select-text antialiased">
      {totalReactions > 0 && (
        <div className="flex items-center justify-between gap-2 pt-2 px-1 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider select-none animate-in fade-in duration-300">
          <span>
            {totalReactions.toLocaleString()} {totalReactions === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}

      <div className="pt-0.5 select-none">
        <ReactionBar
          reactions={reactions}
          userReaction={userReaction}
          onReact={(type) => {
            trackEvent("reaction_toggled", { postId, type });
            toggleReaction(type);
          }}
          disabled={reactionsLoading}
          inline
        />
      </div>

      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/30 select-none">
        {/* Tactical Hype Multiplier Trigger Anchor */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isHyping}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          className={cn(
            "flex-1 h-9 gap-1.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer transform-gpu active:scale-95 touch-manipulation",
            hasHyped
              ? "text-rose-600 bg-rose-500/10 hover:bg-rose-500/15"
              : "text-muted-foreground/80 hover:text-orange-600 hover:bg-orange-500/10 dark:hover:text-orange-500",
          )}
          title="Tap to Hype · Hold to Boost"
        >
          <Flame
            className={cn(
              "h-4 w-4 transition-transform group-hover:scale-105",
              (hasHyped || isHyping) && "fill-current animate-pulse",
            )}
          />
          <span>{hasHyped ? "Hyped" : "Hype"}</span>
          {count > 0 && (
            <span className="text-muted-foreground/60 font-semibold tabular-nums">&bull; {formatCount(count)}</span>
          )}
        </Button>

        {/* Comment Overlay Sheet Trigger */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            trackEvent("comment_panel_viewed", { postId });
            setCommentsOpen(true);
          }}
          className="flex-1 h-9 gap-1.5 rounded-xl text-xs font-bold tracking-tight text-muted-foreground/80 hover:text-primary hover:bg-primary/5 cursor-pointer active:scale-95 transition-transform"
        >
          <MessageCircle className="h-4 w-4 stroke-[2.2]" />
          <span>Comment</span>
        </Button>

        {/* System Outreach Sharing Anchor */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="flex-1 h-9 gap-1.5 rounded-xl text-xs font-bold tracking-tight text-muted-foreground/80 hover:text-primary hover:bg-primary/5 cursor-pointer active:scale-95 transition-transform"
        >
          <Share2 className="h-4 w-4 stroke-[2.2]" />
          <span>Share</span>
        </Button>
      </div>

      {/* Structured Multiplier Sheet Matrix Context Container */}
      <HypeBoostSheet open={boostOpen} onOpenChange={setBoostOpen} onConfirm={sendBoost} contextData={{ postId }} />

      {/* Community Conversation Pipeline Drawer Panel Layer */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl max-h-[85vh] max-h-[85svh] overflow-y-auto pt-safe pb-safe-bottom"
          style={{ contentVisibility: "auto" }}
        >
          <SheetHeader className="text-left pb-2 border-b border-border/20 select-none">
            <SheetTitle className="text-sm font-bold tracking-tight text-foreground text-center">
              Community Discussion
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <CommentList postId={postId} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
