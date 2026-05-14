/**
 * Global CRM Command Center — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: P2 (RPC Adoption)
 * Restored: Aisha Funnel Telemetry & Triple-Bar Breakdowns
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  FileText,
  Briefcase,
  Globe,
  DatabaseZap,
  Activity,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Bucket {
  label: string;
  value: number;
}

export function TalentOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["global-crm-overview-full-telemetry"],
    queryFn: async () => {
      // P2: High-performance RPC for core aggregates
      const { data: rawRes, error } = await supabase.rpc("get_global_crm_overview");
      if (error) throw error;
      const res = (rawRes ?? {}) as {
        total_talents?: number;
        onboarded_count?: number;
        professions?: Record<string, number>;
        countries?: Record<string, number>;
        recent_nodes?: any[];
      };

      // Restore: Aisha Funnel Data (Capturing the conversion flow)
      const aishaCount = async (filter?: (q: any) => any) => {
        let q = supabase.from("aisha_conversations").select("id", { head: true, count: "exact" });
        if (filter) q = filter(q);
        const { count } = await q;
        return count ?? 0;
      };

      const [started, emailCaptured, completedSignup] = await Promise.all([
        aishaCount(),
        aishaCount((q) => q.not("email", "is", null)),
        aishaCount((q) => q.not("completed_at", "is", null)),
      ]);

      // Restore: Multi-dimensional grouping
      const mapToSortedArray = (obj: Record<string, number>, limit = 10) =>
        Object.entries(obj || {})
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);

      return {
        total: res.total_talents || 0,
        onboarded: res.onboarded_count || 0,
        byCategory: mapToSortedArray(res.professions),
        byCountry: mapToSortedArray(res.countries),
        funnel: {
          started,
          emailCaptured,
          completedSignup,
          cvParsed: res.onboarded_count, // Aligned with mastery-driven matching
        },
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

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile label="Total Nodes" value={data.total} icon={Users} color="text-indigo-500" bg="bg-indigo-500/10" />
        <MetricTile
          label="Verified Mastery"
          value={data.onboarded}
          icon={ShieldCheck}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Pipeline Scale"
          value={data.funnel.started}
          icon={Activity}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Global Reach"
          value={data.byCountry.length}
          icon={Globe}
          color="text-fuchsia-500"
          bg="bg-fuchsia-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Restored: Welcome AI Funnel visualization */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative text-left">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-foreground">
                  Welcome AI Funnel
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Node Onboarding Pipeline
                </p>
              </div>
            </div>
            <div className="grid gap-6">
              <FunnelRow
                label="Interactions Started"
                value={data.funnel.started}
                max={data.funnel.started}
                color="from-blue-400 to-blue-600"
              />
              <FunnelRow
                label="Email Leads Captured"
                value={data.funnel.emailCaptured}
                max={data.funnel.started}
                color="from-indigo-400 to-indigo-600"
              />
              <FunnelRow
                label="Account Conversions"
                value={data.funnel.completedSignup}
                max={data.funnel.started}
                color="from-violet-400 to-violet-600"
              />
              <FunnelRow
                label="Mastery Profiles (CV)"
                value={data.funnel.cvParsed}
                max={data.funnel.started}
                color="from-emerald-400 to-emerald-600"
              />
            </div>
          </div>
        </Card>

        {/* Restored: Recent Registrations with Badge Status */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden text-left">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardHeader className="p-8 border-b border-border/10">
            <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-500" /> Recent Activations
            </h3>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-4 max-h-[420px] space-y-2">
            {data.recent.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/40 transition-all border-2 border-transparent hover:border-border/40 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm uppercase italic truncate group-hover:text-emerald-500 transition-colors">
                    {r.full_name || "Anonymous User"}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate flex items-center gap-2 mt-1">
                    <span>{r.country || "Global"}</span>
                    <span>·</span>
                    <Badge
                      variant="outline"
                      className="px-2 py-0 h-4 text-[8px] font-black bg-emerald-500/10 text-emerald-600 border-none"
                    >
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Restored: Multi-pane Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BarBreakdown title="Market Concentration" icon={Globe} data={data.byCountry} color="blue" />
        <BarBreakdown title="Profession Mix" icon={Briefcase} data={data.byCategory} color="fuchsia" />
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group hover:border-primary/30 transition-all shadow-xl">
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}

function FunnelRow({ label, value, max, color }: any) {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{label}</span>
        <span className="font-black text-xl italic tracking-tighter">
          {value.toLocaleString()} <span className="text-[10px] text-muted-foreground/40 not-italic">({pct}%)</span>
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/10 shadow-inner">
        <div
          className={cn("h-full transition-all duration-1000 rounded-full bg-gradient-to-r", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({ title, icon: Icon, data, color }: any) {
  const max = Math.max(1, ...data.map((d: any) => d.value));
  const gradient = color === "blue" ? "from-blue-400 to-indigo-600" : "from-fuchsia-400 to-pink-600";

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 p-8 text-left">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-foreground/70 mb-6">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="space-y-4">
        {data.map((d: any) => (
          <div key={d.label} className="space-y-1.5 group">
            <div className="flex justify-between items-end text-sm">
              <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground truncate pr-4">
                {d.label}
              </span>
              <span className="font-black italic tracking-tighter text-foreground">{d.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all bg-gradient-to-r opacity-80 group-hover:opacity-100",
                  gradient,
                )}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
