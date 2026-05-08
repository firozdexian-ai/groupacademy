import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

export type HypeContentType = "post" | "course" | "video" | "blog";

/**
 * Universal Hype reaction — 1 credit per tap.
 * Posts: 80% to creator, 20% platform (delegates to hype_post via hype_content RPC).
 * Other content: 100% to platform.
 */
export function useContentHype(
  contentType: HypeContentType,
  contentId: string,
  initialCount: number = 0,
) {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [count, setCount] = useState<number>(initialCount);
  const [isHyping, setIsHyping] = useState(false);

  useEffect(() => setCount(initialCount), [initialCount]);

  const hype = useCallback(async () => {
    if (!talent?.id) {
      toast({ title: "Sign in to Hype", variant: "destructive" });
      return;
    }
    setIsHyping(true);
    setCount((c) => c + 1);
    const { error } = await (supabase as any).rpc("hype_content", {
      _content_type: contentType,
      _content_id: contentId,
    });
    setIsHyping(false);
    if (error) {
      setCount((c) => Math.max(0, c - 1));
      const msg = error.message || "";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        toast({ title: "Not enough credits", description: "Top up to keep hyping.", variant: "destructive" });
      } else if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({ title: "You can't hype yourself", variant: "destructive" });
      } else if (msg.includes("ALREADY_HYPED")) {
        toast({ title: "Already hyped", description: "You've already hyped this." });
      } else {
        toast({ title: "Hype failed", description: msg, variant: "destructive" });
      }
      return;
    }
    toast({ title: "🔥 Hype sent · -1 credit" });
  }, [talent?.id, contentType, contentId, toast]);

  return { count, hype, isHyping };
}
