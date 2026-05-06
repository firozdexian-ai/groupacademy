/**
 * UpcomingSessionsRail — compact rail showing the learner's next live sessions.
 * Used inside My Learning + Learning Hub.
 */
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Radio, Video } from "lucide-react";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { useUpcomingSessions } from "@/hooks/useCohorts";

export function UpcomingSessionsRail() {
  const { data, isLoading } = useUpcomingSessions(6);
  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold tracking-tight inline-flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-rose-500" /> Upcoming live sessions
        </h2>
        <span className="text-[10px] text-muted-foreground">{data.length}</span>
      </div>
      <div className="space-y-2">
        {data.map((s: any) => {
          const startMs = new Date(s.scheduled_date).getTime();
          const diff = startMs - Date.now();
          const live = diff <= 0 && diff > -(s.duration_minutes ?? 60) * 60_000;
          return (
            <Card key={s.session_id} className="p-3 rounded-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.course_title}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatEventTime(s.scheduled_date, DEFAULT_EVENT_TZ)}
                  </div>
                </div>
                {live ? (
                  <Badge className="bg-rose-500/10 text-rose-600 border-0 text-[10px]">
                    <Radio className="h-3 w-3 mr-0.5 animate-pulse" /> Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">{s.kind}</Badge>
                )}
              </div>
              <Button asChild size="sm" className="w-full mt-2 rounded-xl">
                <Link to={`/app/sessions/${s.session_id}/join`}>
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  {live ? "Join now" : "View session"}
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
