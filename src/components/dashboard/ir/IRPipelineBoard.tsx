import { useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, TrendingUp, Target } from "lucide-react";
import { formatUSD } from "@/lib/irConfig";
import {
  useIRPipeline,
  type PipelineInvestor,
  type PipelineStage,
} from "@/hooks/useIRPipeline";
import { InvestorDetailSheet } from "./InvestorDetailSheet";

const STAGES: { value: PipelineStage; label: string; accent: string }[] = [
  { value: "target", label: "Target", accent: "bg-muted-foreground" },
  { value: "warm_intro", label: "Warm Intro", accent: "bg-blue-400" },
  { value: "first_meeting", label: "First Meeting", accent: "bg-blue-500" },
  { value: "partner_pitch", label: "Partner Pitch", accent: "bg-indigo-500" },
  { value: "deep_diligence", label: "Deep Diligence", accent: "bg-yellow-500" },
  { value: "term_sheet", label: "Term Sheet", accent: "bg-orange-500" },
  { value: "closed", label: "Closed", accent: "bg-green-500" },
  { value: "passed", label: "Passed", accent: "bg-destructive" },
];

type LeadFilter = "all" | "leads" | "followers";

export function IRPipelineBoard() {
  const { data, isLoading, moveCard } = useIRPipeline();
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("all");
  const [selected, setSelected] = useState<PipelineInvestor | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (leadFilter === "all") return data;
    if (leadFilter === "leads")
      return data.filter((i) => i.lead_capability === "lead" || i.lead_capability === "co_lead");
    return data.filter(
      (i) => i.lead_capability !== "lead" && i.lead_capability !== "co_lead",
    );
  }, [data, leadFilter]);

  const grouped = useMemo(() => {
    const map: Record<PipelineStage, PipelineInvestor[]> = {
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
    const active = all.filter(
      (i) => i.pipeline_stage !== "closed" && i.pipeline_stage !== "passed",
    );
    const trueLeads = active.filter(
      (i) => i.lead_capability === "lead" || i.lead_capability === "co_lead",
    );
    const followers = active.filter(
      (i) => i.lead_capability !== "lead" && i.lead_capability !== "co_lead",
    );
    const pipelineValue = active.reduce(
      (sum, inv) =>
        sum +
        (Number(inv.check_size_max_usd) || 0) *
          ((inv.probability_pct || 0) / 100),
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
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    moveCard.mutate({
      investorId: draggableId,
      toStage: destination.droppableId as PipelineStage,
      toPosition: destination.index,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<Crown className="h-4 w-4" />}
          label="True Leads"
          value={String(stats.trueLeads)}
          hint="Lead/co-lead capable"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Momentum"
          value={String(stats.followers)}
          hint="Followers / syndicate"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Weighted Pipeline"
          value={formatUSD(stats.pipelineValue)}
          hint="Σ check × probability"
        />
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="Term Sheet"
          value={formatUSD(stats.termSheetValue)}
          hint="In active term-sheet stage"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Investor Pipeline</h2>
          <p className="text-xs text-muted-foreground">
            Drag investors between stages. Use the filter to focus on true leads
            vs momentum investors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={leadFilter} onValueChange={(v) => setLeadFilter(v as LeadFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All investors</SelectItem>
              <SelectItem value="leads">True leads only</SelectItem>
              <SelectItem value="followers">Momentum / followers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => (
            <Skeleton key={s.value} className="h-[420px] w-[280px] shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {STAGES.map((stage) => (
              <PipelineColumnLazy
                key={stage.value}
                stage={stage.value}
                label={stage.label}
                accent={stage.accent}
                investors={grouped[stage.value] || []}
                onSelect={setSelected}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      <InvestorDetailSheet
        investorId={selected?.id ?? null}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />

      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No investors yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add investors from the <strong>Investors</strong> tab. They will
            appear here in the <em>Target</em> column by default.
            <div className="mt-3">
              <Badge variant="outline">Stages</Badge>
              <p className="mt-1 text-xs">
                Target → Warm Intro → First Meeting → Partner Pitch → Deep
                Diligence → Term Sheet → Closed
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span className="font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

// Lazy-render to avoid pulling Droppable into the main bundle
import { PipelineColumn } from "./pipeline/PipelineColumn";
const PipelineColumnLazy = PipelineColumn;
