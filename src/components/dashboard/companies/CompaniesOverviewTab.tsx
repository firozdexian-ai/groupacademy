/**
 * Companies Overview — KPIs for the B2B (companies + contacts) pipeline.
 */
import { useEffect, useState } from "react";
import { Building2, Users, UserCheck, FileText, Globe, Sparkles, AlertCircle, Network } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Bucket = { label: string; value: number };

interface OverviewData {
  totalCompanies: number;
  verified: number;
  newCompanies7d: number;
  newCompanies30d: number;
  totalContacts: number;
  registered: number;
  uploaded: number;
  cvMatched: number;
  byIndustry: Bucket[];
  byCountry: Bucket[];
  riyaFunnel: { started: number; emailCaptured: number; completed: number; abandoned: number };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

export function CompaniesOverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const head = (table: string) => supabase.from(table as any).select("id", { head: true, count: "exact" });

        const [
          totalCompanies,
          verified,
          new7d,
          new30d,
          totalContacts,
          registered,
          uploaded,
          cvMatched,
          riyaStarted,
          riyaCompleted,
          industriesRows,
          countriesRows,
        ] = await Promise.all([
          head("companies"),
          supabase.from("companies").select("id", { head: true, count: "exact" }).eq("is_verified", true),
          supabase.from("companies").select("id", { head: true, count: "exact" }).gte("created_at", daysAgo(7)),
          supabase.from("companies").select("id", { head: true, count: "exact" }).gte("created_at", daysAgo(30)),
          head("contacts"),
          supabase.from("contacts").select("id", { head: true, count: "exact" }).not("user_id", "is", null),
          supabase
            .from("contacts")
            .select("id", { head: true, count: "exact" })
            .is("user_id", null)
            .neq("source", "cv_match"),
          supabase.from("contacts").select("id", { head: true, count: "exact" }).eq("source", "cv_match"),
          head("riya_conversations"),
          supabase
            .from("riya_conversations")
            .select("id", { head: true, count: "exact" })
            .not("completed_at", "is", null),
          supabase.from("companies").select("industry").not("industry", "is", null).limit(2000),
          supabase.from("companies").select("country").not("country", "is", null).limit(2000),
        ]);

        const tally = (rows: any[] | null, key: string): Bucket[] => {
          const m = new Map<string, number>();
          for (const r of rows ?? []) {
            const v = r[key];
            if (!v) continue;
            m.set(v, (m.get(v) ?? 0) + 1);
          }
          return Array.from(m.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
        };

        const started = riyaStarted.count ?? 0;
        const completed = riyaCompleted.count ?? 0;
        if (!mounted) return;
        setData({
          totalCompanies: totalCompanies.count ?? 0,
          verified: verified.count ?? 0,
          newCompanies7d: new7d.count ?? 0,
          newCompanies30d: new30d.count ?? 0,
          totalContacts: totalContacts.count ?? 0,
          registered: registered.count ?? 0,
          uploaded: uploaded.count ?? 0,
          cvMatched: cvMatched.count ?? 0,
          byIndustry: tally(industriesRows.data as any[], "industry"),
          byCountry: tally(countriesRows.data as any[], "country"),
          riyaFunnel: {
            started,
            emailCaptured: started, // every session was started via email request
            completed,
            abandoned: Math.max(0, started - completed),
          },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-[32px] border-2 border-border/40" />
        ))}
        <Skeleton className="col-span-2 md:col-span-4 h-[300px] rounded-[40px] border-2 border-border/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Network className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">B2B Telemetry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Companies pipeline · Employer contacts · Riya signups
          </p>
        </div>
      </header>

      {/* KPI Grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Companies" value={data.totalCompanies} icon={Building2} />
        <StatsCard title="Verified" value={data.verified} icon={UserCheck} />
        <StatsCard title="New (7d)" value={data.newCompanies7d} icon={Sparkles} />
        <StatsCard title="New (30d)" value={data.newCompanies30d} icon={Sparkles} />

        <StatsCard title="Total Contacts" value={data.totalContacts} icon={Users} />
        <StatsCard title="Registered" value={data.registered} icon={UserCheck} />
        <StatsCard title="Uploaded" value={data.uploaded} icon={FileText} />
        <StatsCard title="CV-Matched" value={data.cvMatched} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding funnel */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-10 bg-primary pointer-events-none" />
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Onboarding Funnel (Riya)</h3>
            </div>
            <div className="grid gap-4">
              <FunnelRow label="Started Chat" value={data.riyaFunnel.started} max={data.riyaFunnel.started || 1} />
              <FunnelRow
                label="Email Captured"
                value={data.riyaFunnel.emailCaptured}
                max={data.riyaFunnel.started || 1}
              />
              <FunnelRow
                label="Completed Signup"
                value={data.riyaFunnel.completed}
                max={data.riyaFunnel.started || 1}
              />
              <FunnelRow
                label="Abandoned"
                value={data.riyaFunnel.abandoned}
                max={data.riyaFunnel.started || 1}
                colorClass="from-orange-400 to-red-500"
              />
            </div>
          </div>
        </Card>

        {/* Breakdowns */}
        <BarBreakdown title="Top Industries" icon={Building2} data={data.byIndustry} />
        <BarBreakdown title="Top Countries" icon={Globe} data={data.byCountry} />
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5 p-3 rounded-2xl border border-border/40 bg-card/50">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-black text-lg italic tracking-tighter leading-none text-foreground/80">
            {value.toLocaleString()}
          </span>
          <Badge variant="secondary" className="font-black text-[10px] w-12 justify-center">
            {pct}%
          </Badge>
        </div>
      </div>
      <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r",
            colorClass || "from-primary to-blue-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({ title, icon: Icon, data }: { title: string; icon: any; data: Bucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
      <div className="p-6 border-b border-border/10 bg-muted/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {data.length === 0 && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 text-center py-8">
            No data available.
          </p>
        )}
        {data.map((d) => (
          <div key={d.label} className="space-y-1.5 group">
            <div className="flex justify-between items-end text-sm px-1">
              <span className="truncate pr-4 font-medium group-hover:text-primary transition-colors">{d.label}</span>
              <span className="font-black italic tracking-tighter text-muted-foreground/80 group-hover:text-foreground transition-colors">
                {d.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-blue-500/80 rounded-full group-hover:from-primary group-hover:to-blue-500 transition-colors"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
