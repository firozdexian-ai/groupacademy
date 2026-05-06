import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  useEmployerPipeline,
  type PipelineApplication,
  type PipelineStatus,
} from "@/hooks/useEmployerPipeline";
import { ApplicationKanbanCard } from "./ApplicationKanbanCard";
import { ApplicationDetailSheet } from "./ApplicationDetailSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

const LANES: { key: PipelineStatus; label: string }[] = [
  { key: "submitted", label: "New" },
  { key: "viewed", label: "Reviewing" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "sent_to_employer", label: "Interview" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

interface Props {
  companyId?: string | null;
  jobId?: string | null;
  showWithdrawn?: boolean;
}

export function ApplicationKanban({ companyId, jobId, showWithdrawn = false }: Props) {
  const { apps, counts, loading, move, reload } = useEmployerPipeline({
    companyId,
    jobId,
  });
  const [selected, setSelected] = useState<PipelineApplication | null>(null);
  const isMobile = useIsMobile();

  const lanes = useMemo(
    () => (showWithdrawn ? [...LANES, { key: "withdrawn" as PipelineStatus, label: "Withdrawn" }] : LANES),
    [showWithdrawn],
  );

  const grouped = useMemo(() => {
    const m = new Map<PipelineStatus, PipelineApplication[]>();
    lanes.forEach((l) => m.set(l.key, []));
    apps.forEach((a) => {
      const arr = m.get(a.application_status);
      if (arr) arr.push(a);
    });
    return m;
  }, [apps, lanes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <Tabs defaultValue={lanes[0].key}>
          <ScrollArea className="w-full">
            <TabsList className="w-max">
              {lanes.map((l) => (
                <TabsTrigger key={l.key} value={l.key} className="gap-2">
                  {l.label}
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {counts[l.key] ?? 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {lanes.map((l) => (
            <TabsContent key={l.key} value={l.key} className="space-y-2 mt-3">
              {(grouped.get(l.key) ?? []).map((a) => (
                <ApplicationKanbanCard key={a.id} app={a} onClick={() => setSelected(a)} />
              ))}
              {(grouped.get(l.key) ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No applications.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <ApplicationDetailSheet
          application={selected}
          onClose={() => setSelected(null)}
          onMove={async (to) => {
            if (!selected) return;
            await move(selected.id, to);
            setSelected(null);
          }}
          onChanged={reload}
          actorRole="recruiter"
        />
      </>
    );
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3">
          {lanes.map((l) => (
            <div key={l.key} className="w-72 shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium">{l.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {counts[l.key] ?? 0}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {(grouped.get(l.key) ?? []).map((a) => (
                  <ApplicationKanbanCard key={a.id} app={a} onClick={() => setSelected(a)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <ApplicationDetailSheet
        application={selected}
        onClose={() => setSelected(null)}
        onMove={async (to) => {
          if (!selected) return;
          await move(selected.id, to);
          setSelected(null);
        }}
        onChanged={reload}
        actorRole="recruiter"
      />
    </>
  );
}
