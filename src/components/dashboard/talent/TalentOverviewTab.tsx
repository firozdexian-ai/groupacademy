/**
 * Global CRM Command Center — Refactored for Phase Z0
 * CTO Version: May 2026
 * Fixes: A1 (Expensive Client-side Aggregation)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  UserCheck,
  FileText,
  Briefcase,
  Globe,
  AlertCircle,
  DatabaseZap,
  Clock,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Bucket {
  label: string;
  value: number;
}

interface CRMOverviewResponse {
  total_talents: number;
  onboarded_count: number;
  countries: Record<string, number>;
  professions: Record<string, number>;
  funnel: {
    started: number;
    completed: number;
    cv_parsed: number;
  };
  recent_nodes: any[];
}

export function TalentOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["global-crm-overview-rpc"],
    queryFn: async () => {
      // P1 Fix: Single RPC replaces 12+ sequential fetches and JS group-bys
      const { data, error } = await supabase.rpc("get_global_crm_overview");
      if (error) throw error;

      const res = data as CRMOverviewResponse;

      // Map Record<string, number> to Bucket[] for the UI
      const mapToBucket = (obj: Record<string, number>): Bucket[] =>
        Object.entries(obj || {})
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

      return {
        total: res.total_talents,
        onboarded: res.onboarded_count,
        byCategory: mapToBucket(res.professions),
        byCountry: mapToBucket(res.countries),
        funnel: res.funnel,
        recent: res.recent_nodes || [],
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
        ))}
        <Skeleton className="col-span-4 h-96 rounded-[40px] bg-muted/40" />
      </div>
    );
  }

  const onboardingPct = Math.round((data.onboarded / data.total) * 100) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="Global Nodes"
          value={data.total}
          icon={Users}
          color="text-indigo-500"
          bg="bg-indigo-500/10"
        />
        <MetricTile
          label="Onboarding Rate"
          value={`${onboardingPct}%`}
          icon={ShieldCheck}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="CVs Parsed"
          value={data.funnel.cv_parsed}
          icon={FileText}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile
          label="Active Pipeline"
          value={data.funnel.started}
          icon={Activity}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funnel Telemetry */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden relative text-left">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <DatabaseZap className="h-5 w-5 text-indigo-500" /> Onboarding Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid gap-6">
              <FunnelRow
                label="Awareness (Started AI Chat)"
                value={data.funnel.started}
                max={data.total}
                color="from-blue-500 to-blue-700"
              />
              <FunnelRow
                label="Conversion (Registration)"
                value={data.onboarded}
                max={data.total}
                color="from-indigo-500 to-indigo-700"
              />
              <FunnelRow
                label="Mastery (CV Parsed)"
                value={data.funnel.cv_parsed}
                max={data.total}
                color="from-emerald-500 to-emerald-700"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BarBreakdown title="Top Markets" icon={Globe} data={data.byCountry} color="indigo" />
            <BarBreakdown title="Profession Mix" icon={Briefcase} data={data.byCategory} color="fuchsia" />
          </div>
        </div>

        {/* Recent Nodes Sidebar */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl flex flex-col h-full overflow-hidden text-left">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardHeader className="p-6 border-b border-border/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" /> Recent Nodes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.recent.map((node: any) => (
              <div
                key={node.id}
                className="p-4 rounded-2xl hover:bg-muted/30 border-2 border-transparent hover:border-border/40 transition-all"
              >
                <p className="text-xs font-black uppercase truncate">{node.full_name || "Anonymous Node"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {node.country || "Unknown Location"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-components: MetricTile, FunnelRow, BarBreakdown logic preserved but optimized for the new RPC data shape...
function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl p-6 text-left group">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function FunnelRow({ label, value, max, color }: any) {
  const pct = Math.round((value / max) * 100) || 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span>{label}</span>
        <span>
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/10">
        <div
          className={cn("h-full bg-gradient-to-r transition-all duration-1000", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({ title, icon: Icon, data, color }: any) {
  const max = Math.max(1, ...data.map((d: any) => d.value));
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/10 p-6 text-left">
      <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4" /> {title}
      </p>
      <div className="space-y-4">
        {data.map((d: any) => {
          const width = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase truncate">
                <span className="truncate">{d.label}</span>
                <span>{d.value}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", color === "indigo" ? "bg-indigo-500" : "bg-fuchsia-500")}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
