import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Building2, MessageCircle, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentPitches } from "@/domains/profile/hooks/useTalentPitches";
import { formatDistanceToNow, format } from "date-fns";
import {
 GRO10X_BG,
 GRO10X_PANEL,
 GRO10X_TEXT,
 GRO10X_MUTED,
} from "@/gro10x/lib/tokens";

/**
 * /app/pitches — full inbox of AI-dispatched employer pitches.
 * Standardized to the Gro10x golden UI standard.
 */
export default function TalentPitches() {
 const navigate = useNavigate();
 const { pitches, isLoading } = useTalentPitches(50);

 return (
 <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24`}>
 <header className="sticky top-0 z-10 bg-[#0B1220]/95 border-b border-white/5 px-4 py-2.5">
 <div className="max-w-2xl mx-auto flex items-center gap-2">
 <button
 onClick={() => navigate(-1)}
 className="h-8 w-8 grid place-items-center rounded-lg text-slate-300 hover:bg-white/5"
 >
 <ArrowLeft className="h-4 w-4" />
 </button>
 <div className="flex-1 min-w-0">
 <h1 className="text-base font-semibold leading-tight flex items-center gap-1.5">
 <Sparkles className="h-4 w-4 text-[#33E1E4]" /> Employer pitches
 </h1>
 <p className={`text-[11px] ${GRO10X_MUTED}`}>Companies that unlocked your profile</p>
 </div>
 </div>
 </header>

 <div className="max-w-2xl mx-auto px-4 pt-3 space-y-2">
 {isLoading ? (
 [...Array(4)].map((_, i) => (
 <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/5" />
 ))
 ) : pitches.length === 0 ? (
 <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-8 text-center`}>
 <div className="h-12 w-12 rounded-full bg-white/5 mx-auto grid place-items-center mb-3">
 <Sparkles className="h-5 w-5 text-slate-400" />
 </div>
 <h2 className="text-sm font-semibold mb-1">No pitches yet</h2>
 <p className={`text-xs ${GRO10X_MUTED}`}>
 When an employer pays to unlock your profile and our AI sends them a pitch on your behalf,
 it will appear here.
 </p>
 </div>
 ) : (
 pitches.map((p) => {
 const waLink = p.phone ? `https://wa.me/${p.phone.replace(/\D/g, "")}` : null;
 return (
 <div key={p.id} className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
 <div className="flex items-center gap-2.5 mb-2.5">
 {p.company_logo ? (
 <img src={p.company_logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
 ) : (
 <div className="h-9 w-9 rounded-lg bg-white/5 grid place-items-center">
 <Building2 className="h-4 w-4 text-slate-400" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold truncate">{p.company_name || "An employer"}</p>
 <p
 className={`text-[11px] ${GRO10X_MUTED}`}
 title={format(new Date(p.created_at), "PPpp")}
 >
 {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
 </p>
 </div>
 {p.dispatched ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10D576] bg-[#10D576]/15 px-1.5 py-0.5 rounded-full">
 <CheckCircle2 className="h-3 w-3" /> Sent
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
 <Clock className="h-3 w-3" /> Queued
 </span>
 )}
 </div>

 <div className="rounded-xl bg-black/20 border border-white/5 p-3 mb-3">
 <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-200">{p.message}</p>
 </div>

 <div className="flex flex-wrap gap-2">
 {waLink && (
 <a
 href={waLink}
 target="_blank"
 rel="noopener noreferrer"
 className="h-8 px-3 text-xs rounded-lg bg-[#10D576] hover:bg-[#0fb866] text-slate-950 font-semibold inline-flex items-center gap-1.5"
 >
 <MessageCircle className="h-3.5 w-3.5" /> Reply on WhatsApp
 </a>
 )}
 <button
 onClick={() => navigate(`/c/${p.company_id}`)}
 className="h-8 px-3 text-xs rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 inline-flex items-center gap-1.5"
 >
 <ExternalLink className="h-3.5 w-3.5" /> View company
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 );
}
