import { useJobsGraph } from "hooks/useJobsGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Users, Target, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export function JobsKpiTab() {
  const { jobsGraphQuery } = useJobsGraph();
  const { data, isLoading } = jobsGraphQuery;

  // Generate Analytics
  const totalApps = data?.applications?.length || 0;
  const hiredApps = data?.applications?.filter((a) => a.status === "hired")?.length || 0;
  const conversionRate = totalApps > 0 ? Math.round((hiredApps / totalApps) * 100) : 0;
  const activeJobs = data?.jobs?.filter((j) => j.status === "active")?.length || 0;
  const totalCrm = data?.crmRecords?.length || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-pink-500">
            <Activity className="h-8 w-8 text-pink-500 fill-pink-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Recruitment KPIs
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Hiring Analytics
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-[40px] bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KpiCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            subtitle={`${hiredApps} Total Hires`}
            icon={TrendingUp}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <KpiCard
            title="Application Volume"
            value={totalApps}
            subtitle={`${activeJobs} Active Roles`}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <KpiCard
            title="Sourced Pipeline"
            value={totalCrm}
            subtitle="CRM Candidates"
            icon={Crosshair}
            color="text-pink-500"
            bg="bg-pink-500/10"
          />
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
      <div
        className={cn(
          "absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
          bg,
        )}
      />
      <CardContent className="p-8 flex flex-col h-full relative z-10">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 shadow-inner mb-6",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="mt-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-2">{title}</p>
          <p className="text-5xl font-black italic tracking-tighter leading-none text-foreground/90 mb-2">{value}</p>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default JobsKpiTab;
