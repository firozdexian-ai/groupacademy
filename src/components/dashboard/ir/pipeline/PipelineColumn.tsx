import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { formatUSD } from "@/lib/irConfig";
import { PipelineCard } from "./PipelineCard";
import type { PipelineInvestor, PipelineStage } from "@/hooks/useIRPipeline";

interface Props {
  stage: PipelineStage;
  label: string;
  accent: string;
  investors: PipelineInvestor[];
  onSelect?: (investor: PipelineInvestor) => void;
}

export function PipelineColumn({ stage, label, accent, investors, onSelect }: Props) {
  const totalValue = investors.reduce(
    (sum, inv) => sum + (Number(inv.check_size_max_usd) || 0),
    0,
  );

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2 w-2 rounded-full shrink-0", accent)} />
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {investors.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {formatUSD(totalValue)}
          </span>
        )}
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 overflow-y-auto p-2 min-h-[120px] transition-colors",
              snapshot.isDraggingOver && "bg-primary/5",
            )}
          >
            {investors.map((inv, idx) => (
              <PipelineCard
                key={inv.id}
                investor={inv}
                index={idx}
                onSelect={onSelect}
              />
            ))}
            {provided.placeholder}
            {investors.length === 0 && !snapshot.isDraggingOver && (
              <div className="rounded-md border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                Drop investors here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
