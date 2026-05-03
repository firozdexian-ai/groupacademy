import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function JobsUploadApprovalTab() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["jobs-pending-approval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs" as any)
        .select("id,title,company_name,location,is_active,is_featured,created_at")
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const setActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("jobs" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["jobs-pending-approval"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = list.data ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jobs Upload & Approval</h2>
        <p className="text-sm text-muted-foreground">
          Inactive (pending) jobs awaiting moderation. Approve to publish or keep inactive.
        </p>
      </div>
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No jobs awaiting approval.</Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((j) => (
            <Card key={j.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{j.title}</p>
                  <Badge variant="outline" className="text-[10px]">inactive</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {j.company_name ?? "—"} · {j.location ?? ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" title="Approve & publish"
                  onClick={() => setActive.mutate({ id: j.id, is_active: true })}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </Button>
                <Button size="sm" variant="ghost" title="Keep inactive"
                  onClick={() => setActive.mutate({ id: j.id, is_active: false })}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
