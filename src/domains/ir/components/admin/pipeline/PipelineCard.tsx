import { Draggable } from "@hello-pangea/dnd";
import { formatUSD } from "@/lib/irConfig";
import { Crown, Users, TrendingUp, Calendar as CalIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LEAD_BADGE: Record<string, { label: string; className: string; icon: any }> = {
  lead: { label: "True Lead", className: "bg-primary/10 text-primary border-primary/30", icon: Crown },
  co_lead: {
    label: "Co-Lead",
    className: "bg-primary/10 text-primary border-primary/30",
    icon: Crown,
  },
  follower: {
    label: "Follower",
    className: "bg-muted text-muted-foreground border-border/40",
    icon: Users,
  },
  syndicate: {
    label: "Syndicate",
    className: "bg-warning/10 text-warning border-warning/30",
    icon: Users,
  },
  angel: {
    label: "Angel",
    className: "bg-accent/10 text-accent border-accent/30",
    icon: Users,
  },
};

interface Props {
  investor: any;
  index: number;
  onSelect?: (investor: any) => void;
}

export function PipelineCard({ investor, index, onSelect }: Props) {
  const lead = LEAD_BADGE[investor.lead_capability] ?? LEAD_BADGE.follower;
  const LeadIcon = lead.icon;

  const checkRange =
    investor.check_size_min_usd || investor.check_size_max_usd
      ? `${investor.check_size_min_usd ? formatUSD(investor.check_size_min_usd) : "?"} – ${
          investor.check_size_max_usd ? formatUSD(investor.check_size_max_usd) : "?"
        }`
      : null;

  return (
    <Draggable draggableId={investor.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect?.(investor)}
          className={cn(
            "group rounded-xl border-2 bg-card p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing",
            "hover:border-primary/40 hover:shadow-md",
            snapshot.isDragging
              ? "rotate-2 shadow-sm border-primary bg-background scale-105 z-50"
              : "border-border/20",
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-sm uppercase italic tracking-tight truncate group-hover:text-primary transition-colors">
                {investor.full_name}
              </h4>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground mt-0.5 truncate">
                {investor.vc_firm?.name ? (
                  <>
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{investor.vc_firm.name}</span>
                  </>
                ) : (
                  <span className="opacity-50">Independent</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-md border",
                lead.className,
              )}
            >
              <LeadIcon className="h-2.5 w-2.5" />
              {lead.label}
            </span>
            {investor.probability_pct > 0 && (
              <span className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-md bg-muted text-foreground/70 border border-border/40">
                <TrendingUp className="h-2.5 w-2.5 text-success" />
                {investor.probability_pct}%
              </span>
            )}
          </div>

          {(checkRange || investor.expected_close_date) && (
            <div className="border-t border-border/10 pt-3 flex flex-col gap-1.5">
              {checkRange && (
                <div className="text-[10px] font-mono font-bold text-foreground/80 flex items-center justify-between">
                  <span className="text-[8px] text-muted-foreground uppercase font-sans tracking-widest">
                    TGT Check
                  </span>
                  {checkRange}
                </div>
              )}
              {investor.expected_close_date && (
                <div className="text-[10px] font-bold text-muted-foreground flex items-center justify-between">
                  <span className="text-[8px] flex items-center gap-1">
                    <CalIcon className="h-2.5 w-2.5" /> ETA
                  </span>
                  {new Date(investor.expected_close_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
