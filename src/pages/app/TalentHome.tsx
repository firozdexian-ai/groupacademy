import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  ChevronRight,
  Award,
  Eye,
  Rocket,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useTalentPitches } from "@/domains/profile/hooks/useTalentPitches";
import { useSkillCredentials } from "@/domains/learning";
import { computeReadiness } from "@/lib/talentReadiness";
import { formatDistanceToNow } from "date-fns";
import { boostProfile, getTalentBoostUntil } from "@/domains/talent/repo/talentRepo";
import { toast } from "sonner";
import { GRO10X_BG, GRO10X_PANEL, GRO10X_TEXT, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

// Production Data Contracts[cite: 8]
interface Pitch {
  id: string;
  company_name: string | null;
  company_logo: string | null;
  message: string;
  created_at: string;
}

export default function TalentHome() {
  const navigate = useNavigate();
  const { talent, isLoading: talentLoading } = useTalent();
  const { pitches, isLoading: pitchesLoading } = useTalentPitches(5);
  const { data: credentials = [], isLoading: credsLoading } = useSkillCredentials(talent?.id);

  const [boosting, setBoosting] = useState(false);
  const [boostUntil, setBoostUntil] = useState<string | null>(null);

  // Digital Workforce Anomaly Reporting[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await adminSupportAssistant({ type: "talent_home_error", event, context });
  };

  useEffect(() => {
    if (!talent?.id) return;
    const fetchSettings = async () => {
      try {
        const boostUntilVal = await getTalentBoostUntil(talent.id);
        setBoostUntil(boostUntilVal);
      } catch (e) {
        await reportAnomaly("BoostStatusFetchFailure", { error: e });
      }
    };
    fetchSettings();
  }, [talent?.id, boosting]);

  const readiness = useMemo(() => computeReadiness(talent), [talent]);
  const isBoosted = useMemo(() => boostUntil && new Date(boostUntil) > new Date(), [boostUntil]);
  const dispatchedCount = pitches.filter((p: any) => p.dispatched).length;

  const boost = async () => {
    setBoosting(true);
    try {
      const { error } = await supabase.rpc("boost_profile");
      if (error) throw error;
      toast.success("Profile Pinned for 24h.");
      setBoostUntil(new Date(Date.now() + 86400000).toISOString());
    } catch (e) {
      await reportAnomaly("BoostActionFailure", { error: e });
      toast.error("Boost operational fault.");
    } finally {
      setBoosting(false);
    }
  };

  return (
    <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24`}>
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <header className="px-1">
          <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>Welcome back</p>
          <h1 className="text-xl font-semibold mt-0.5">Hi {talent?.fullName?.split(" ")[0] || "there"} 👋</h1>
        </header>

        {/* Readiness Card */}
        {talentLoading ? (
          <Skeleton className="h-36 w-full rounded-2xl bg-white/5" />
        ) : readiness.isLive ? (
          <div className={`${GRO10X_PANEL} border border-[#10D576]/30 rounded-2xl p-4`}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-[#10D576]/15 grid place-items-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-[#10D576]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold">You are LIVE on Gro10x</h2>
                <p className={`text-[11px] ${GRO10X_MUTED} mt-0.5`}>
                  Employers are currently matching against your node.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/t/${talent?.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
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
                  Add {readiness.missing.map((m) => m.label).join(", ")} to go live.
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2A7DDE] to-[#33E1E4]"
                    style={{ width: `${readiness.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pitches */}
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#33E1E4]/15 grid place-items-center">
                <Sparkles className="h-4 w-4 text-[#33E1E4]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Employer pitches</h2>
                <p className={`text-[11px] ${GRO10X_MUTED}`}>
                  {pitchesLoading ? "Checking..." : `${dispatchedCount} outreach nodes`}
                </p>
              </div>
            </div>
          </div>
          {pitches.map((p: Pitch) => (
            <button
              key={p.id}
              onClick={() => navigate("/app/pitches")}
              className="w-full text-left p-3 rounded-xl bg-black/20 hover:bg-white/5 border border-white/5 mt-2"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold truncate">{p.company_name}</span>
              </div>
              <p className={`text-xs ${GRO10X_MUTED} line-clamp-2`}>{p.message}</p>
            </button>
          ))}
        </div>

        {/* Credentials */}
        <button
          onClick={() => navigate("/app/talent-mirror")}
          className={`w-full ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5`}
        >
          <div className="h-9 w-9 rounded-full bg-[#2A7DDE]/15 grid place-items-center">
            <Award className="h-4 w-4 text-[#2A7DDE]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Verified skills</p>
            <p className={`text-[11px] ${GRO10X_MUTED}`}>{credentials.length} mastery nodes synchronized</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
