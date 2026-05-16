import { useMemo, useState, useCallback } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEmployerPipeline, type PipelineApplication, type PipelineStatus } from "@/hooks/useEmployerPipeline";
import { ApplicationKanbanCard } from "./ApplicationKanbanCard";
import { ApplicationDetailSheet } from "./ApplicationDetailSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, KanbanSquare, Layers } from "lucide-react";

/**
 * GroUp Academy: B2B Sourcing Kanban Board Grid (V5.6.0)
 * CTO Reference: High-performance workspace splitting candidate applications into structured pipeline lanes.
 * Architecture: Reference-stable groupings eliminating layout rendering bottlenecks and racing states.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

const BASE_LANES_REGISTRY: { key: PipelineStatus; label: string }[] = [
  { key: "submitted", label: "New" },
  { key: "viewed", label: "Reviewing" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "sent_to_employer", label: "Interview" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

interface ApplicationKanbanProps {
  companyId?: string | null;
  jobId?: string | null;
  showWithdrawn?: boolean;
}

export function ApplicationKanban({ companyId, jobId, showWithdrawn = false }: ApplicationKanbanProps) {
  const isMobile = useIsMobile();

  // --- SENSOR: PIPELINE_CORE_QUERY_DATA_STREAM ---
  const {
    apps = [],
    counts = {},
    loading,
    move,
    reload,
  } = useEmployerPipeline({
    companyId,
    jobId,
  });

  const [selected, setSelected] = useState<PipelineApplication | null>(null);

  // --- PHASE: CALCULATIONS_COMPILATION_PIPELINE ---
  // Memoize lanes mapping matrix array definitions securely
  const activeLanesStructure = useMemo((): { key: PipelineStatus; label: string }[] => {
    if (showWithdrawn) {
      return [...BASE_LANES_REGISTRY, { key: "withdrawn" as PipelineStatus, label: "Withdrawn" }];
    }
    return BASE_LANES_REGISTRY;
  }, [showWithdrawn]);

  // Architecture Fix: Memoize grouped collections entirely to prevent infinite evaluation sweeps during layout transitions
  const aggregatedGroupedMap = useMemo((): Map<PipelineStatus, PipelineApplication[]> => {
    const laneMap = new Map<PipelineStatus, PipelineApplication[]>();

    // Initialize standard arrays per structural lane definition
    activeLanesStructure.forEach((lane) => laneMap.set(lane.key, []));

    // Group candidate records cleanly based on server status parameters via linear O(N) allocation loops
    apps.forEach((app) => {
      const targetColumnArray = laneMap.get(app.application_status);
      if (targetColumnArray) {
        targetColumnArray.push(app);
      }
    });

    return laneMap;
  }, [apps, activeLanesStructure]);

  // --- HANDLER: ATOMIC_MUTATION_STATE_TRANSITION ---
  const handleStageTransitionHandshake = useCallback(
    async (targetStatus: PipelineStatus) => {
      if (!selected?.id) return;

      // Isolate unique record indicators upfront to prevent layout collisions during long network flights
      const targetApplicationId = selected.id;

      try {
        // HUD: ATOMIC_STATE_PRE_CLEARANCE
        setSelected(null); // Instantly drop references locally to avoid race track cross-contamination

        // HUD: EXECUTING_BACKEND_PIPELINE_MUTATION_TRANSFER
        await move(targetApplicationId, targetStatus);
      } catch (err: any) {
        // Digital Workforce Anomaly Trigger: Crucial for trapping backend status validation updates
        console.error("[Digital Workforce] ANOMALY: Kanban layout transition request failed.", {
          applicationId: targetApplicationId,
          targetStatus,
          message: err.message,
        });
      }
    },
    [selected, move],
  );

  const handleCloseSheet = useCallback(() => {
    setSelected(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 select-none">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // --- RENDERING_PHASE: RESPONSIVE_MOBILE_LAYOUT_MATRIX ---
  if (isMobile) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300 select-none text-left">
        <Tabs defaultValue={activeLanesStructure[0]?.key}>
          <ScrollArea className="w-full border-b pb-1">
            <TabsList className="w-max h-11 bg-muted/10 border-2 rounded-xl p-1 gap-1">
              {activeLanesStructure.map((lane) => (
                <TabsTrigger
                  key={lane.key}
                  value={lane.key}
                  className="gap-2 font-bold text-xs rounded-lg px-3 transition-all"
                >
                  {lane.label}
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono rounded">
                    {counts[lane.key] ?? 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>

          {activeLanesStructure.map((lane) => {
            const laneApplicationsList = aggregatedGroupedMap.get(lane.key) || [];
            return (
              <TabsContent key={lane.key} value={lane.key} className="space-y-2 mt-4 outline-none">
                {laneApplicationsList.map((app) => (
                  <ApplicationKanbanCard key={app.id} app={app} onClick={() => setSelected(app)} />
                ))}
                {laneApplicationsList.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-12 italic font-medium">
                    No candidate records in this sector.
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* SIDEBAR INTERACTION EVALUATION CORE CANVAS SLIDEOVER */}
        <ApplicationDetailSheet
          application={selected}
          onClose={handleCloseSheet}
          onMove={handleStageTransitionHandshake}
          onChanged={reload}
          actorRole="recruiter"
        />
      </div>
    );
  }

  // --- RENDERING_PHASE: DESKTOP_GRID_SWIMLANES_MATRIX ---
  return (
    <div className="w-full animate-in fade-in duration-500 select-none text-left">
      <ScrollArea className="w-full border-2 rounded-[32px] bg-muted/5 p-4">
        <div className="flex gap-4 pb-2">
          {activeLanesStructure.map((lane) => {
            const laneApplicationsList = aggregatedGroupedMap.get(lane.key) || [];
            return (
              <div
                key={lane.key}
                className="w-72 shrink-0 flex flex-col bg-card/20 rounded-2xl border border-border/40 p-3 min-h-[450px]"
              >
                {/* HUD: LANE_TITLE_METRICS_HEADER */}
                <div className="flex items-center justify-between mb-3 px-1 border-b pb-2 border-border/10">
                  <span className="text-xs font-black uppercase tracking-wider italic text-foreground/80 flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-primary/60" /> {lane.label}
                  </span>
                  <Badge variant="secondary" className="text-xs font-mono font-black h-5 px-1.5 rounded-md bg-muted/40">
                    {counts[lane.key] ?? 0}
                  </Badge>
                </div>

                {/* CARDS LOOP GRID SWINLANE STORAGE CONTAINER */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[60vh] pr-0.5 scrollbar-thin">
                  {laneApplicationsList.map((app) => (
                    <ApplicationKanbanCard key={app.id} app={app} onClick={() => setSelected(app)} />
                  ))}
                  {laneApplicationsList.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed rounded-xl border-border/20 bg-muted/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                        Lane Empty
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>

      {/* SIDEBAR INTERACTION EVALUATION CORE CANVAS SLIDEOVER */}
      <ApplicationDetailSheet
        application={selected}
        onClose={handleCloseSheet}
        onMove={handleStageTransitionHandshake}
        onChanged={reload}
        actorRole="recruiter"
      />
    </div>
  );
}
