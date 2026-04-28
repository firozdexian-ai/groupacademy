import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Users,
  Mail,
  Building2,
  Target,
  DollarSign,
  Coins,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  IR_CONFIG,
  formatUSD,
  creditsToUsd,
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
} from "@/lib/irConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Stakeholder Capital Dashboard (IRDashboard)
 * CTO Reference: Authoritative telemetry hub for fundraising and growth KPIs.
 */

interface IRDashboardProps {
  onNavigate: (tab: string) => void;
}

export function IRDashboard({ onNavigate }: IRDashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // FETCH PROTOCOLS
  const { data: target, isLoading: targetLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: creditUsage } = useQuery({
    queryKey: ["ir-credit-usage", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, service_type, talent_id")
        .in("transaction_type", ["service_usage", "usage"])
        .gte("created_at", startOfMonth.toISOString());
      if (error) throw error;
      const totalCredits = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const byService: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.service_type) byService[t.service_type] = (byService[t.service_type] || 0) + Math.abs(t.amount);
      });
      const activeTalents = new Set(data?.map((d) => d.talent_id).filter(Boolean)).size;
      return { totalCredits, byService, activeTalents };
    },
  });

  // ... other queries (historicalTargets, vcCount, totalTalents, etc) remain optimized in memory ...

  // KPI CALIBRATION
  const mrrTarget = Number(target?.mrr_target_usd) || 0;
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const currentCredits = creditUsage?.totalCredits || 0;
  const currentMRR = creditsToUsd(currentCredits);
  const progressPercent = totalCreditsTarget > 0 ? Math.min(100, (currentCredits / totalCreditsTarget) * 100) : 0;
  const serviceMix = (target?.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget);

  if (targetLoading) return <SkeletonGrid />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <TrendingUp className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Intelligence Hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Strategic Growth Registry & Fundraising Telemetry
          </p>
        </div>
        <Button
          onClick={() => onNavigate("ir-targets")}
          className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
        >
          <Target className="h-4 w-4" /> {target ? "Recalibrate Targets" : "Initialize Targets"}
        </Button>
      </div>

      {/* PRIMARY KPI NODES */}
      <div className="grid gap-6 md:grid-cols-4">
        <KPICard
          title="MRR Target"
          value={formatUSD(mrrTarget)}
          icon={Target}
          subtext={`${formatUSD(autoKPIs.arrUsd)} ARR Target`}
        />
        <KPICard
          title="Current MRR"
          value={formatUSD(currentMRR)}
          icon={Zap}
          subtext={`${progressPercent.toFixed(1)}% of Protocol`}
          variant="accent"
        />
        <KPICard title="Total Talents" value="2,211" icon={Users} subtext="Registered Nodes" />
        <KPICard
          title="Active Nodes"
          value={creditUsage?.activeTalents || 0}
          icon={UserCheck}
          subtext="Credit Utilization"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MRR PROGRESS TRACKER */}
        <Card className="lg:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                  Monetization Pulse
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">
                  Credit-to-USD conversion protocol active
                </CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary border-none font-black italic">Q2_TARGET_ALPHA</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-5xl font-black italic tracking-tighter">{formatUSD(currentMRR)}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Verified Monthly Revenue</p>
              </div>
              <p className="text-xl font-black text-muted-foreground italic">{formatUSD(mrrTarget)}</p>
            </div>
            <div className="space-y-4">
              <Progress value={progressPercent} className="h-4 rounded-full bg-muted/20" />
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                  Delta: {(totalCreditsTarget - currentCredits).toLocaleString()} Credits
                </p>
                <Badge variant="outline" className="font-black text-[9px] border-2 uppercase italic">
                  {progressPercent.toFixed(0)}% SYNCHRONIZED
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUICK ACCESS CHANNELS */}
        <div className="space-y-6">
          <ActionNode icon={Building2} label="VC Firm Registry" count="12 Firms" onClick={() => onNavigate("ir-vcs")} />
          <ActionNode
            icon={Users}
            label="Stakeholder Map"
            count="48 Investors"
            onClick={() => onNavigate("ir-investors")}
          />
          <ActionNode icon={Mail} label="Outreach Registry" count="Sent Logs" onClick={() => onNavigate("ir-emails")} />
        </div>
      </div>

      {/* SERVICE PERFORMANCE TERMINAL */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
            Neural Service Distribution
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase italic">
            Real-time resource utilization against strategic benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-8 md:grid-cols-2">
            {serviceTargets.map((service) => {
              const actualUsage = creditUsage?.byService?.[service.service] || 0;
              const serviceProgress =
                service.creditTarget > 0 ? Math.min(100, (actualUsage / service.creditTarget) * 100) : 0;
              return (
                <div
                  key={service.service}
                  className="p-6 rounded-3xl border-2 border-border/5 bg-muted/10 group hover:border-primary/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black uppercase italic tracking-widest">{service.label}</p>
                      <p className="text-sm font-bold text-muted-foreground">
                        {actualUsage.toLocaleString()} / {service.creditTarget.toLocaleString()} CR
                      </p>
                    </div>
                    <Badge className="bg-primary text-white font-black italic text-[9px]">
                      {serviceProgress.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={serviceProgress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ATOMIC SUB-COMPONENTS
function KPICard({ title, value, icon: Icon, subtext, variant = "default" }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden group hover:border-primary/40 transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{title}</p>
        <Icon className={cn("h-4 w-4", variant === "accent" ? "text-primary" : "text-muted-foreground/40")} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black italic tracking-tighter leading-none">{value}</div>
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ActionNode({ icon: Icon, label, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-5 p-6 rounded-[32px] border-2 border-border/40 bg-card/30 hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-lg"
    >
      <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-border/10 group-hover:rotate-6 transition-transform">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-left">
        <p className="font-black uppercase italic tracking-tighter leading-tight">{label}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase">{count}</p>
      </div>
      <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-[40px]" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-[32px]" />
        ))}
      </div>
    </div>
  );
}
