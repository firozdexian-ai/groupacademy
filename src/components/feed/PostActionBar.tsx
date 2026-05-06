import { useEffect, useRef, useState } from "react";
import { Flame, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useHype } from "@/hooks/useHype";
import { CommentList } from "./CommentList";
import { HypeBoostSheet } from "./HypeBoostSheet";
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

export function PostActionBar({ postId, initialHypeCount = 0, postTitle, postUrl, postDescription }: Props) {
  const { count, hype, isHyping } = useHype(postId, initialHypeCount);
  const [hasHyped, setHasHyped] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);

  const startHold = () => {
    heldRef.current = false;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      setBoostOpen(true);
    }, HOLD_MS);
  };

  const endHold = async () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (!heldRef.current) {
      // simple tap
      await hype();
      setHasHyped(true);
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
    for (let i = 0; i < qty; i++) {
      // sequential to keep credit math safe
      await hype();
    }
    setHasHyped(true);
  };

  const handleShare = async () => {
    const fullUrl = postUrl.startsWith("http") ? postUrl : `${window.location.origin}${postUrl}`;
    const payload = {
      title: postTitle,
      text: postDescription || postTitle,
      url: fullUrl,
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(payload);
        return;
      }
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied");
    } catch {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success("Link copied");
      } catch {
        toast.error("Couldn't share");
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/40">
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
            "flex-1 h-9 gap-1.5 rounded-lg text-xs font-semibold transition-all",
            hasHyped
              ? "text-rose-600 bg-rose-500/10 hover:bg-rose-500/15"
              : "text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10",
          )}
          title="Tap to Hype · Hold to Boost"
        >
          <Flame className={cn("h-4 w-4", (hasHyped || isHyping) && "fill-current")} />
          <span>{hasHyped ? "Hyped" : "Hype"}</span>
          {count > 0 && <span className="text-muted-foreground font-normal">· {formatCount(count)}</span>}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCommentsOpen(true)}
          className="flex-1 h-9 gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShareOpen(true)}
          className="flex-1 h-9 gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </div>

      <HypeBoostSheet open={boostOpen} onOpenChange={setBoostOpen} onConfirm={sendBoost} />

      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            <CommentList postId={postId} />
          </div>
        </SheetContent>
      </Sheet>

      {shareOpen && (
        <ShareSheet
          title={postTitle}
          url={postUrl}
          description={postDescription}
          controlledOpen={shareOpen}
          onOpenChange={setShareOpen}
          hideTrigger
        />
      )}
    </>
  );
}
