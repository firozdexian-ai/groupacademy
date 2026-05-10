/**
 * Admin Learn → Moderation tab.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LearningModerationTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("content_reports").select("*").order("created_at", { ascending: false }).limit(100);
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: "dismissed" | "removed", scope?: string, scope_id?: string) => {
    await supabase.from("content_reports").update({ status, resolved_at: new Date().toISOString() }).eq("id", id);
    if (status === "removed" && scope && scope_id) {
      const table = ({ post: "discussion_posts", thread: "discussion_threads", question: "lesson_questions", answer: "lesson_answers" } as any)[scope];
      if (table) await supabase.from(table).update({ is_hidden: true }).eq("id", scope_id);
    }
    toast({ title: status === "removed" ? "Hidden + report closed" : "Report dismissed" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold inline-flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" />Reports ({rows.filter(r => r.status === "open").length} open)</h2>
      {rows.length === 0 ? <Card className="p-4 text-xs text-muted-foreground">No reports.</Card> :
        rows.map(r => (
          <Card key={r.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.scope}: {r.scope_id.slice(0, 8)}</p>
                <p className="text-[11px] text-muted-foreground">{r.reason}</p>
                <Badge variant="outline" className="text-[10px] mt-1">{r.status}</Badge>
              </div>
              {r.status === "open" && (
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")}>Dismiss</Button>
                  <Button size="sm" variant="destructive" onClick={() => resolve(r.id, "removed", r.scope, r.scope_id)}>Hide content</Button>
                </div>
              )}
            </div>
          </Card>
        ))
      }
    </div>
  );
}

export default LearningModerationTab;
