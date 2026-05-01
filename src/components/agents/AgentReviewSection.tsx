import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  agentKey: string;
  canReview: boolean;
}

interface Review {
  id: string;
  talent_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  talentName?: string;
}

export function AgentReviewSection({ agentKey, canReview }: Props) {
  const { talent } = useTalent();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("agent_reviews")
      .select("*")
      .eq("agent_key", agentKey)
      .order("created_at", { ascending: false });
    const list = (data || []) as Review[];

    // fetch talent names
    const ids = Array.from(new Set(list.map((r) => r.talent_id)));
    if (ids.length) {
      const { data: talents } = await supabase.from("talents").select("id,full_name").in("id", ids);
      const map: Record<string, string> = {};
      (talents || []).forEach((t: any) => (map[t.id] = t.full_name));
      list.forEach((r) => (r.talentName = map[r.talent_id] || "Talent"));
    }
    setReviews(list);
  };

  useEffect(() => {
    load();
  }, [agentKey]);

  const submit = async () => {
    if (!talent?.id) return;
    setSubmitting(true);
    const { error } = await supabase.from("agent_reviews").upsert(
      { agent_key: agentKey, talent_id: talent.id, rating, review_text: text.trim() || null },
      { onConflict: "agent_key,talent_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error("Could not save review");
      return;
    }
    toast.success("Review posted");
    setIsWriting(false);
    setText("");
    load();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Reviews ({reviews.length})</h2>
        {canReview && !isWriting && (
          <Button size="sm" variant="outline" onClick={() => setIsWriting(true)}>
            Leave a review
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="rounded-2xl border border-border/60 p-3 space-y-2 bg-card">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  className={cn(
                    "h-6 w-6",
                    s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setIsWriting(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={submitting}>
              Post review
            </Button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.slice(0, 10).map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/40 bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.talentName}</p>
                <span className="text-[11px] text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-3.5 w-3.5",
                      s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              {r.review_text && <p className="text-sm text-foreground/80">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
