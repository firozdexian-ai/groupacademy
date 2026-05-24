import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
 CheckCircle2,
 AlertTriangle,
 Award,
 Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useSkillCredentials } from "@/domains/learning";
import { computeReadiness } from "@/lib/talentReadiness";
import { boostProfile, getTalentBoostUntil } from "@/domains/talent/repo/talentRepo";
import { toast } from "sonner";
import { GRO10X_BG, GRO10X_PANEL, GRO10X_TEXT, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { trackError } from "@/lib/errorTracking";
import { QuickActionsGrid } from "@/domains/feed/components/talent/QuickActionsGrid";

export default function TalentHome() {
 const navigate = useNavigate();
 const { talent, isLoading: talentLoading } = useTalent();
 const { data: credentials = [], isLoading: credsLoading } = useSkillCredentials(talent?.id);


 const [boosting, setBoosting] = useState(false);
 const [boostUntil, setBoostUntil] = useState<string | null>(null);

 useEffect(() => {
 if (!talent?.id) return;
 const fetchSettings = async () => {
 try {
 const boostUntilVal = await getTalentBoostUntil(talent.id);
 setBoostUntil(boostUntilVal);
 } catch (e) {
 trackError(e, { area: "TalentHome", event: "boost_status_fetch" });
 }
 };
 fetchSettings();
 }, [talent?.id, boosting]);

 const readiness = useMemo(() => computeReadiness(talent), [talent]);
 const isBoosted = useMemo(() => boostUntil && new Date(boostUntil) > new Date(), [boostUntil]);


 const boost = async () => {
 setBoosting(true);
 try {
 await boostProfile();
 toast.success("Your profile is pinned to the top for 24 hours.");
 setBoostUntil(new Date(Date.now() + 86400000).toISOString());
 } catch (e) {
 trackError(e, { area: "TalentHome", event: "boost_action" });
 toast.error("Couldn't boost your profile — please try again.");
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
 <h2 className="text-sm font-semibold">You're live on Gro10x</h2>
 <p className={`text-[11px] ${GRO10X_MUTED} mt-0.5`}>
 Employers can find your profile and reach out.
 </p>
 <div className="mt-3 flex flex-wrap gap-2">
 <Button
 variant="outline"
 size="sm"
 className="h-8 text-xs gap-1.5"
 onClick={() => navigate(`/t/${talent?.id}`)}
 >
 <Eye className="h-3.5 w-3.5" /> Preview my profile
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
 <h2 className="text-sm font-semibold">Not yet visible to employers</h2>
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

 {/* Quick actions — personalized AI agent shortcuts */}
 <QuickActionsGrid />

                {/* B6: Employer pitches surface hidden — route /app/pitches still resolves via deep link. */}


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
 <p className={`text-[11px] ${GRO10X_MUTED}`}>
 {credsLoading
 ? "Loading…"
 : `${credentials.length} ${credentials.length === 1 ? "skill" : "skills"} verified`}
 </p>
 </div>
 <ChevronRight className="h-4 w-4 text-slate-500" />
 </button>
 </div>
 </div>
 );
}
