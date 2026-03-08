import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Video } from "lucide-react";

export interface ModuleStats {
  module_count: number;
  modules_with_desc: number;
  modules_with_video: number;
}

interface ContentReadinessBadgeProps {
  stats: ModuleStats | undefined;
}

const ContentReadinessBadge = ({ stats }: ContentReadinessBadgeProps) => {
  if (!stats || stats.module_count === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">No modules</div>
    );
  }

  const descPct = Math.round((stats.modules_with_desc / stats.module_count) * 100);
  const videoPct = Math.round((stats.modules_with_video / stats.module_count) * 100);
  const overallPct = Math.round(((descPct + videoPct) / 2));
  const hasAI = descPct === 100; // Note: modules_with_desc counts descriptions >= 500 chars

  const colorClass = (pct: number) =>
    pct === 100 ? "text-emerald-600" : pct > 0 ? "text-amber-500" : "text-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Progress value={overallPct} className="h-1.5 flex-1" />
        {hasAI && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 h-4">
            <Sparkles className="w-2.5 h-2.5" /> AI
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-muted-foreground">{stats.module_count} modules</span>
        <span className={`flex items-center gap-0.5 ${colorClass(descPct)}`} title="AI-generated descriptions (>200 chars)">
          <FileText className="w-3 h-3" /> {descPct}% desc
        </span>
        <span className={`flex items-center gap-0.5 ${colorClass(videoPct)}`}>
          <Video className="w-3 h-3" /> {videoPct}%
        </span>
      </div>
    </div>
  );
};

export default ContentReadinessBadge;
