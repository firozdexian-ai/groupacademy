import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PipelineApplication } from "@/hooks/useEmployerPipeline";
import { formatDistanceToNow } from "date-fns";

interface Props {
  app: PipelineApplication;
  onClick: () => void;
}

export function ApplicationKanbanCard({ app, onClick }: Props) {
  return (
    <Card
      role="button"
      onClick={onClick}
      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {app.talent_name ?? "Anonymous talent"}
          </p>
          {app.talent_headline && (
            <p className="text-xs text-muted-foreground truncate">
              {app.talent_headline}
            </p>
          )}
        </div>
        {typeof app.ai_match_score === "number" && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {app.ai_match_score}%
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{app.job_title}</span>
        <span className="shrink-0">
          {formatDistanceToNow(new Date(app.last_status_at ?? app.created_at), {
            addSuffix: true,
          })}
        </span>
      </div>
    </Card>
  );
}
