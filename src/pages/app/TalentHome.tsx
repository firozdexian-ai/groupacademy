import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  ChevronRight,
  Award,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalent } from "@/hooks/useTalent";
import { useTalentPitches } from "@/hooks/useTalentPitches";
import { useSkillCredentials } from "@/hooks/useSkillCredentials";
import { computeReadiness } from "@/lib/talentReadiness";
import { formatDistanceToNow } from "date-fns";
import {
  GRO10X_BG,
  GRO10X_PANEL,
  GRO10X_TEXT,
  GRO10X_MUTED,
} from "@/gro10x/lib/tokens";

/**
 * /app/me — Talent Home Dashboard.
 * Mobile-first, follows the Gro10x golden standard:
 *   shell  : bg-[#0B1220]
 *   panel  : bg-[#0F172A] + border-white/5 + rounded-2xl
 *   accent : #33E1E4 (cyan) · success #10D576 · warn amber-400
 *   type   : text-slate-100 / text-slate-400 / micro 10–11px
 */
export default function TalentHome() {
  const navigate = useNavigate();
  const { talent, isLoading: talentLoading } = useTalent();
  const { pitches, isLoading: pitchesLoading } = useTalentPitches(5);
  const { data: credentials = [], isLoading: credsLoading } = useSkillCredentials(talent?.id);

  const readiness = useMemo(() => computeReadiness(talent), [talent]);
  const dispatchedCount = pitches.filter((p) => p.dispatched).length;
  const greeting = talent?.fullName?.split(" ")[0] || "there";

  return (
    <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24`}>
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <header className="px-1">
          <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>Welcome back</p>
          <h1 className="text-xl font-semibold mt-0.5">Hi {greeting} 👋</h1>
        </header>

        {/* === Card 1: Market Readiness === */}
        {talentLoading ? (
          <Skeleton className="h-36 w-full rounded-2xl bg-white/5" />
        ) : readiness.isLive ? (
          <div className={`${GRO10X_PANEL} border border-[#10D576]/30 rounded-2xl p-4`}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-[#10D576]/15 grid place-items-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-[#10D576]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold">You are LIVE on the Gro10x market</h2>
                <p className={`text-[11px] ${GRO10X_MUTED} mt-0.5`}>
                  Employers can discover and pitch you. Keep your profile fresh for better matches.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={!talent?.id}
                    onClick={() => navigate(`/t/${talent?.id ?? ""}`)}
                    className="h-8 px-3 text-xs rounded-lg border border-white/10 hover:bg-white/5 inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview public profile
                  </button>
                  <button
                    onClick={() => navigate("/app/profile/edit")}
                    className="h-8 px-3 text-xs rounded-lg text-slate-300 hover:bg-white/5"
                  >
                    Edit profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${GRO10X_PANEL} border border-amber-400/30 rounded-2xl p-4`}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-400/15 grid place-items-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold">Hidden from employers</h2>
                <p className={`text-[11px] ${GRO10X_MUTED} mt-0.5`}>
                  Add{" "}
                  <span className="font-semibold text-slate-100">
                    {readiness.missing.map((m) => m.label).join(", ")}
                  </span>{" "}
                  to go live on the Gro10x talent market.
                </p>
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2A7DDE] to-[#33E1E4]"
                      style={{ width: `${readiness.percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] ${GRO10X_MUTED}`}>{readiness.percent}% complete</span>
                    <button
                      onClick={() => navigate("/app/profile/edit")}
                      className="h-8 px-3 text-xs rounded-lg bg-[#33E1E4]/15 text-[#33E1E4] hover:bg-[#33E1E4]/25 font-medium"
                    >
                      Complete profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Card 2: Employer Pitches === */}
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#33E1E4]/15 grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#33E1E4]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight">Employer pitches</h2>
                <p className={`text-[11px] ${GRO10X_MUTED}`}>
                  {pitchesLoading
                    ? "Checking…"
                    : pitches.length === 0
                      ? "No pitches yet"
                      : `${dispatchedCount} ${dispatchedCount === 1 ? "employer has" : "employers have"} reached out`}
                </p>
              </div>
            </div>
            {pitches.length > 0 && (
              <button
                onClick={() => navigate("/app/pitches")}
                className="h-7 px-2 text-xs rounded-md text-[#33E1E4] hover:bg-white/5 inline-flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {pitchesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-14 w-full rounded-xl bg-white/5" />
            </div>
          ) : pitches.length === 0 ? (
            <p className={`text-xs ${GRO10X_MUTED} text-center py-4`}>
              When employers unlock your profile, their pitch will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {pitches.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate("/app/pitches")}
                  className="w-full text-left p-3 rounded-xl bg-black/20 hover:bg-white/5 border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {p.company_logo ? (
                      <img src={p.company_logo} alt="" className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-white/5 grid place-items-center">
                        <Building2 className="h-3 w-3 text-slate-400" />
                      </div>
                    )}
                    <span className="text-xs font-semibold truncate flex-1 text-slate-100">
                      {p.company_name || "An employer"}
                    </span>
                    <span className={`text-[10px] ${GRO10X_MUTED} shrink-0`}>
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-xs ${GRO10X_MUTED} line-clamp-2`}>{p.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === Card 3: Skill summary === */}
        <button
          onClick={() => navigate("/app/talent-mirror")}
          className={`w-full ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 text-left`}
        >
          <div className="h-9 w-9 rounded-full bg-[#2A7DDE]/15 grid place-items-center shrink-0">
            <Award className="h-4 w-4 text-[#2A7DDE]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Verified skills</p>
            <p className={`text-[11px] ${GRO10X_MUTED}`}>
              {credsLoading
                ? "Loading…"
                : credentials.length === 0
                  ? "Take a quiz or scenario to earn your first credential"
                  : `${credentials.length} verified · open Talent Mirror`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
