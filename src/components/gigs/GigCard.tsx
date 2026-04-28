import { useState } from "react";
import { Coins, ChevronRight, CheckCircle2, Clock, ShieldAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GigSubmissionForm } from "./GigSubmissionForm";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Tactical Micro-Gig Artifact
 * CTO Reference: Authoritative node for discrete task engagement and reward synchronization.
 */

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements?: string;
  credit_reward: number;
  icon: string;
  max_completions_per_user?: number | null;
}

interface GigCardProps {
  gig: Gig;
  userSubmissions?: { total: number; pending: number };
}

export function GigCard({ gig, userSubmissions }: GigCardProps) {
  const [showForm, setShowForm] = useState(false);

  // REGISTRY: Institutional Icon Mapping
  const Icon = getIcon(gig.icon);

  // TELEMETRY: Ingestion and Threshold Logic
  const totalSubmitted = userSubmissions?.total || 0;
  const pendingCount = userSubmissions?.pending || 0;
  const maxAllowed = gig.max_completions_per_user || Infinity;
  const isMaxed = totalSubmitted >= maxAllowed;
  const hasPending = pendingCount > 0;

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden transition-all duration-500 rounded-[32px] border-2 p-6 text-left",
          isMaxed
            ? "bg-muted/30 border-border/20 grayscale"
            : "bg-card/30 backdrop-blur-xl border-border/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/40",
        )}
      >
        {/* ATMOSPHERIC_NODE: High-Value Signal */}
        {gig.credit_reward >= 50 && !isMaxed && (
          <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-1000 pointer-events-none">
            <Zap className="h-32 w-32 text-primary rotate-12 fill-current" />
          </div>
        )}

        <div className="flex items-start gap-5">
          {/* ICON_NODE: Industrial Ingress */}
          <div
            className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 shadow-lg",
              isMaxed
                ? "bg-muted text-muted-foreground/40"
                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:rotate-6",
            )}
          >
            <Icon className="h-7 w-7 stroke-[2.5px]" />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {/* HUD: GIG_IDENTITY */}
            <div className="space-y-1">
              <h3 className="font-black text-base uppercase italic tracking-tighter leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {gig.title.replace(" ", "_")}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/10 text-amber-600 border-2 border-amber-500/20 text-[9px] font-black uppercase italic tracking-widest px-3 h-6">
                  <Coins className="h-3 w-3 mr-1.5 fill-current" />+{gig.credit_reward} CR_REWARD
                </Badge>
                {isMaxed && (
                  <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest italic">
                    Protocol_Complete
                  </span>
                )}
              </div>
            </div>

            {/* CONTENT_NODE */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed line-clamp-2 italic">
                {gig.description}
              </p>
              {gig.requirements && (
                <div className="flex items-center gap-2 text-[9px] font-black text-primary/40 uppercase tracking-widest italic">
                  <ShieldAlert className="h-3 w-3" /> Cond: {gig.requirements}
                </div>
              )}
            </div>

            {/* FOOTER: PROGRESS_TELEMETRY */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-border/10">
              <div className="flex flex-col">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  {totalSubmitted > 0 ? `SYNCED_SUBMISSIONS: ${totalSubmitted}` : "AWAITING_INGRESS"}
                </p>
                {maxAllowed !== Infinity && (
                  <p className="text-[8px] font-bold text-primary/30 uppercase italic">
                    Node_Limit: {totalSubmitted}/{maxAllowed}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isMaxed ? (
                  <div className="flex items-center gap-2 text-emerald-500 opacity-60">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase italic tracking-widest">VERIFIED</span>
                  </div>
                ) : (
                  <>
                    {hasPending && (
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-primary text-[8px] font-black uppercase italic tracking-tighter h-8 px-3 animate-pulse"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1.5" /> {pendingCount} PENDING_AUDIT
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setShowForm(true)}
                      className="rounded-xl h-9 px-5 text-[10px] font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-90 gap-2"
                    >
                      INITIALIZE <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GIG_ORCHESTRATOR_MODAL */}
      <GigSubmissionForm gig={gig} open={showForm} onOpenChange={setShowForm} />
    </>
  );
}
