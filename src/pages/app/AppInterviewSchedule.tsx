import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { confirmInterviewSlot } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AppInterviewSchedule() {
  const { id: applicationId, interviewId } = useParams<{ id: string; interviewId: string }>();
  const nav = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: iv } = await supabase.from("interviews").select("*").eq("id", interviewId!).maybeSingle();
    const { data: sl } = await supabase
      .from("interview_slots")
      .select("*")
      .eq("interview_id", interviewId!)
      .order("starts_at");
    setInterview(iv);
    setSlots(sl ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (interviewId) void load();
  }, [interviewId]);

  const pick = async (slotId: string) => {
    setSaving(slotId);
    const ok = await confirmInterviewSlot(interviewId!, slotId);
    setSaving(null);
    if (ok) {
      toast.success("Interview confirmed");
      void load();
    } else toast.error("Could not confirm");
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!interview) return <div className="p-8 text-center text-muted-foreground">Interview not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => nav(`/app/applications/${applicationId}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to application
      </Button>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Pick your interview time</h2>
          </div>
          <Badge variant="secondary">{interview.mode} · {interview.duration_min} min</Badge>
          {interview.note && <p className="text-sm text-muted-foreground">{interview.note}</p>}
          {interview.status === "confirmed" ? (
            <div className="rounded-md bg-success/10 p-3 text-sm">
              ✓ Confirmed for{" "}
              <strong>
                {slots.find((s) => s.id === interview.selected_slot_id)?.starts_at &&
                  format(new Date(slots.find((s) => s.id === interview.selected_slot_id).starts_at), "PPp")}
              </strong>
              {interview.meeting_link && (
                <div className="mt-2">
                  <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-primary underline">
                    Join meeting →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => pick(s.id)}
                  disabled={!!saving}
                >
                  <span>{format(new Date(s.starts_at), "PPp")}</span>
                  {saving === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Pick</span>}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
