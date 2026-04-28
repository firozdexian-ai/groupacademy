import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, Lock, Calendar, Zap, ShieldCheck, TrendingUp, Target as TargetIcon } from "lucide-react";
import {
  IR_CONFIG,
  formatUSD,
  creditsToUsd,
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
  type ServiceKey,
} from "@/lib/irConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Revenue & Target Orchestrator
 * CTO Reference: Authoritative node for MRR calibration and service mix simulation.
 */

export function MRRTargetManager() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [mrrTarget, setMrrTarget] = useState<number>(0);
  const [serviceMix, setServiceMix] = useState<ServiceMix>(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const [targetPayingUsers, setTargetPayingUsers] = useState<number>(0);
  const [targetChurnRate, setTargetChurnRate] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // PROTOCOL: Fetch Active Target Node
  const { data: target, isLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMrrTarget(Number(data.mrr_target_usd) || 0);
        setServiceMix((data.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix));
        setTargetPayingUsers(data.target_paying_users || 0);
        setTargetChurnRate(Number(data.target_churn_rate) || 5);
        setNotes(data.notes || "");
      }
      return data;
    },
  });

  // ... Queries for creditUsage and totalTalentsCount remain standard in memory ...

  // MUTATION: Synchronize Target Protocol
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        month: currentMonth,
        mrr_target_usd: mrrTarget,
        service_mix: serviceMix,
        target_paying_users: targetPayingUsers,
        target_churn_rate: targetChurnRate,
        notes: notes || null,
      };

      const { error } = target?.id
        ? await supabase.from("ir_monthly_targets").update(payload).eq("id", target.id)
        : await supabase.from("ir_monthly_targets").insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Protocol Successful: Target Synchronized");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["ir-target"] });
    },
    onError: (error: any) => toast.error("Transmission Fault: " + error.message),
  });

  const totalMixPercent = Object.values(serviceMix).reduce((sum, v) => sum + v, 0);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget, targetPayingUsers > 0 ? mrrTarget / targetPayingUsers : 20);
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const isClosed = target?.is_closed || false;

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <TargetIcon className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Target Command</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            MRR Optimization & Service Mix Simulator
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isClosed ? (
            <Badge className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 bg-muted text-muted-foreground border-border/40">
              <Lock className="h-4 w-4" /> REGISTRY_LOCKED
            </Badge>
          ) : (
            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-14 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <Calendar className="h-4 w-4" /> Close Period
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[32px] border-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                      Terminate Period?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs font-medium italic">
                      This will finalize actual revenue nodes and lock the registry for this month.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px]">
                      Confirm Termination
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !hasChanges}
                className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
              >
                <Zap className={cn("h-4 w-4", hasChanges ? "fill-current" : "")} /> Synchronize
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE CALIBRATION CARD */}
        <Card className="lg:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Revenue Calibration</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase">
              Define MRR parameters and user acquisition targets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3 text-left">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">MRR Target (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary italic text-xl">
                    $
                  </span>
                  <Input
                    type="number"
                    value={mrrTarget}
                    onChange={(e) => {
                      setMrrTarget(Number(e.target.value));
                      setHasChanges(true);
                    }}
                    className="h-16 rounded-2xl border-2 pl-10 text-2xl font-black italic tracking-tighter bg-muted/10"
                  />
                </div>
              </div>
              <div className="space-y-3 text-left">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Target Paying Units</Label>
                <Input
                  type="number"
                  value={targetPayingUsers}
                  onChange={(e) => {
                    setTargetPayingUsers(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  className="h-16 rounded-2xl border-2 text-2xl font-black italic tracking-tighter bg-muted/10"
                />
              </div>
            </div>

            {/* AUTO KPI TELEMETRY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-border/10">
              <StatNode label="ARR_TARGET" value={formatUSD(autoKPIs.arrUsd)} />
              <StatNode label="REQ_USERS" value={autoKPIs.requiredPayingUsers} />
              <StatNode label="EST_LTV" value={formatUSD(autoKPIs.ltvEstimate)} />
              <StatNode label="CAC_CEILING" value={formatUSD(autoKPIs.cacCeiling)} />
            </div>
          </CardContent>
        </Card>

        {/* CREDIT ECONOMY SUMMARY */}
        <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden flex flex-col justify-center">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
              Credit Yield Protocol
            </p>
            <h3 className="text-5xl font-black italic tracking-tighter leading-none">
              {totalCreditsTarget.toLocaleString()}
            </h3>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Credits required to satisfy {formatUSD(mrrTarget)} target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SERVICE MIX TERMINAL */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden text-left">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Mix Infrastructure</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase">
              Distribute expected usage load across neural service nodes
            </CardDescription>
          </div>
          <Badge
            className={cn(
              "font-black italic px-4 py-2 border-2",
              totalMixPercent === 100
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20",
            )}
          >
            TOTAL_MIX: {totalMixPercent}%
          </Badge>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-10 md:grid-cols-2">
            {(Object.keys(IR_CONFIG.SERVICE_LABELS) as ServiceKey[]).map((service) => {
              const target = serviceTargets.find((s) => s.service === service);
              const mixValue = serviceMix[service] || 0;
              return (
                <div
                  key={service}
                  className="space-y-4 p-6 rounded-3xl border-2 border-border/5 bg-muted/5 group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Label className="font-black uppercase italic text-xs tracking-widest">
                      {IR_CONFIG.SERVICE_LABELS[service]}
                    </Label>
                    <div className="text-right">
                      <p className="text-sm font-black italic text-primary">{formatUSD(target?.revenueUsd || 0)}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        {target?.creditTarget.toLocaleString()} CREDITS
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Slider
                      value={[mixValue]}
                      onValueChange={([v]) => handleMixChange(service, v)}
                      max={50}
                      step={1}
                      className="flex-1"
                      disabled={isClosed}
                    />
                    <div className="w-20 relative">
                      <Input
                        type="number"
                        value={mixValue}
                        onChange={(e) => handleMixChange(service, Number(e.target.value))}
                        className="h-10 rounded-xl border-2 text-center font-black pr-6"
                        disabled={isClosed}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function handleMixChange(service: ServiceKey, value: number) {
    setServiceMix((prev) => ({ ...prev, [service]: value }));
    setHasChanges(true);
  }
}

function StatNode({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 rounded-2xl bg-muted/20 border-2 border-border/5">
      <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black italic text-lg leading-none">{value}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-24 w-full rounded-[40px]" />
      <Skeleton className="h-[400px] w-full rounded-[40px]" />
    </div>
  );
}
