import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Video, FileText, MessageSquare, Trophy, FileCheck } from "lucide-react";

export default function UgcOverviewTab() {
  const counts = useQuery({
    queryKey: ["ugc-overview-counts"],
    queryFn: async () => {
      const out: Record<string, number> = {};
      const queries: Array<[string, string, Record<string, any>?]> = [
        ["videos", "content", { type: "free_video" }],
        ["blog", "blog_posts"],
        ["feed", "feed_posts"],
        ["competitions", "competitions"],
        ["gigs", "gigs"],
        ["submissions", "gig_submissions"],
      ];
      for (const [k, t, filter] of queries) {
        let q: any = supabase.from(t as any).select("*", { count: "exact", head: true });
        if (filter) for (const [c, v] of Object.entries(filter)) q = q.eq(c, v);
        const { count } = await q;
        out[k] = count ?? 0;
      }
      return out;
    },
  });
  const c = counts.data ?? {};
  const tiles = [
    { label: "Free videos", value: c.videos ?? 0, icon: Video },
    { label: "Blog posts", value: c.blog ?? 0, icon: FileText },
    { label: "Feed posts", value: c.feed ?? 0, icon: MessageSquare },
    { label: "Competitions", value: c.competitions ?? 0, icon: Trophy },
    { label: "Gigs", value: c.gigs ?? 0, icon: FileCheck },
    { label: "Submissions", value: c.submissions ?? 0, icon: FileCheck },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">UGC & Contents</h2>
        <p className="text-sm text-muted-foreground">
          Unified view of free videos, blog posts, feed posts, competitions and gig submissions.
          Drafting agents (Free Video, Blog, Feed, Competition, Outreach) are in the Agentic Dashboard chat.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 flex items-center gap-3">
            <t.icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="text-xl font-bold">{t.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
