import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const STAGES = ["intake","shortlisted","docs_in_progress","submitted","offer","visa","enrolled","declined"];

export default function AbroadApplicationsTab() {
  const qc = useQueryClient();
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [country, setCountry] = useState("");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-abroad-apps", stageFilter, country],
    queryFn: async () => {
      let q = supabase.from("abroad_applications").select("*").order("updated_at", { ascending: false }).limit(200);
      if (stageFilter !== "all") q = q.eq("stage", stageFilter);
      if (country) q = q.ilike("target_country", `%${country}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: counsellors } = useQuery({
    queryKey: ["admin-counsellors"],
    queryFn: async () => {
      const { data } = await supabase.from("abroad_counsellors").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const assign = useMutation({
    mutationFn: async ({ appId, userId }: { appId: string; userId: string }) => {
      const { error } = await supabase.rpc("assign_abroad_counsellor", {
        _application_id: appId,
        _counsellor_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assigned");
      qc.invalidateQueries({ queryKey: ["admin-abroad-apps"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Abroad Applications</h2>
        <p className="text-sm text-muted-foreground">Pipeline of all study-abroad applications across counsellors.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Country" className="w-40 h-9" value={country} onChange={(e) => setCountry(e.target.value)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-2">
          {apps?.length === 0 && <Card className="p-4 text-sm text-muted-foreground text-center">No applications.</Card>}
          {apps?.map((a) => (
            <Card key={a.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm">{a.target_country} · {a.intake_term ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Updated {new Date(a.updated_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{a.stage.replace(/_/g," ")}</Badge>
                <Select value={a.counsellor_user_id ?? ""} onValueChange={(v) => assign.mutate({ appId: a.id, userId: v })}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Assign counsellor" /></SelectTrigger>
                  <SelectContent>
                    {counsellors?.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.display_name ?? c.user_id.slice(0,8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
