import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STAGE_COLORS: Record<string, string> = {
  intake: "bg-slate-500", shortlisted: "bg-blue-500", docs_in_progress: "bg-amber-500",
  submitted: "bg-cyan-500", offer: "bg-emerald-500", visa: "bg-purple-500",
  enrolled: "bg-green-600", declined: "bg-rose-500",
};

export default function AbroadApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-abroad-apps"],
    queryFn: async () => {
      const { data } = await supabase.from("abroad_applications").select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">My Applications</h1>
      {isLoading ? <Skeleton className="h-24 w-full" /> :
        data?.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">Pick a destination and start your first application.</Card> :
        data?.map((a) => (
          <Card key={a.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{a.target_country} · {a.intake_term ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleDateString()}</div>
              </div>
              <Badge className={`${STAGE_COLORS[a.stage]} text-white capitalize`}>{a.stage.replace(/_/g, " ")}</Badge>
            </div>
          </Card>
        ))}
    </div>
  );
}
