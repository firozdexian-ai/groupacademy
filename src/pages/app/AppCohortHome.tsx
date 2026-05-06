/**
 * AppCohortHome — talent-facing cohort page with header, sessions list, and join CTAs.
 */
import { Link, useParams } from "react-router-dom";
import { Loader2, Calendar, Users, Radio, Video, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCohort, useCohortSessions, useCohortHealth } from "@/hooks/useCohorts";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

export default function AppCohortHome() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { data: cohort, isLoading } = useCohort(cohortId);
  const { data: sessions = [] } = useCohortSessions(cohortId);
  const { data: health } = useCohortHealth(cohortId);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!cohort) return <p className="p-6 text-sm text-center text-muted-foreground">Cohort not found.</p>;

  const upcoming = sessions.filter((s: any) => new Date(s.scheduled_date) >= new Date());
  const past = sessions.filter((s: any) => new Date(s.scheduled_date) < new Date());

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <Link to="/app/my-learning" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="h-3 w-3" /> My Learning
        </Link>
        <h1 className="text-xl font-bold tracking-tight mt-1">{cohort.name}</h1>
        <p className="text-xs text-muted-foreground truncate">{(cohort as any).content?.title}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]"><Calendar className="h-3 w-3 mr-1" />{cohort.starts_on ?? "self-paced"}{cohort.ends_on ? ` → ${cohort.ends_on}` : ""}</Badge>
          {health && (
            <>
              <Badge variant="secondary" className="text-[10px]"><Users className="h-3 w-3 mr-1" />{health.enrollment_count} learners</Badge>
              <Badge variant="secondary" className="text-[10px]">{health.attendance_rate ?? 0}% attendance</Badge>
            </>
          )}
        </div>
      </header>

      <main className="px-4 mt-3 space-y-4">
        <section>
          <h2 className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-rose-500" />Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <Card className="p-4 text-xs text-muted-foreground">No upcoming sessions scheduled.</Card>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s: any) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Past sessions</h2>
            <div className="space-y-2">
              {past.slice(0, 8).map((s: any) => <SessionCard key={s.id} session={s} past />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SessionCard({ session, past = false }: { session: any; past?: boolean }) {
  return (
    <Card className="p-3 rounded-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{session.title}</p>
          <p className="text-[11px] text-muted-foreground">{formatEventTime(session.scheduled_date, session.event_timezone || DEFAULT_EVENT_TZ)} • {session.duration_minutes ?? 60} min</p>
          <Badge variant="outline" className="text-[10px] mt-1">{session.kind}</Badge>
        </div>
        {past ? (
          session.recording_link ? (
            <Button asChild size="sm" variant="outline">
              <a href={session.recording_link} target="_blank" rel="noopener noreferrer">Recording</a>
            </Button>
          ) : <span className="text-[10px] text-muted-foreground">Ended</span>
        ) : (
          <Button asChild size="sm">
            <Link to={`/app/sessions/${session.id}/join`}><Video className="h-3.5 w-3.5 mr-1" />Join</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
