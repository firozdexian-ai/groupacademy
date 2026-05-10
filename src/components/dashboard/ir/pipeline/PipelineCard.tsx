import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, Users } from "lucide-react";
import { formatUSD } from "@/lib/irConfig";
import { cn } from "@/lib/utils";
import type { PipelineInvestor, LeadCapability } from "@/hooks/useIRPipeline";

const LEAD_BADGE: Record<
  LeadCapability,
  { label: string; className: string; icon: typeof Crown }
> = {
  lead: { label: "Lead", className: "bg-primary text-primary-foreground", icon: Crown },
  co_lead: {
    label: "Co-lead",
    className: "bg-primary/70 text-primary-foreground",
    icon: Crown,
  },
  follower: {
    label: "Follower",
    className: "bg-muted text-muted-foreground",
    icon: Users,
  },
  syndicate: {
    label: "Syndicate",
    className: "bg-secondary text-secondary-foreground",
    icon: Users,
  },
  angel: {
    label: "Angel",
    className: "bg-accent text-accent-foreground",
    icon: Users,
  },
};

interface Props {
  investor: PipelineInvestor;
  index: number;
  onSelect?: (investor: PipelineInvestor) => void;
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
            "group rounded-lg border bg-card p-3 shadow-sm transition cursor-grab active:cursor-grabbing",
            "hover:border-primary/40 hover:shadow-md",
            snapshot.isDragging && "rotate-1 shadow-lg ring-2 ring-primary/30",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold text-sm">{investor.full_name}</div>
              {investor.vc_firm?.name && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{investor.vc_firm.name}</span>
                </div>
              )}
            </div>
            <Badge className={cn("shrink-0 gap-1 text-[10px]", lead.className)}>
              <LeadIcon className="h-3 w-3" />
              {lead.label}
            </Badge>
          </div>

          {(checkRange || investor.probability_pct > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {checkRange && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                  {checkRange}
                </span>
              )}
              {investor.probability_pct > 0 && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                  {investor.probability_pct}% prob
                </span>
              )}
              {investor.expected_close_date && (
                <span className="rounded bg-muted px-1.5 py-0.5">
                  ETA {new Date(investor.expected_close_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
