import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface TopPost {
  post_id: string;
  hypes_week: number;
  preview: string | null;
  author_name: string | null;
}

/**
 * Top Hyped This Week — feed sidebar widget.
 */
export function TopHypedWidget() {
  const [posts, setPosts] = useState<TopPost[]>([]);

  useEffect(() => {
    (async () => {
      const { data: top } = await supabase.from("v_top_hyped_posts_week").select("*").limit(5);
      const ids = (top ?? []).map((t: any) => t.post_id);
      if (!ids.length) return;
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id, text_content, talent_id, talents(full_name)")
        .in("id", ids);
      const pMap = new Map((posts ?? []).map((p: any) => [p.id, p]));
      setPosts(
        (top ?? []).map((t: any) => {
          const p = pMap.get(t.post_id);
          return {
            post_id: t.post_id,
            hypes_week: Number(t.hypes_week),
            preview: p?.text_content?.slice(0, 80) ?? null,
            author_name: p?.talents?.full_name ?? null,
          };
        }),
      );
    })();
  }, []);

  if (posts.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-orange-500" /> Top Hyped This Week
      </h3>
      <div className="space-y-2">
        {posts.map((p) => (
          <Link key={p.post_id} to={`/app/feed?post=${p.post_id}`} className="block hover:bg-muted/50 rounded p-2 -mx-2">
            <div className="text-sm line-clamp-2">{p.preview || "(media post)"}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>{p.author_name}</span>
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="h-3 w-3" />{p.hypes_week}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
