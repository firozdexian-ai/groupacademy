import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function GigOpsTab() {
  const { data: briefs, isLoading } = useQuery({
    queryKey: ["admin-gig-briefs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gig_briefs")
        .select("*, gig_scope_drafts(id, version, recommended_kind, title, estimated_credits, is_chosen)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Gig Ops — AI Scoper Queue</h2>
        <p className="text-sm text-muted-foreground">Raw asks captured from talents, companies, and admins, with AI-generated scope drafts.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : briefs?.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No briefs yet.</Card>
      ) : (
        <div className="space-y-2">
          {briefs?.map((b: any) => {
            const drafts = (b.gig_scope_drafts ?? []).sort((a: any, z: any) => z.version - a.version);
            const top = drafts[0];
            return (
              <Card key={b.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{b.poster_kind}</Badge>
                      <Badge variant="outline" className="capitalize">{b.status}</Badge>
                      {top && <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{drafts.length} draft(s)</Badge>}
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{b.raw_ask}</p>
                    {top && (
                      <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs">
                        <div className="font-semibold">{top.title}</div>
                        <div className="text-muted-foreground capitalize">{top.recommended_kind} · {top.estimated_credits ?? "—"} cr</div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{new Date(b.created_at).toLocaleDateString()}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
