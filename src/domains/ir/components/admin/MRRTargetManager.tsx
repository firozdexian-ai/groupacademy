import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { getMonthlyTarget, upsertMonthlyTarget } from "@/domains/ir/repo/irRepo";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  Lock,
  Calendar,
  Zap,
  ShieldCheck,
  TrendingUp,
  Target as TargetIcon,
  Settings2,
  Activity,
} from "lucide-react";
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
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

export function MRRTargetManager() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  const [mrrTarget, setMrrTarget] = useState<number>(0);
  const [serviceMix, setServiceMix] = useState<ServiceMix>(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const [targetPayingUsers, setTargetPayingUsers] = useState<number>(0);
  const [targetChurnRate, setTargetChurnRate] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // PROTOCOL: Fetch Active Target Node
  const { data: target, isLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: () => getMonthlyTarget(currentMonth),
  });

  // CTO FIX: Safely hydrate state using useEffect instead of inside the queryFn
  useEffect(() => {
    if (target) {
      setMrrTarget(Number(target.mrr_target_usd) || 0);
      setServiceMix((target.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix));
      setTargetPayingUsers(target.target_paying_users || 0);
      setTargetChurnRate(Number(target.target_churn_rate) || 5);
      setNotes(target.notes || "");
    }
  }, [target]);

  // MUTATION: Synchronize Targets
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        month: currentMonth,
        mrr_target_usd: mrrTarget,
        service_mix: serviceMix,
        target_paying_users: targetPayingUsers,
        target_churn_rate: targetChurnRate,
        notes: notes || null,
      };
      if (target?.id) payload.id = target.id;
      await upsertMonthlyTarget(payload);
    },
    onSuccess: () => {
      toast.success("Target Synchronized");
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

  const handleMixChange = (service: ServiceKey, value: number) => {
    // CTO FIX: Constrain input to reasonable bounds
    const safeValue = Math.min(100, Math.max(0, value));
    setServiceMix((prev) => ({ ...prev, [service]: safeValue }));
    setHasChanges(true);
  };

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* EXECUTIVE COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <TargetIcon className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Target Command</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            MRR Optimization · Service Mix Simulation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isClosed ? (
            <Badge className="h-12 px-6 rounded-xl border-2 font-black italic gap-2 bg-muted text-muted-foreground border-border/40 uppercase tracking-widest text-[9px]">
              <Lock className="h-3.5 w-3.5" /> REGISTRY_LOCKED
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <Calendar className="h-4 w-4" /> Close Period
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[40px] border-4 border-destructive/20 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
                  <div className="h-2 w-full bg-gradient-to-r from-destructive to-rose-600" />
                  <div className="p-10 space-y-8">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-destructive leading-none">
                        Terminate Period?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-muted-foreground/80 mt-2">
                        This will finalize actual revenue nodes and lock the registry for this month.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                      <AlertDialogCancel className="h-14 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest px-8">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction className="h-14 rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-[0.2em] px-10 shadow-lg shadow-destructive/20 gap-2">
                        <Lock className="h-4 w-4" /> Confirm Termination
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !hasChanges}
                className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all"
              >
                {saveMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className={cn("h-4 w-4", hasChanges ? "fill-current" : "")} />
                )}
                {saveMutation.isPending ? "Saving…" : "Synchronize"}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
          <CardHeader className="p-8 border-b border-border/10 bg-muted/5 flex flex-row items-center justify-between">
            <div className="space-y-1 text-left">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-emerald-600">
                Revenue Calibration
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                Define MRR parameters and user acquisition targets
              </CardDescription>
            </div>
            <Activity className="h-6 w-6 text-emerald-500/20" />
          </CardHeader>
          <CardContent className="p-8 md:p-10 space-y-10 flex-1">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic ml-2">
                  MRR Target (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-500 italic text-xl">
                    $
                  </span>
                  <Input
                    type="number"
                    value={mrrTarget}
                    onChange={(e) => {
                      setMrrTarget(Number(e.target.value));
                      setHasChanges(true);
                    }}
                    className="h-16 rounded-[20px] border-2 border-border/40 pl-12 text-2xl md:text-3xl font-black italic tracking-tighter bg-background/50 focus-visible:border-emerald-500/50 transition-colors"
                    disabled={isClosed}
                  />
                </div>
              </div>
              <div className="space-y-3 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic ml-2">
                  Target Paying Units
                </Label>
                <Input
                  type="number"
                  value={targetPayingUsers}
                  onChange={(e) => {
                    setTargetPayingUsers(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  className="h-16 rounded-[20px] border-2 border-border/40 px-6 text-2xl md:text-3xl font-black italic tracking-tighter bg-background/50 focus-visible:border-primary/50 transition-colors"
                  disabled={isClosed}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-border/10">
              <StatNode label="ARR_TARGET" value={formatUSD(autoKPIs.arrUsd)} />
              <StatNode label="REQ_USERS" value={autoKPIs.requiredPayingUsers} />
              <StatNode label="EST_LTV" value={formatUSD(autoKPIs.ltvEstimate)} />
              <StatNode label="CAC_CEILING" value={formatUSD(autoKPIs.cacCeiling)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden flex flex-col justify-center relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
          <CardContent className="p-10 text-center space-y-6 relative z-10">
            <div className="mx-auto h-20 w-20 rounded-[24px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 mb-2">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                Credit Yield Protocol
              </p>
              <h3 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none text-foreground drop-shadow-sm">
                {totalCreditsTarget.toLocaleString()}
              </h3>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto border-t border-primary/10 pt-4">
              Total Credits required to satisfy {formatUSD(mrrTarget)} target
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden text-left backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Mix Infrastructure
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              Distribute expected usage load across neural service nodes
            </CardDescription>
          </div>
          <Badge
            className={cn(
              "font-black italic px-4 py-2 border-2 text-[10px] uppercase tracking-widest rounded-xl shrink-0",
              totalMixPercent === 100
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20",
            )}
          >
            TOTAL_MIX: {totalMixPercent}%
          </Badge>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2">
            {(Object.keys(IR_CONFIG.SERVICE_LABELS) as ServiceKey[]).map((service) => {
              const serviceTarget = serviceTargets.find((s) => s.service === service);
              const mixValue = serviceMix[service] || 0;
              return (
                <div
                  key={service}
                  className="space-y-6 p-8 rounded-[32px] border-2 border-border/10 bg-muted/5 group hover:border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Label className="font-black uppercase italic text-sm tracking-widest group-hover:text-primary transition-colors">
                      {IR_CONFIG.SERVICE_LABELS[service]}
                    </Label>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black italic tracking-tight text-foreground/90">
                        {formatUSD(serviceTarget?.revenueUsd || 0)}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {serviceTarget?.creditTarget.toLocaleString()} CR
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <Slider
                      value={[mixValue]}
                      onValueChange={([v]) => handleMixChange(service, v)}
                      max={100}
                      step={1}
                      className="flex-1"
                      disabled={isClosed}
                    />
                    <div className="w-24 relative shrink-0">
                      <Input
                        type="number"
                        value={mixValue}
                        onChange={(e) => handleMixChange(service, Number(e.target.value))}
                        className="h-12 rounded-xl border-2 text-center font-black pr-6 bg-background/50"
                        disabled={isClosed}
                        max={100}
                        min={0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                        %
                      </span>
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
}

// ATOMIC SUB-COMPONENTS
function StatNode({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 rounded-2xl bg-background/50 border-2 border-border/10 text-left hover:border-primary/20 transition-colors shadow-sm">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black italic text-xl leading-none text-foreground/90 tracking-tight">{value}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-10 p-4 md:p-6 animate-pulse">
      <Skeleton className="h-32 w-full rounded-[40px] bg-muted/40" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-[40px] bg-muted/40" />
        <Skeleton className="h-[400px] rounded-[40px] bg-muted/40" />
      </div>
    </div>
  );
}
