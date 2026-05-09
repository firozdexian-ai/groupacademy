import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Clock, Award } from "lucide-react";
import { useMemo } from "react";
import { useMyTrackAssignments, useTrackProgress } from "@/hooks/useLearningTracks";
import { TrackProgressRing } from "@/components/learning/TrackProgressRing";
import { GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { IS_GRO10X } from "@/lib/host";

const LEARN_HOME = IS_GRO10X ? "/gro10x/learn" : "/app/learning";

export default function AppTrackDetail() {
  const { trackId } = useParams<{ trackId: string }>();
  const { data: assignments } = useMyTrackAssignments();
  const assignment = useMemo(
    () => assignments?.find((a) => a.track_id === trackId),
    [assignments, trackId],
  );
  const { data: progress, isLoading } = useTrackProgress(assignment?.id);

  if (!assignment) {
    return (
      <div className="max-w-md md:max-w-3xl mx-auto p-6 text-center">
        <p className="text-sm text-slate-400">No assignment found for this track.</p>
        <Link to={LEARN_HOME} className="text-xs text-[#33E1E4] mt-2 inline-block">
          ← Back to Learn
        </Link>
      </div>
    );
  }

  const track = assignment.learning_tracks;

  return (
    <div className="max-w-md md:max-w-3xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <Link to={LEARN_HOME} className="inline-flex items-center gap-1 text-xs text-slate-400">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <div className="mt-3 flex items-start gap-4">
          <TrackProgressRing
            done={progress?.required_done ?? 0}
            total={progress?.required_total ?? 0}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold leading-tight">{track?.title ?? "Track"}</h1>
            {track?.summary && (
              <p className={`text-xs ${GRO10X_MUTED} mt-1 line-clamp-2`}>{track.summary}</p>
            )}
            {assignment.due_at && (
              <p className="text-[11px] text-amber-300 mt-1 inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due {new Date(assignment.due_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </header>

      {progress?.is_complete && (
        <div className="mx-4 mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-300" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-200">Track completed!</p>
            <p className="text-[11px] text-emerald-300/80">Your certificate has been minted.</p>
          </div>
        </div>
      )}

      <section className="px-4 mt-4 space-y-2">
        <h2 className="text-sm font-semibold mb-2">Steps</h2>
        {isLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : (
          (progress?.items ?? []).map((it, idx) => {
            const prevDone =
              idx === 0 ||
              (progress?.items[idx - 1]?.status === "completed" ||
                (progress?.items[idx - 1]?.completed_at != null));
            return (
              <div
                key={it.content_id}
                className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 flex items-start gap-3`}
              >
                <div className="h-9 w-9 rounded-xl bg-[#0B1220] border border-white/10 grid place-items-center shrink-0">
                  {it.completed_at ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : !prevDone ? (
                    <Lock className="h-4 w-4 text-slate-500" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Step {it.position + 1}</span>
                    {!it.is_required && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/5">Optional</span>
                    )}
                    {it.completed_at && <span className="text-emerald-300">Done</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
