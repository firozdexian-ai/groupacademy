import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnitEconomics } from "@/hooks/useUnitEconomics";
import { RetentionCard } from "./RetentionCard";
import { HitLCogsCard } from "./HitLCogsCard";
import { RevPerEmployeeCard } from "./RevPerEmployeeCard";
import { MetricEntrySheet } from "./MetricEntrySheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity, Users, Plus, Cpu, Database, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function DeltaBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value == null)
    return (
      <Badge variant="outline" className="text-[9px] font-black border-2">
        <Minus className="h-2.5 w-2.5 mr-1" /> N/A
      </Badge>
    );

  const isPositive = value > 0;
  const isGood = invert ? !isPositive : isPositive;

  return (
    <Badge
      className={cn(
        "font-black text-[9px] uppercase tracking-widest px-2 py-0.5 border-none gap-1 shadow-sm",
        isGood ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive",
      )}
    >
      {isPositive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  );
}

function MetricTile({ label, value, delta, suffix = "", invert = false }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic w-2/3 leading-tight">
            {label}
          </p>
          <DeltaBadge value={delta} invert={invert} />
        </div>
        <p className="text-3xl font-black italic tracking-tighter leading-none text-foreground/90">
          {value == null || value === "" ? "—" : `${value}${suffix}`}
        </p>
      </CardContent>
    </Card>
  );
}

export function UnitEconomics() {
  const { snapshots, ordered, kpis } = useUnitEconomics();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Cpu className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              AI-Era Unit Economics
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Software 3.0 metrics: Retention, Human-in-Loop COGS, Capital Efficiency
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-4 w-4" /> Log Snapshot
        </Button>
      </header>

      {snapshots.isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
        </div>
      ) : (
        <>
          {/* Top KPI Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile label="Net Revenue Retention (NRR)" value={kpis.nrr} delta={kpis.deltas.nrr} suffix="%" />
            <MetricTile label="Gross Revenue Retention (GRR)" value={kpis.grr} delta={kpis.deltas.grr} suffix="%" />
            <MetricTile
              label="HitL Labor COGS (MoM)"
              value={kpis.hitlCogs?.toLocaleString()}
              delta={null} // Can add delta calculation if needed
              suffix=" USD"
              invert={true} // Lower is better
            />
            <MetricTile
              label="Revenue Per Employee"
              value={kpis.revPerEmp ? (kpis.revPerEmp / 1000).toFixed(1) : null}
              delta={kpis.deltas.revPerEmp}
              suffix="k"
            />
          </div>

          {/* Core Analytics Modules */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                  Retention Velocity
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  NRR / GRR / Usage Retention
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <RetentionCard data={ordered} />
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                  COGS Distribution
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  AI Inference vs Human-in-the-Loop Labor
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <HitLCogsCard data={ordered} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                    Capital Efficiency
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Revenue per Employee vs Target Benchmark
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black italic px-4 py-1.5">
                  THREE-PERSON UNICORN
                </Badge>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <RevPerEmployeeCard data={ordered} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <MetricEntrySheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

export default UnitEconomics;
