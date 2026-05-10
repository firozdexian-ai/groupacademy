import { Droppable } from "@hello-pangea/dnd";
import { formatUSD } from "@/lib/irConfig";
import { PipelineCard } from "./PipelineCard";
import { PipelineStage } from "../hooks/useIRPipeline";
import { cn } from "@/lib/utils";

interface Props {
  stage: PipelineStage;
  label: string;
  accent: string;
  investors: any[];
  onSelect?: (investor: any) => void;
}

export function PipelineColumn({ stage, label, accent, investors, onSelect }: Props) {
  const totalValue = investors.reduce((sum, inv) => sum + (Number(inv.check_size_max_usd) || 0), 0);

  return (
    <div className="w-[340px] flex flex-col shrink-0 rounded-[32px] border-2 border-border/20 bg-muted/10 overflow-hidden shadow-inner">
      {/* Column Header */}
      <div className="p-5 border-b-2 border-border/10 bg-background/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", accent)} />
            <h3 className="font-black text-sm uppercase italic tracking-widest">{label}</h3>
          </div>
          <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center text-[10px] font-black text-muted-foreground">
            {investors.length}
          </div>
        </div>

        {totalValue > 0 ? (
          <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 mt-1 border-t border-border/10 pt-2">
            Vol:{" "}
            <span
              className={cn("italic font-mono", stage === "term_sheet" ? "text-emerald-500" : "text-foreground/80")}
            >
              {formatUSD(totalValue)}
            </span>
          </div>
        ) : (
          <div className="h-6" /> // spacer
        )}
      </div>

      {/* Droppable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        <Droppable droppableId={stage}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "min-h-full rounded-[20px] transition-colors p-1 space-y-3",
                snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/20" : "",
              )}
            >
              {investors.map((inv, idx) => (
                <PipelineCard key={inv.id} investor={inv} index={idx} onSelect={onSelect} />
              ))}
              {provided.placeholder}

              {investors.length === 0 && !snapshot.isDraggingOver && (
                <div className="h-32 rounded-[20px] border-2 border-dashed border-border/20 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic m-2">
                  Drop Node Here
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
