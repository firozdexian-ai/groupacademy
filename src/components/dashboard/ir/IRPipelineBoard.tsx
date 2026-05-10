import React, { useMemo, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, TrendingUp, Target, Banknote, Users, Activity, Layers } from "lucide-react";
import { useIRPipeline, PipelineStage } from "./hooks/useIRPipeline";
import { formatUSD } from "@/lib/irConfig";
import { PipelineColumn } from "./pipeline/PipelineColumn";
import { InvestorDetailSheet } from "./InvestorDetailSheet";
import { cn } from "@/lib/utils";

const STAGES: { id: PipelineStage; label: string; accent: string }[] = [
  { id: "target", label: "Target List", accent: "bg-slate-500" },
  { id: "warm_intro", label: "Warm Intro", accent: "bg-blue-500" },
  { id: "first_meeting", label: "First Meeting", accent: "bg-indigo-500" },
  { id: "partner_pitch", label: "Partner Pitch", accent: "bg-violet-500" },
  { id: "deep_diligence", label: "Deep Diligence", accent: "bg-amber-500" },
  { id: "term_sheet", label: "Term Sheet", accent: "bg-emerald-500" },
  { id: "closed", label: "Closed/Won", accent: "bg-teal-500" },
  { id: "passed", label: "Passed", accent: "bg-rose-500" },
];

type LeadFilter = "all" | "leads" | "followers";

export function IRPipelineBoard() {
  const { data, isLoading, moveCard } = useIRPipeline();
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (leadFilter === "all") return data;
    if (leadFilter === "leads")
      return data.filter((i) => i.lead_capability === "lead" || i.lead_capability === "co_lead");
    return data.filter((i) => i.lead_capability !== "lead" && i.lead_capability !== "co_lead");
  }, [data, leadFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {
      target: [],
      warm_intro: [],
      first_meeting: [],
      partner_pitch: [],
      deep_diligence: [],
      term_sheet: [],
      closed: [],
      passed: [],
    };
    for (const inv of filtered) map[inv.pipeline_stage]?.push(inv);
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const all = data ?? [];
    const active = all.filter((i) => i.pipeline_stage !== "closed" && i.pipeline_stage !== "passed");
    const trueLeads = active.filter((i) => i.lead_capability === "lead" || i.lead_capability === "co_lead");
    const followers = active.filter((i) => i.lead_capability !== "lead" && i.lead_capability !== "co_lead");
    const pipelineValue = active.reduce(
      (sum, inv) => sum + (Number(inv.check_size_max_usd) || 0) * ((inv.probability_pct || 0) / 100),
      0,
    );
    const termSheetValue = all
      .filter((i) => i.pipeline_stage === "term_sheet")
      .reduce((s, i) => s + (Number(i.check_size_max_usd) || 0), 0);
    return { trueLeads: trueLeads.length, followers: followers.length, pipelineValue, termSheetValue };
  }, [data]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    moveCard.mutate({
      investorId: draggableId,
      toStage: destination.droppableId as PipelineStage,
      toPosition: destination.index,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Layers className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Capital Pipeline</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Active Syndicate Mapping & Term Sheet Velocity
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 bg-background/50 p-1.5 rounded-[20px] border-2 border-border/20 shadow-sm">
          <Filter className="h-4 w-4 text-muted-foreground ml-3" />
          <Select value={leadFilter} onValueChange={(v) => setLeadFilter(v as LeadFilter)}>
            <SelectTrigger className="w-[200px] h-11 border-none bg-transparent font-black uppercase text-[10px] tracking-widest focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest">
                Global Pipeline
              </SelectItem>
              <SelectItem value="leads" className="font-bold text-[10px] uppercase tracking-widest text-primary">
                True Leads Only
              </SelectItem>
              <SelectItem
                value="followers"
                className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Momentum / Followers
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="True Leads"
          value={String(stats.trueLeads)}
          hint="Lead/co-lead capable"
          color="text-primary"
          bg="bg-primary/10"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Momentum"
          value={String(stats.followers)}
          hint="Followers / syndicate"
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Weighted Pipeline"
          value={formatUSD(stats.pipelineValue)}
          hint="Σ Check × Probability"
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <KpiCard
          icon={<Banknote className="h-4 w-4" />}
          label="Term Sheet Phase"
          value={formatUSD(stats.termSheetValue)}
          hint="Capital in final diligence"
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6">
        {isLoading ? (
          <div className="flex gap-6 h-full min-h-[500px]">
            {STAGES.map((s, i) => (
              <div key={i} className="w-[320px] shrink-0 h-full">
                <Skeleton className="h-12 w-full mb-4 rounded-xl bg-muted/40" />
                <Skeleton className="h-full w-full rounded-[24px] bg-muted/20" />
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full items-stretch pb-2">
              {STAGES.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage.id}
                  label={stage.label}
                  accent={stage.accent}
                  investors={grouped[stage.id] || []}
                  onSelect={(inv) => setSelected(inv.id)}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      <InvestorDetailSheet
        investorId={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 line-clamp-1">
            {label}
          </p>
          <p className="text-2xl font-black italic tracking-tighter leading-none truncate">{value}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1.5 truncate">
            {hint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
