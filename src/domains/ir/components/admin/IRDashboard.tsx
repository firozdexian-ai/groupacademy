/**
 * GroUp Academy: IR Nexus & Intelligence Hub
 * CTO Version: May 2026 (Phase IR-Z0 Hardened)
 * Fixes: B2 (Hardcoded placeholders), P4 (Consolidated Overview), B1 (Schema Alignment)
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getIRDashboardTelemetry } from "@/domains/ir/repo/irRepo";
import {
  TrendingUp,
  Users,
  Mail,
  Building2,
  Target,
  UserCheck,
  ArrowUpRight,
  Zap,
  Activity,
  Globe,
  MessageSquare,
  UserPlus,
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

interface IRDashboardProps {
  onNavigate: (tab: string) => void;
}

export function IRDashboard({ onNavigate }: IRDashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // B1 & B2 Fix: Unified Fetch Protocol for Live Telemetry
  const { data: telemetry, isLoading: statsLoading } = useQuery({
    queryKey: ["ir-unified-telemetry", currentMonth],
    queryFn: () => getIRDashboardTelemetry(currentMonth, startOfMonth.toISOString()),
  });

  // KPI CALIBRATION
  const mrrTarget = Number(telemetry?.target?.mrr_target_usd) || 0;
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const currentCredits = telemetry?.usage.totalCredits || 0;
  const currentMRR = creditsToUsd(currentCredits);
  const progressPercent = totalCreditsTarget > 0 ? Math.min(100, (currentCredits / totalCreditsTarget) * 100) : 0;
  const serviceMix = (telemetry?.target?.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget);

  if (statsLoading) return <SkeletonGrid />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6 text-left">
      {/* EXECUTIVE COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <TrendingUp className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-semibold uppercase tracking-tight italic leading-none">Investor overview</h2>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Live revenue, targets & stakeholder activity
          </p>
        </div>
        <Button
          onClick={() => onNavigate("ir-targets")}
          className="h-10 px-4 rounded-xl font-semibold uppercase text-[10px] tracking-widest gap-3 shadow-lg"
        >
          <Target className="h-4 w-4" /> {telemetry?.target ? "Update targets" : "Set targets"}
        </Button>
      </header>

      {/* P4 Consolidated KPI Ribbon */}
      <div className="grid gap-6 md:grid-cols-4">
        <KPICard
          title="MRR Target"
          value={formatUSD(mrrTarget)}
          icon={Target}
          subtext={`${formatUSD(autoKPIs.arrUsd)} ARR Benchmark`}
        />
        <KPICard
          title="Revenue Volume"
          value={formatUSD(currentMRR)}
          icon={Zap}
          subtext={`${progressPercent.toFixed(1)}% of target`}
          variant="accent"
        />
        <KPICard
          title="30D Activity"
          value={telemetry?.registry.outreach30 || 0}
          icon={Activity}
          subtext="Stakeholder interactions"
        />
        <KPICard
          title="Talents"
          value={telemetry?.registry.talents.toLocaleString() || 0}
          icon={Globe}
          subtext="Verified network pool"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* MRR PROGRESS TRACKER */}
        <Card className="lg:col-span-2 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col h-full">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
          <CardHeader className="p-8 border-b border-border/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold uppercase italic tracking-tight text-emerald-600">
                  Revenue
                </CardTitle>
                <CardDescription className="text-[10px] font-bold">
                  Live credit-to-USD conversion
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-semibold px-3 py-1 shadow-sm">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10 flex-1 flex flex-col justify-center space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <p className="text-6xl md:text-7xl font-semibold tracking-tight text-foreground drop-shadow-sm">
                  {formatUSD(currentMRR)}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground bg-muted/30 w-fit px-3 py-1 rounded-md border border-border/20">
                  Verified Monthly Revenue
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-muted-foreground/40 italic text-right">
                <span className="text-[10px] block font-bold not-italic text-muted-foreground/30 mb-1">
                  Benchmark
                </span>
                {formatUSD(mrrTarget)}
              </p>
            </div>
            <div className="space-y-5 bg-muted/5 p-6 rounded-xl border border-border/10 shadow-inner">
              <Progress
                value={progressPercent}
                className="h-5 rounded-full bg-muted/30 shadow-inner border border-border/5"
              />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[10px] font-semibold text-emerald-600 italic">
                  Delta: {(totalCreditsTarget - currentCredits).toLocaleString()} Credits
                </p>
                <Badge
                  variant="outline"
                  className="font-semibold text-[9px] border-2 border-emerald-500/30 text-emerald-600 uppercase italic px-3 py-1 bg-emerald-500/5"
                >
                  {progressPercent.toFixed(0)}% SYNCHRONIZED
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* B2 & P6: DYNAMIC QUICK ACCESS CHANNELS */}
        <div className="flex flex-col justify-between h-full gap-4">
          <ActionNode
            icon={Building2}
            label="VC Firm Registry"
            count={`${telemetry?.registry.vcs} Institutional Firms`}
            onClick={() => onNavigate("ir-vcs")}
          />
          <ActionNode
            icon={Users}
            label="Stakeholder Map"
            count={`${telemetry?.registry.investors} Active Investors`}
            onClick={() => onNavigate("ir-investors")}
          />
          <ActionNode
            icon={Mail}
            label="Outreach Registry"
            count={`${telemetry?.registry.outreach30} Sent Logs (30D)`}
            onClick={() => onNavigate("ir-emails")}
          />
        </div>
      </div>

      {/* SERVICE PERFORMANCE TERMINAL */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-xl font-semibold uppercase italic tracking-tight text-primary">
            Neural Service Distribution
          </CardTitle>
          <CardDescription className="text-[10px] font-bold italic mt-1 text-muted-foreground/60">
            Real-time resource utilization against strategic benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {serviceTargets.map((service) => {
              const actualUsage = telemetry?.usage.byService?.[service.service] || 0;
              const serviceProgress =
                service.creditTarget > 0 ? Math.min(100, (actualUsage / service.creditTarget) * 100) : 0;
              return (
                <div
                  key={service.service}
                  className="p-6 rounded-xl border border-border/40 bg-background/50 group hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase italic tracking-tight group-hover:text-primary transition-colors">
                        {service.label}
                      </p>
                      <p className="text-xs font-mono font-bold text-muted-foreground/70">
                        {actualUsage.toLocaleString()} / {service.creditTarget.toLocaleString()} CR
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-semibold text-[9px] px-2.5 py-1">
                      {serviceProgress.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={serviceProgress} className="h-2 bg-muted/30 border border-border/10 shadow-inner" />
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
    <Card className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden group hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
        <p className="text-[10px] font-semibold text-muted-foreground italic group-hover:text-foreground transition-colors">
          {title}
        </p>
        <Icon
          className={cn(
            "h-5 w-5 transition-transform group-hover:scale-110",
            variant === "accent" ? "text-primary fill-primary/20" : "text-muted-foreground/40",
          )}
        />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div
          className={cn(
            "text-4xl font-semibold tracking-tighter leading-none mb-3",
            variant === "accent" && "text-primary",
          )}
        >
          {value}
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/60">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ActionNode({ icon: Icon, label, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full h-full flex flex-row items-center gap-5 p-6 md:p-8 rounded-2xl border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/40 hover:shadow-xl transition-all group shadow-md"
    >
      <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center border border-border/40 group-hover:rotate-6 group-hover:border-primary/30 transition-all shadow-sm shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-semibold text-sm uppercase italic tracking-widest leading-tight truncate group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1.5 truncate">
          {count}
        </p>
      </div>
      <ArrowUpRight className="ml-auto h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 group-hover:-translate-y-1 group-hover:translate-x-1" />
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-8 p-4 md:p-6 animate-pulse">
      <Skeleton className="h-32 w-full rounded-2xl bg-muted/40" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl bg-muted/40" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-full rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
