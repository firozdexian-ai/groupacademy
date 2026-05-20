import { formatDistanceToNow } from "date-fns";
import { UserPlus, ListChecks, MessageSquare } from "lucide-react";
import type { CoursePerformance } from "@/lib/coursePerformance";

interface Props {
  recent: CoursePerformance["recent"];
}

const ICONS = {
  enroll: UserPlus,
  quiz: ListChecks,
  scenario: MessageSquare,
};

export default function RecentActivityList({ recent }: Props) {
  if (!recent.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {recent.map((r, i) => {
        const Icon = ICONS[r.kind];
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{r.talentName}</div>
              <div className="text-xs text-muted-foreground">{r.detail}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(r.at), { addSuffix: true })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
