import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Calendar, Copy, Trash2, Edit2, Play, CheckCircle2, X, Repeat, Video,
} from "lucide-react";
import { toast } from "sonner";
import { EventDateTimeField } from "@/components/admin/EventDateTimeField";
import { DEFAULT_EVENT_TZ, formatEventTime } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

type SessionStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

interface Session {
  id: string;
  content_id: string;
  instructor_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number | null;
  meeting_link: string | null;
  recording_link: string | null;
  status: SessionStatus;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface Props {
  contentId: string;
  contentTitle: string;
  defaultTimezone?: string;
  parentEventDate?: string | null;
}

const STATUS_STYLES: Record<SessionStatus, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ongoing: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const emptyDraft = (contentId: string): Partial<Session> => ({
  content_id: contentId,
  title: "",
  description: "",
  scheduled_date: "",
  duration_minutes: 60,
  meeting_link: "",
  recording_link: "",
  status: "scheduled",
  instructor_id: null,
});

export default function CourseSessionsManager({
  contentId,
  contentTitle,
  defaultTimezone = DEFAULT_EVENT_TZ,
  parentEventDate,
}: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Session> | null>(null);
  const [tz, setTz] = useState(defaultTimezone);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurDraft, setRecurDraft] = useState({ count: 4, intervalDays: 7, startUtc: "", duration: 60 });

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: ins }] = await Promise.all([
      supabase.from("course_sessions").select("*").eq("content_id", contentId).order("scheduled_date", { ascending: true }),
      supabase.from("instructors").select("id, full_name").order("full_name"),
    ]);
    setSessions((s as Session[]) || []);
    setInstructors((ins as Instructor[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [contentId]);

  const openNew = () => setEditing(emptyDraft(contentId));

  const seedFromParent = () => {
    if (!parentEventDate) return;
    setEditing({
      ...emptyDraft(contentId),
      title: `${contentTitle} — Session 1`,
      scheduled_date: parentEventDate,
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) { toast.error("Title is required"); return; }
    if (!editing.scheduled_date) { toast.error("Schedule is required"); return; }
    const payload: any = {
      content_id: contentId,
      title: editing.title.trim(),
      description: editing.description || null,
      scheduled_date: editing.scheduled_date,
      duration_minutes: editing.duration_minutes ?? 60,
      meeting_link: editing.meeting_link || null,
      recording_link: editing.recording_link || null,
      status: editing.status || "scheduled",
      instructor_id: editing.instructor_id || null,
    };
    const { error } = editing.id
      ? await supabase.from("course_sessions").update(payload).eq("id", editing.id)
      : await supabase.from("course_sessions").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Session updated" : "Session created");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    const { error } = await supabase.from("course_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Session deleted");
    load();
  };

  const setStatus = async (s: Session, status: SessionStatus) => {
    const { error } = await supabase.from("course_sessions").update({ status }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  };

  const generateRecurring = async () => {
    if (!recurDraft.startUtc) { toast.error("Pick a start date"); return; }
    const rows = Array.from({ length: recurDraft.count }, (_, i) => {
      const d = new Date(recurDraft.startUtc);
      d.setDate(d.getDate() + i * recurDraft.intervalDays);
      return {
        content_id: contentId,
        title: `${contentTitle} — Session ${sessions.length + i + 1}`,
        scheduled_date: d.toISOString(),
        duration_minutes: recurDraft.duration,
        status: "scheduled" as SessionStatus,
      };
    });
    const { error } = await supabase.from("course_sessions").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} sessions created`);
    setRecurringOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sessions for</p>
          <h3 className="text-lg font-black tracking-tight">{contentTitle}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Default timezone: {tz}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold uppercase" onClick={() => setRecurringOpen(true)}>
            <Repeat className="w-3.5 h-3.5 mr-1.5" /> Generate Series
          </Button>
          <Button size="sm" className="rounded-xl text-[10px] font-bold uppercase" onClick={openNew}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Session
          </Button>
        </div>
      </div>

      {!loading && sessions.length === 0 && (
        <Card className="rounded-2xl border-2 border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-bold">No sessions scheduled yet</p>
            <p className="text-xs text-muted-foreground">Add session manually or generate a recurring series.</p>
            {parentEventDate && (
              <Button variant="outline" size="sm" className="rounded-xl mt-2" onClick={seedFromParent}>
                Create first session from course event date
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sessions.map((s, idx) => {
          const past = new Date(s.scheduled_date).getTime() < Date.now();
          return (
            <Card key={s.id} className={cn("rounded-2xl border-2 transition-colors", past && s.status === "scheduled" && "border-amber-500/30")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Session {idx + 1}</span>
                      <Badge className={cn("text-[8px] font-black uppercase tracking-widest border", STATUS_STYLES[s.status])}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="font-bold text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      📅 {formatEventTime(s.scheduled_date, tz)} · {s.duration_minutes ?? 60} min
                    </p>
                    {s.meeting_link && (
                      <div className="flex items-center gap-2 mt-2">
                        <Video className="w-3 h-3 text-muted-foreground" />
                        <code className="text-[10px] text-muted-foreground truncate flex-1">{s.meeting_link}</code>
                        <Button size="sm" variant="ghost" className="h-6 px-2"
                          onClick={() => { navigator.clipboard.writeText(s.meeting_link!); toast.success("Copied"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {s.recording_link && (
                      <div className="flex items-center gap-2 mt-1">
                        <Play className="w-3 h-3 text-emerald-600" />
                        <code className="text-[10px] text-emerald-600 truncate">{s.recording_link}</code>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold uppercase"
                      onClick={() => setEditing(s)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    {s.status === "scheduled" && (
                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold uppercase text-emerald-600"
                        onClick={() => setStatus(s, "completed")}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                      </Button>
                    )}
                    {s.status !== "cancelled" && s.status !== "completed" && (
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[10px] font-bold uppercase text-destructive"
                        onClick={() => setStatus(s, "cancelled")}>
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-destructive/60 hover:text-destructive"
                      onClick={() => remove(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit / New dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">
              {editing?.id ? "Edit Session" : "New Session"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Title</Label>
                <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Description</Label>
                <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="rounded-xl" />
              </div>
              <EventDateTimeField
                utcValue={editing.scheduled_date || ""}
                timezone={tz}
                onChange={({ utcValue, timezone }) => { setEditing({ ...editing, scheduled_date: utcValue }); setTz(timezone); }}
                label="Scheduled date & time"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Duration (min)</Label>
                  <Input type="number" value={editing.duration_minutes ?? 60}
                    onChange={(e) => setEditing({ ...editing, duration_minutes: parseInt(e.target.value) || 60 })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
                  <Select value={editing.status || "scheduled"} onValueChange={(v) => setEditing({ ...editing, status: v as SessionStatus })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Instructor</Label>
                <Select value={editing.instructor_id || "none"} onValueChange={(v) => setEditing({ ...editing, instructor_id: v === "none" ? null : v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select instructor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Meeting link</Label>
                <Input value={editing.meeting_link || ""} placeholder="https://zoom.us/..." onChange={(e) => setEditing({ ...editing, meeting_link: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Recording link</Label>
                <Input value={editing.recording_link || ""} placeholder="https://youtube.com/..." onChange={(e) => setEditing({ ...editing, recording_link: e.target.value })} className="rounded-xl" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring dialog */}
      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Generate Recurring Series</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <EventDateTimeField
              utcValue={recurDraft.startUtc}
              timezone={tz}
              onChange={({ utcValue, timezone }) => { setRecurDraft({ ...recurDraft, startUtc: utcValue }); setTz(timezone); }}
              label="First session start"
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Sessions</Label>
                <Input type="number" min={1} max={52} value={recurDraft.count}
                  onChange={(e) => setRecurDraft({ ...recurDraft, count: parseInt(e.target.value) || 1 })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Every (days)</Label>
                <Input type="number" min={1} value={recurDraft.intervalDays}
                  onChange={(e) => setRecurDraft({ ...recurDraft, intervalDays: parseInt(e.target.value) || 7 })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Mins</Label>
                <Input type="number" value={recurDraft.duration}
                  onChange={(e) => setRecurDraft({ ...recurDraft, duration: parseInt(e.target.value) || 60 })} className="rounded-xl" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Creates {recurDraft.count} sessions, each {recurDraft.intervalDays} day(s) apart.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRecurringOpen(false)}>Cancel</Button>
            <Button onClick={generateRecurring}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
