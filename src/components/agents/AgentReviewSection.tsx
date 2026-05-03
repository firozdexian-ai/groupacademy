import { useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * GroUp Academy: Agent Social Proof Node
 * CTO Audit: Standardized data pipeline using React Query to prevent race conditions and memory leaks.
 */

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
  const queryClient = useQueryClient();
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  // CTO FIX: Standardized fetching with React Query for caching and race-condition safety
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["agent-reviews", agentKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_reviews")
        .select("*")
        .eq("agent_key", agentKey)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      const list = (data || []) as Review[];

      // Resolve talent names efficiently
      const ids = Array.from(new Set(list.map((r) => r.talent_id)));
      if (ids.length) {
        const { data: talents } = await supabase.from("talents").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        (talents || []).forEach((t: any) => (map[t.id] = t.full_name));
        list.forEach((r) => (r.talentName = map[r.talent_id] || "Anonymous Learner"));
      }
      return list;
    },
  });

  // CTO FIX: Standardized mutations to automatically refresh the UI after a review is posted
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!talent?.id) throw new Error("Authentication required");
      
      const { error } = await supabase.from("agent_reviews").upsert(
        { agent_key: agentKey, talent_id: talent.id, rating, review_text: text.trim() || null },
        { onConflict: "agent_key,talent_id" },
      );
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artifact logged: Review posted successfully.");
      setIsWriting(false);
      setText("");
      queryClient.invalidateQueries({ queryKey: ["agent-reviews", agentKey] });
    },
    onError: () => {
      toast.error("Failed to sync review. Please try again.");
    }
  });

  return (
    <section className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic text-foreground/80">
            Social Ledger <span className="text-primary">({reviews.length})</span>
          </h2>
        </div>
        {canReview && !isWriting && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsWriting(true)}
            className="h-8 rounded-lg font-black uppercase text-[9px] tracking-widest border-2 hover:bg-primary/5"
          >
            Append Review
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="rounded-[24px] border-2 border-border/40 p-5 space-y-4 bg-card/30 backdrop-blur-sm animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Quality Metric</p>
            <div className="flex gap-1.5">
              {.map((s) => (
                <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110 active:scale-95">
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      s <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-muted-foreground/20",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Document your interaction trajectory..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="rounded-xl border-2 bg-background/50 italic font-medium resize-none"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsWriting(false)} className="font-black uppercase text-[10px] tracking-widest">
              Abort
            </Button>
            <Button 
              size="sm" 
              onClick={() => submitMutation.mutate()} 
              disabled={submitMutation.isPending}
              className="font-black uppercase text-[10px] tracking-widest rounded-xl px-6"
            >
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Ledger"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/20 p-8 text-center bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
            No artifacts recorded in ledger.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reviews.slice(0, 10).map((r) => (
            <div key={r.id} className="rounded-2xl border-2 border-border/10 bg-card/20 p-4 transition-all hover:bg-card/40">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-black uppercase italic tracking-tight">{r.talentName}</p>
                  <div className="flex gap-0.5 mt-1">
                    {.map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-3 w-3",
                          s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {format(new Date(r.created_at), "MMM d, yyyy")}
                </span>
              </div>
              {r.review_text && (
                <p className="text-xs font-medium text-foreground/70 italic leading-relaxed pt-1">
                  "{r.review_text}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}