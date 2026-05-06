import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plane, ArrowRight } from "lucide-react";

const STAGES = [
  "intake",
  "shortlisted",
  "docs_in_progress",
  "submitted",
  "offer",
  "visa",
  "enrolled",
  "declined",
] as const;

type Stage = (typeof STAGES)[number];

const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  shortlisted: "Shortlisted",
  docs_in_progress: "Docs",
  submitted: "Submitted",
  offer: "Offer",
  visa: "Visa",
  enrolled: "Enrolled",
  declined: "Declined",
};

const STAGE_COLOR: Record<Stage, string> = {
  intake: "bg-slate-500",
  shortlisted: "bg-blue-500",
  docs_in_progress: "bg-amber-500",
  submitted: "bg-cyan-500",
  offer: "bg-emerald-500",
  visa: "bg-purple-500",
  enrolled: "bg-green-600",
  declined: "bg-rose-500",
};

export default function AbroadCounsellor() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const [{ data: c }, { data: roles }] = await Promise.all([
        supabase.from("abroad_counsellors").select("user_id").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      setAuthorized(Boolean(c) || isAdmin);
    })();
  }, [navigate]);

  const { data: apps, isLoading } = useQuery({
    queryKey: ["counsellor-apps"],
    enabled: authorized === true,
    queryFn: async () => {
      const { data } = await supabase
        .from("abroad_applications")
        .select("*")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const advance = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Stage }) => {
      const { error } = await supabase.rpc("advance_abroad_stage", {
        _application_id: id,
        _next_stage: next,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stage updated");
      qc.invalidateQueries({ queryKey: ["counsellor-apps"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (authorized === null) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!authorized) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <Card className="p-6">
          <Plane className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-bold mt-3">Counsellor access required</h2>
          <p className="text-sm text-muted-foreground mt-1">Ask an admin to add you as a counsellor.</p>
        </Card>
      </div>
    );
  }

  const grouped: Record<Stage, any[]> = STAGES.reduce((acc, s) => {
    acc[s] = (apps ?? []).filter((a) => a.stage === s);
    return acc;
  }, {} as Record<Stage, any[]>);

  return (
    <div className="p-3 sm:p-4 space-y-3 max-w-7xl mx-auto safe-bottom">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Counsellor Cockpit</h1>
        <Badge variant="outline">{(apps ?? []).length} active</Badge>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map((s) => (
            <div key={s} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STAGE_COLOR[s]}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{STAGE_LABEL[s]}</span>
                </div>
                <span className="text-xs text-muted-foreground">{grouped[s].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[s].length === 0 ? (
                  <Card className="p-3 text-xs text-muted-foreground text-center">Empty</Card>
                ) : (
                  grouped[s].map((a) => (
                    <Card key={a.id} className="p-3 space-y-2">
                      <div>
                        <div className="font-semibold text-sm">{a.target_country}</div>
                        <div className="text-xs text-muted-foreground">{a.intake_term ?? "—"} · {new Date(a.updated_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select onValueChange={(v) => advance.mutate({ id: a.id, next: v as Stage })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Advance →" />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.filter((x) => x !== a.stage).map((x) => (
                              <SelectItem key={x} value={x}>{STAGE_LABEL[x]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => navigate(`/app/abroad/applications`)}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
