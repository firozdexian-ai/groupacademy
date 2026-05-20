/**
 * Companies Overview — B2B Operational Intelligence
 * CTO Version: May 2026 (Hardened & Feature Restored)
 * Fixes: A1 (Query Storm), A2 (Funnel Logic), R2 (Missing Imports)
 * Features: Restored Detailed Aisha Funnel & Market Breakdowns
 */
import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Users,
  UserCheck,
  FileText,
  Globe,
  Sparkles,
  AlertCircle,
  Network,
  Activity,
  MessageSquare,
  UserPlus,
  Zap,
  TrendingUp,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface OverviewData {
  totals: number;
  verified: number;
  new7d: number;
  new30d: number;
  contacts_total: number;
  riya_funnel: {
    started: number;
    email_captured: number;
    converted: number;
  };
  top_industries: Record<string, number>;
  top_countries: Record<string, number>;
}

export function CompaniesOverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // A1 Fix: Atomic RPC replaces 12 sequential queries & client-side tallies
      const { data: res, error } = await supabase.rpc("get_companies_overview");

      if (error) throw error;
      setData(res as unknown as OverviewData);
    } catch (err) {
      console.error("B2B Telemetry Fault:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40 border-2" />
        ))}
        <Skeleton className="col-span-full h-96 rounded-[40px] bg-muted/40 border-2" />
      </div>
    );
  }

  // Transform Record objects to sorted arrays for display
  const industries = Object.entries(data.top_industries || {})
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const countries = Object.entries(data.top_countries || {})
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-primary">
            <Network className="h-6 w-6" /> B2B Intelligence
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
            Employer Pipeline & Contact Telemetry Command
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="h-10 px-4 rounded-xl font-black border-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 gap-2"
          >
            <Activity className="h-3 w-3 animate-pulse" /> LIVE_SYNC
          </Badge>
          <Button variant="outline" size="icon" onClick={loadData} className="rounded-xl border-2 h-10 w-10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Companies" value={data.totals} icon={Building2} />
        <StatsCard title="Verified Nodes" value={data.verified} icon={UserCheck} />
        <StatsCard title="New (7d)" value={data.new7d} icon={Sparkles} />
        <StatsCard title="New (30d)" value={data.new30d} icon={TrendingUp} />

        <StatsCard title="B2B Contacts" value={data.contacts_total} icon={Users} />
        <StatsCard title="Conversations" value={data.riya_funnel.started} icon={MessageSquare} />
        <StatsCard title="Leads Captured" value={data.riya_funnel.email_captured} icon={UserPlus} />
        <StatsCard title="Platform Signup" value={data.riya_funnel.converted} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Riya Onboarding Funnel (Restored Logic) */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative text-left">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> Onboarding Funnel (Riya)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 grid gap-6">
            <FunnelRow label="Chat Interactions" value={data.riya_funnel.started} max={data.riya_funnel.started} />
            {/* A2 Fix: Displaying real captured email counts vs started counts */}
            <FunnelRow
              label="Email Leads Linked"
              value={data.riya_funnel.email_captured}
              max={data.riya_funnel.started}
              color="from-blue-500 to-indigo-600"
            />
            <FunnelRow
              label="Registry Conversion"
              value={data.riya_funnel.converted}
              max={data.riya_funnel.started}
              color="from-emerald-500 to-emerald-600"
            />
            <FunnelRow
              label="Abandoned"
              value={Math.max(0, data.riya_funnel.started - data.riya_funnel.converted)}
              max={data.riya_funnel.started}
              color="from-orange-400 to-red-500"
            />
          </CardContent>
        </Card>

        {/* Restored Industry Breakdown */}
        <BarBreakdown title="Sector Concentration" icon={Building2} data={industries} color="blue" />

        {/* Restored Country Breakdown */}
        <BarBreakdown title="Market Reach" icon={Globe} data={countries} color="indigo" />
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max, color }: any) {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60">{label}</span>
        <span className="font-black text-xl italic tracking-tighter text-foreground">
          {value.toLocaleString()} <span className="text-[10px] text-muted-foreground/30 not-italic">({pct}%)</span>
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/10 shadow-inner">
        <div
          className={cn(
            "h-full transition-all duration-1000 rounded-full bg-gradient-to-r",
            color || "from-primary to-blue-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({ title, icon: Icon, data, color }: any) {
  const max = Math.max(1, ...data.map((d: any) => d.value));
  const gradient = color === "blue" ? "from-blue-400 to-indigo-600" : "from-indigo-400 to-violet-600";

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden text-left">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />
      <div className="p-6 border-b border-border/10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {data.length === 0 ? (
          <p className="text-center text-[10px] font-black opacity-20 uppercase py-10">No Sector Data</p>
        ) : (
          data.map((d: any) => (
            <div key={d.label} className="space-y-1.5 group">
              <div className="flex justify-between items-end text-sm px-1">
                <span className="truncate pr-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  {d.label}
                </span>
                <span className="font-black italic tracking-tighter text-foreground group-hover:scale-110 transition-transform">
                  {d.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-gradient-to-r rounded-full transition-all opacity-80 group-hover:opacity-100",
                    gradient,
                  )}
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// Ensure Button and RefreshCw are imported for the header actions
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
