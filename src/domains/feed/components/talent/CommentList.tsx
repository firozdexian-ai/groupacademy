import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tipComment, listPostComments, insertPostComment } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Gift, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  tip_count: number;
  tip_credits: number;
  author_talent_id: string;
  author?: { full_name: string | null; profile_photo_url: string | null };
}

interface CommentListProps {
  postId: string;
}

/**
 * High-performance discussion thread component supporting real-time messaging
 * and micro-tipping with built-in wallet verification balance checks.
 */
export function CommentList({ postId }: CommentListProps) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [isPostingLocal, setIsPostingLocal] = useState(false);

  // Synchronize server commentary list with optimistic fallback states
  const { data: comments = [], isLoading: loading } = useQuery<Comment[]>({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      try {
        const data = await listPostComments(postId, 50);
        return (data ?? []).map((c: any) => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          tip_count: c.tip_count,
          tip_credits: c.tip_credits,
          author_talent_id: c.author_talent_id,
          author: c.talents,
        }));
      } catch (err: any) {
        trackError(err?.message ?? String(err), { component: "CommentList", action: "fetch_comments", postId });
        throw err;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Listen for real-time community responses via PostgreSQL replication channels
  useEffect(() => {
    const channel = supabase
      .channel(`post_comments_realtime_${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  const submitComment = async () => {
    const text = body.trim();
    if (!text) return;
    if (!talent?.id) {
      toast.error("Please sign in to write a comment");
      return;
    }

    setIsPostingLocal(true);
    trackEvent("comment_create_started", { postId, talentId: talent.id });

    const { error } = await insertPostComment({ postId, authorTalentId: talent.id, body: text });

    setIsPostingLocal(false);

    if (error) {
      trackError(error.message, { component: "CommentList", action: "submit_comment", postId, talentId: talent.id });
      toast.error(error.message);
      return;
    }

    setBody("");
    queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    toast.success("Comment published");
  };

  const handleTipComment = async (commentId: string, amount: number) => {
    if (!talent?.id) {
      toast.error("Sign in to tip credits");
      return;
    }

    trackEvent("comment_tip_processed", { commentId, amount, senderTalentId: talent.id });

    let error: any = null;
    try {
      await tipComment({ _comment_id: commentId, _amount: amount });
    } catch (e) {
      error = e;
    }

    if (error) {
      trackError(error.message, {
        component: "CommentList",
        action: "tip_comment_rpc_fault",
        commentId,
        amount,
        senderTalentId: talent.id,
      });
      toast.error(error.message || "Could not complete tip. Please check your credit balance.");
      return;
    }

    toast.success(`Tipped ${amount} credits.`);

    // Refresh comments list and top wallet balance values simultaneously
    queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
  };

  return (
    <div className="space-y-4 antialiased">
      {/* Input Field Form */}
      <div className="flex gap-2 items-end bg-muted/20 dark:bg-muted/5 p-2 rounded-xl border border-border/30 backdrop-blur-md">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="min-h-[44px] max-h-[120px] text-xs leading-relaxed border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 w-full text-foreground placeholder:text-muted-foreground/70"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitComment();
            }
          }}
        />
        <Button
          size="sm"
          onClick={submitComment}
          disabled={isPostingLocal || !body.trim()}
          className="h-8 px-3 shrink-0 rounded-lg active:scale-95 transition-transform"
        >
          {isPostingLocal ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline mr-1.5 text-xs font-medium">Post</span>
              <Send className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>

      {/* Dynamic Thread Feed View */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/80 font-medium tracking-wide">
          <InlineSpinner size="sm" className="mr-2.5" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/40 bg-muted/5 select-none">
          <p className="text-xs text-muted-foreground/80 font-medium">
            Be the first to share your thoughts with the community.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/60">
          {comments.map((c) => (
            <div
              key={c.id}
              className="group flex gap-3 items-start text-xs bg-card/40 border border-border/40 backdrop-blur-sm rounded-xl p-3 hover:border-border/80 hover:bg-card/70 shadow-sm transition-all duration-200 animate-in fade-in-50 duration-300 content-visibility-auto"
            >
              <Avatar className="h-7 w-7 border border-border/50 shadow-sm">
                <AvatarImage src={c.author?.profile_photo_url ?? undefined} alt="Author image" />
                <AvatarFallback className="font-bold text-[10px] bg-primary/10 text-primary">
                  {c.author?.full_name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground tracking-tight">
                    {c.author?.full_name ?? "Verified Member"}
                  </span>
                  <span className="text-[10px] text-muted-foreground scale-95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="text-foreground/90 break-words leading-relaxed text-[13px] whitespace-pre-wrap selection:bg-primary/20">
                  {c.body}
                </div>

                {c.tip_count > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full mt-1.5 select-none tabular-nums animate-in slide-in-from-left-2 duration-300">
                    <span>🎁</span>
                    <span>
                      {c.tip_count} tip{c.tip_count === 1 ? "" : "s"}
                    </span>
                    <span className="text-muted-foreground/60 font-normal">•</span>
                    <span>{c.tip_credits} cr</span>
                  </div>
                )}
              </div>

              {/* Tipping interface popover menu */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground/70 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all opacity-80 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Tip this comment"
                  >
                    <Gift className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-1.5 flex gap-1.5 bg-background/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl animate-in fade-in-50 zoom-in-95 duration-200"
                  side="left"
                  align="center"
                >
                  {[2, 5, 10].map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      variant="outline"
                      onClick={() => handleTipComment(c.id, amount)}
                      className="h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-lg bg-card border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-90 select-none tabular-nums transition-all"
                    >
                      +{amount}cr
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}