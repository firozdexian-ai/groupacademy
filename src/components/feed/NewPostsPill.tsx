import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";

interface NewPostsPillProps {
  onTap: () => void | Promise<void>;
}

/**
 * Floating pill that appears when new feed_posts are inserted while
 * the user is browsing the feed. Tapping refreshes recommendations and
 * scrolls back to the top.
 */
export function NewPostsPill({ onTap }: NewPostsPillProps) {
  const { talent } = useTalent();
  const [count, setCount] = useState(0);
  const mountedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const channel = supabase
      .channel("feed_posts_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts" },
        (payload) => {
          const row: any = payload.new;
          // Skip the user's own posts (already optimistic in UI)
          if (talent?.userId && row.author_user_id === talent.userId) return;
          if (row.status && row.status !== "published") return;
          if (row.created_at && row.created_at < mountedAt.current) return;
          setCount((c) => c + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [talent?.userId]);

  if (count === 0) return null;

  return (
    <div className="sticky top-2 z-30 flex justify-center pointer-events-none">
      <button
        onClick={async () => {
          await onTap();
          setCount(0);
          mountedAt.current = new Date().toISOString();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-in slide-in-from-top-4",
          "active:scale-95 transition-transform",
        )}
      >
        <ArrowUp className="h-3.5 w-3.5" />
        {count} new {count === 1 ? "post" : "posts"}
      </button>
    </div>
  );
}
