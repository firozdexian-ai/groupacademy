/**
 * AppSessionJoin — auth-gated redirect that records attendance and opens
 * the meeting link in a new tab. Used by reminder emails and rail.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio, ExternalLink, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMarkAttendance } from "@/hooks/useCohorts";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

export default function AppSessionJoin() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const mark = useMarkAttendance();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/app/sessions/${sessionId}/join`)}`);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select("id,title,scheduled_date,duration_minutes,meeting_link,recording_link,status,event_timezone,content_id")
        .eq("id", sessionId!).maybeSingle();
      if (error || !data) { setError("Session not found."); return; }
      setSession(data);
      mark.mutate(sessionId!);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user, authLoading]);

  useEffect(() => {
    if (!session?.meeting_link || opened) return;
    const start = new Date(session.scheduled_date).getTime();
    if (start - Date.now() < 10 * 60_000) {
      window.open(session.meeting_link, "_blank", "noopener,noreferrer");
      setOpened(true);
    }
  }, [session, opened]);

  if (authLoading || (!session && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/app/my-learning")}>
          Back to learning
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-3">
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-rose-500" />
          <h1 className="text-base font-semibold">{session.title}</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatEventTime(session.scheduled_date, session.event_timezone || DEFAULT_EVENT_TZ)} • {session.duration_minutes ?? 60} min
        </p>
        {session.meeting_link ? (
          <Button asChild className="w-full mt-4 rounded-xl">
            <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Open meeting room
            </a>
          </Button>
        ) : session.recording_link ? (
          <Button asChild className="w-full mt-4 rounded-xl" variant="outline">
            <a href={session.recording_link} target="_blank" rel="noopener noreferrer">
              Watch recording
            </a>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">Meeting link will appear here once your instructor publishes it.</p>
        )}
        <p className="text-[11px] text-emerald-600 mt-3">✓ Your attendance was recorded.</p>
      </Card>
    </div>
  );
}
