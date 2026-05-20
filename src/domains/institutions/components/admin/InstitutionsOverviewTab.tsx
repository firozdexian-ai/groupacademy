import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, GraduationCap, Trophy, Network, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstitutionsOverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["institutions-overview-stats"],
    queryFn: async () => {
      // Execute parallel count queries to map the Global Graph
      const [institutions, talents, programs, events] = await Promise.all([
        supabase.from("institutions").select("*", { count: "exact", head: true }),
        supabase.from("talents").select("*", { count: "exact", head: true }).not("institution_id", "is", null),
        supabase
          .from("study_abroad_programs")
          .select("*", { count: "exact", head: true })
          .not("institution_id", "is", null),
        supabase.from("competitions").select("*", { count: "exact", head: true }).not("institution_id", "is", null),
      ]);

      return {
        totalInstitutions: institutions.count || 0,
        connectedTalents: talents.count || 0,
        linkedPrograms: programs.count || 0,
        hostedEvents: events.count || 0,
      };
    },
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Network className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Global Graph</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Institutional Telemetry & Relational Mapping
          </p>
        </div>
      </header>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricTile
            title="Total Institutions"
            value={stats?.totalInstitutions}
            icon={Building2}
            hint="Active Nodes in Registry"
            color="text-primary"
            bg="bg-primary/10"
          />
          <MetricTile
            title="Connected Talent"
            value={stats?.connectedTalents}
            icon={Users}
            hint="Students Linked to Alma Mater"
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <MetricTile
            title="Study Abroad"
            value={stats?.linkedPrograms}
            icon={GraduationCap}
            hint="Programs mapped to Universities"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <MetricTile
            title="Hosted Events"
            value={stats?.hostedEvents}
            icon={Trophy}
            hint="Competitions & Events Linked"
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>
      )}

      {/* Strategic Architecture Banner */}
      <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2 text-left">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">
              Relational Architecture Active
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-3xl">
              The Institutions segment serves as the central hub for the Global Graph. Modifying an institution here
              will automatically update its relational connections across the Study Abroad pipeline, Talent profiles,
              and Competition registries.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ title, value, icon: Icon, hint, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic group-hover:text-foreground transition-colors">
          {title}
        </p>
        <div
          className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            bg,
          )}
        >
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-4xl font-black italic tracking-tighter leading-none mb-3">
          {value?.toLocaleString() || "0"}
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{hint}</p>
      </CardContent>
    </Card>
  );
}
