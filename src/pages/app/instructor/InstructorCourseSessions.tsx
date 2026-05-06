/**
 * InstructorCourseSessions — instructor cockpit for a single course:
 * cohorts list + sessions + attendance grid.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Loader2, Calendar, Users, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCohorts, useCohortSessions, useSaveSession, useSaveCohort, useInstructorAttendance } from "@/hooks/useCohorts";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { useToast } from "@/hooks/use-toast";

export default function InstructorCourseSessions() {
  const { contentId } = useParams<{ contentId: string }>();
  const { data: cohorts = [], isLoading } = useCohorts(contentId);
  const [activeCohort, setActiveCohort] = useState<string | null>(null);
  const [showCohort, setShowCohort] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [attendanceFor, setAttendanceFor] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const cohort = cohorts.find((c: any) => c.id === activeCohort) ?? cohorts[0];

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <Link to="/app/instructor" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="h-3 w-3" /> Workspace
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold tracking-tight">Cohorts & Sessions</h1>
          <Button size="sm" onClick={() => setShowCohort(true)}><Plus className="h-3.5 w-3.5 mr-1" />Cohort</Button>
        </div>
      </header>

      <main className="px-4 mt-3 space-y-3">
        {/* Cohorts row */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {cohorts.map((c: any) => (
            <button key={c.id} onClick={() => setActiveCohort(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${(cohort?.id === c.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
              {c.name}
            </button>
          ))}
        </div>

        {cohort && (
          <CohortSessions
            cohort={cohort}
            onAddSession={() => setShowSession(true)}
            onAttendance={(sid) => setAttendanceFor(sid)}
          />
        )}
      </main>

      <CohortSheet open={showCohort} onClose={() => setShowCohort(false)} contentId={contentId!} />
      <SessionSheet open={showSession} onClose={() => setShowSession(false)} cohort={cohort} contentId={contentId!} />
      <AttendanceSheet sessionId={attendanceFor} onClose={() => setAttendanceFor(null)} />
    </div>
  );
}

function CohortSessions({ cohort, onAddSession, onAttendance }: any) {
  const { data: sessions = [] } = useCohortSessions(cohort.id);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />{cohort.starts_on ?? "self-paced"}{cohort.ends_on ? ` → ${cohort.ends_on}` : ""}</p>
        <Button size="sm" variant="outline" onClick={onAddSession}><Plus className="h-3.5 w-3.5 mr-1" />Session</Button>
      </div>
      {sessions.length === 0 ? (
        <Card className="p-4 text-xs text-muted-foreground">No sessions yet — add your first lecture.</Card>
      ) : sessions.map((s: any) => (
        <Card key={s.id} className="p-3 rounded-2xl">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">{formatEventTime(s.scheduled_date, s.event_timezone || DEFAULT_EVENT_TZ)} • {s.duration_minutes ?? 60} min</p>
              <div className="mt-1 flex gap-1">
                <Badge variant="outline" className="text-[10px]">{s.kind}</Badge>
                <Badge variant="secondary" className="text-[10px]">{s.status}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAttendance(s.id)}>
              <Users className="h-3.5 w-3.5 mr-1" />Attendance
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CohortSheet({ open, onClose, contentId }: any) {
  const save = useSaveCohort();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ name: "", starts_on: "", ends_on: "", capacity: "", timezone: "Asia/Dhaka", status: "open" });
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>New cohort</SheetTitle></SheetHeader>
        <div className="space-y-2 mt-3">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Starts on</Label><Input type="date" value={form.starts_on} onChange={e => setForm({...form, starts_on: e.target.value})} /></div>
            <div><Label className="text-xs">Ends on</Label><Input type="date" value={form.ends_on} onChange={e => setForm({...form, ends_on: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
            <div><Label className="text-xs">Timezone</Label><Input value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})} /></div>
          </div>
          <Button className="w-full mt-2" onClick={async () => {
            try {
              await save.mutateAsync({ ...form, capacity: form.capacity ? Number(form.capacity) : null, content_id: contentId });
              toast({ title: "Cohort created" }); onClose();
            } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
          }}>Create cohort</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SessionSheet({ open, onClose, cohort, contentId }: any) {
  const save = useSaveSession();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ title: "", scheduled_date: "", duration_minutes: 60, meeting_link: "", kind: "lecture", is_mandatory: false });
  if (!cohort) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>New session — {cohort.name}</SheetTitle></SheetHeader>
        <div className="space-y-2 mt-3">
          <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Date & time</Label><Input type="datetime-local" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} /></div>
            <div><Label className="text-xs">Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} /></div>
          </div>
          <div><Label className="text-xs">Meeting link</Label><Input placeholder="https://meet.google.com/..." value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Kind</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={form.kind} onChange={e => setForm({...form, kind: e.target.value})}>
                <option value="lecture">Lecture</option>
                <option value="office_hours">Office hours</option>
                <option value="review">Review</option>
                <option value="exam">Exam</option>
                <option value="orientation">Orientation</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
          </div>
          <Button className="w-full mt-2" onClick={async () => {
            try {
              await save.mutateAsync({
                ...form,
                cohort_id: cohort.id, content_id: contentId,
                scheduled_date: new Date(form.scheduled_date).toISOString(),
                event_timezone: cohort.timezone || "Asia/Dhaka",
              });
              toast({ title: "Session scheduled" }); onClose();
            } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
          }}>Schedule session</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AttendanceSheet({ sessionId, onClose }: any) {
  const { data, isLoading } = useInstructorAttendance(sessionId ?? undefined);
  return (
    <Sheet open={!!sessionId} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Attendance</SheetTitle></SheetHeader>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto mt-6" /> : (
          <div className="mt-3 space-y-1">
            {(data ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No enrolled learners.</p> :
              (data ?? []).map((r: any) => (
                <div key={r.user_id} className="flex items-center justify-between py-1.5 border-b text-sm">
                  <span className="truncate">{r.display_name || r.user_id.slice(0, 8)}</span>
                  <Badge variant={r.status === "attended" ? "default" : r.status === "partial" ? "secondary" : "outline"} className="text-[10px]">
                    {r.status}
                  </Badge>
                </div>
              ))
            }
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
