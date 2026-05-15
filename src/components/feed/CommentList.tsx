import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  tip_count: number;
  tip_credits: number;
  author_talent_id: string;
  author?: { full_name: string | null; profile_photo_url: string | null };
}

export function CommentList({ postId }: { postId: string }) {
  const { talent } = useTalent();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select(
        "id, body, created_at, tip_count, tip_credits, author_talent_id, talents:author_talent_id(full_name, profile_photo_url)",
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(50);
    setComments((data ?? []).map((c: any) => ({ ...c, author: c.talents })));
    setLoading(false);
  };

  // Auto-load on mount (sheet opening this component is already a deliberate action)
  useEffect(() => {
    load();
    const channel = supabase
      .channel(`post_comments_${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    if (!talent?.id) {
      toast.error("Sign in required");
      return;
    }
    setPosting(true);
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_talent_id: talent.id, body: text });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    load();
  };

  const tip = async (commentId: string, amount: number) => {
    const { error } = await supabase.rpc("tip_comment", { _comment_id: commentId, _amount: amount });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Tipped ${amount} credits`);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="min-h-[40px] text-sm"
        />
        <Button size="sm" onClick={submit} disabled={posting || !body.trim()}>
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Be the first to comment.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2 items-start text-xs bg-muted/30 rounded-md p-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={c.author?.profile_photo_url ?? undefined} />
              <AvatarFallback>{c.author?.full_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{c.author?.full_name ?? "Talent"}</div>
              <div className="text-foreground/80 break-words">{c.body}</div>
              {c.tip_count > 0 && (
                <div className="text-[10px] text-primary mt-0.5">
                  🎁 {c.tip_count} tips · {c.tip_credits} credits
                </div>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                  <Gift className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 flex gap-1">
                {[2, 5, 10].map((a) => (
                  <Button key={a} size="sm" variant="outline" onClick={() => tip(c.id, a)}>
                    {a}cr
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        ))
      )}
    </div>
  );
}
