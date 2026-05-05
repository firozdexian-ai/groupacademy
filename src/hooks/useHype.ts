import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * Paid Hype reaction — 1 credit per tap.
 * Splits 80% to creator (earned_balance), 20% to platform.
 */
export function useHype(postId: string, initialCount: number = 0) {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [count, setCount] = useState<number>(initialCount);
  const [isHyping, setIsHyping] = useState(false);

  useEffect(() => setCount(initialCount), [initialCount]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("feed_posts")
        .select("hype_count")
        .eq("id", postId)
        .maybeSingle();
      if (alive && data) setCount(Number((data as any).hype_count ?? 0));
    })();
    return () => {
      alive = false;
    };
  }, [postId]);

  const hype = useCallback(async () => {
    if (!talent?.id) {
      toast({ title: "Sign in to Hype", variant: "destructive" });
      return;
    }
    setIsHyping(true);
    setCount((c) => c + 1); // optimistic
    const { error } = await supabase.rpc("hype_post", { _post_id: postId });
    setIsHyping(false);
    if (error) {
      setCount((c) => Math.max(0, c - 1));
      const msg = error.message || "";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        toast({ title: "Not enough credits", description: "Top up to keep hyping creators.", variant: "destructive" });
      } else if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({ title: "You can't hype yourself", variant: "destructive" });
      } else {
        toast({ title: "Hype failed", description: msg, variant: "destructive" });
      }
      return;
    }
    toast({ title: "🔥 Hyped!", description: "1 credit sent to the creator." });
  }, [talent?.id, postId, toast]);

  return { count, hype, isHyping };
}
