import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import type { TalentProfile } from "@/contexts/TalentContext";

interface ProfileCompletionMeterProps {
  talent: TalentProfile;
  variant?: "full" | "compact" | "mini";
  showActions?: boolean;
}

interface CompletionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  isComplete: boolean;
  action: string;
  priority: number;
}

/**
 * GroUp Academy: Talent Readiness Telemetry Monitor (ProfileCompletionMeter)
 * An authoritative operational sandbox layer tracking complete profile verification and artifact ingestion tracks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfileCompletionMeter({ talent, variant = "full", showActions = true }: ProfileCompletionMeterProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Monitor profile compliance completion matrix parameters via unified telemetry indicators
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("profile_completion_meter_mounted", { componentVariant: variant });
    return () => {
      isMountedRef.current = false;
    };
  }, [variant]);

  const completionItems = useMemo((): CompletionItem[] => {
    if (!talent) return [];
    return [
      {
        key: "photo",
        label: "Identity Node",
        icon: User,
        isComplete: !!talent.profilePhotoUrl,
        action: "Provision profile photo",
        priority: 1,
      },
      {
        key: "cv",
        label: "Upload CV",
        icon: FileText,
        isComplete: !!talent.cvUrl,
        action: "Upload CV",
        priority: 2,
      },
      {
        key: "experience",
        label: "Work experience",
        icon: Briefcase,
        isComplete: !!(Array.isArray(talent.experience) && talent.experience.length > 0),
        action: "Add work experience",
        priority: 3,
      },
      {
        key: "education",
        label: "Education",
        icon: GraduationCap,
        isComplete: !!(Array.isArray(talent.education) && talent.education.length > 0),
        action: "Add education",
        priority: 4,
      },
      {
        key: "skills",
        label: "Skills",
        icon: Sparkles,
        isComplete: !!(Array.isArray(talent.skills) && talent.skills.length >= 3),
        action: "Add at least 3 skills",
        priority: 5,
      },
    ];
  }, [talent]);

  const profileComplianceMetrics = useMemo(() => {
    const completedCount = completionItems.filter((item) => item.isComplete).length;
    const totalCount = completionItems.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { completedCount, totalCount, percentage };
  }, [completionItems]);

  const nextAction = useMemo(() => {
    return completionItems.filter((item) => !item.isComplete).sort((a, b) => a.priority - b.priority)[0] || null;
  }, [completionItems]);

  const handleEditHandshake = async () => {
    trackEvent("profile_completion_action_triggered", { currentPercentage: profileComplianceMetrics.percentage });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        navigate("/app/profile/edit");
      }
    } catch (err) {
      trackError(err, { component: "ProfileCompletionMeter", action: "execute_edit_handshake" });
      navigate("/app/profile/edit"); // Safe fallback redirection pass
    }
  };

  const adaptiveStrokeColorClass = useMemo(() => {
    const currentPct = profileComplianceMetrics.percentage;
    if (currentPct >= 80) return "text-emerald-500";
    if (currentPct >= 50) return "text-amber-500";
    return "text-primary";
  }, [profileComplianceMetrics.percentage]);

  // =========================================================================
  // CORE VARIANT A: HARDWARE-ACCELERATED SVG MINI RING HOVER CHIP
  // =========================================================================
  if (variant === "mini") {
    return (
      <div
        role="button"
        onClick={handleEditHandshake}
        className="relative w-14 h-14 group cursor-pointer transform-gpu antialiased select-none block shrink-0"
        title={`Profile integration scale maps ${profileComplianceMetrics.percentage}% complete parameters. Trigger to edit configuration layers.`}
      >
        <svg className="w-14 h-14 transform -rotate-90 block">
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            className="text-muted/15 border-none"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            strokeDasharray={`${profileComplianceMetrics.percentage * 1.508} 150.8`}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-in-out border-none shrink-0", adaptiveStrokeColorClass)}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
          <span className="text-[10px] font-black tracking-tighter text-foreground/95 tabular-nums leading-none block">
            {profileComplianceMetrics.percentage}%
          </span>
          <span className="text-[6px] font-extrabold opacity-40 uppercase tracking-widest leading-none pt-0.5 block">
            Ready
          </span>
        </span>
      </div>
    );
  }

  // =========================================================================
  // CORE VARIANT B: COMPACT REGISTRY INGRESS FEED DISPATCH BANNER
  // =========================================================================
  if (variant === "compact") {
    if (profileComplianceMetrics.percentage >= 100) return null;

    return (
      <Card
        onClick={handleEditHandshake}
        className="w-full text-left rounded-xl border border-primary/20 bg-primary/[0.015] hover:bg-primary/[0.03] shadow-xs cursor-pointer select-none transition-colors overflow-hidden group/compact transform-gpu antialiased"
      >
        <CardContent className="py-3.5 px-4 font-bold text-xs">
          <div className="flex items-center justify-between gap-4 w-full leading-none">
            <div className="relative h-11 w-11 flex-shrink-0 select-none">
              <svg className="w-11 h-11 transform -rotate-90 block">
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  className="text-muted/15 border-none"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${profileComplianceMetrics.percentage * 1.193} 119.3`}
                  strokeLinecap="round"
                  className="text-primary border-none shrink-0"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic text-foreground/90 tabular-nums">
                {profileComplianceMetrics.percentage}%
              </span>
            </div>

            <div className="flex-1 min-w-0 text-left space-y-1 flex flex-col justify-center leading-none">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary block leading-none font-mono">
                Incomplete Alignment Trajectory
              </span>
              <p className="text-xs sm:text-sm font-bold text-foreground/90 truncate text-ellipsis block pr-1 leading-none select-text">
                {nextAction ? nextAction.action : "Hydrate profile credential nodes"}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-primary opacity-35 group-hover/compact:opacity-80 group-hover/compact:translate-x-0.5 transition-all shrink-0 stroke-[2.5]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // =========================================================================
  // CORE VARIANT C: FULL AUDIT CHECKLIST METRICS SYSTEM PANEL LAYER
  // =========================================================================
  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden select-none">
      <CardContent className="p-5 sm:p-6 space-y-5 w-full min-w-0 flex flex-col justify-center">
        {/* VIEW SEGMENT TOP COVER ROW BLOCK */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-5 border-b border-border/10 w-full shrink-0">
          <div className="relative h-20 w-20 flex-shrink-0 select-none">
            <svg className="w-20 h-20 transform -rotate-90 block">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                className="text-muted/15 border-none"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${profileComplianceMetrics.percentage * 2.199} 219.9`}
                strokeLinecap="round"
                className={cn("transition-all duration-1000 ease-out border-none shrink-0", adaptiveStrokeColorClass)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
              <span className="text-base font-black tracking-tighter text-foreground/95 tabular-nums leading-none block">
                {profileComplianceMetrics.percentage}%
              </span>
              <span className="text-[7px] font-extrabold opacity-40 uppercase tracking-wider leading-none pt-0.5 block">
                Status
              </span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0 flex flex-col justify-center leading-none">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 leading-none w-full">
              <h3 className="font-black text-lg sm:text-xl uppercase italic tracking-wide text-foreground/95 leading-none">
                {profileComplianceMetrics.percentage >= 100
                  ? "Profile Complete"
                  : "Profile Strength"}
              </h3>
              {profileComplianceMetrics.percentage >= 100 && (
                <Badge
                  variant="outline"
                  className="rounded px-1.5 h-4.5 text-[8px] font-extrabold tracking-wider uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono shadow-xs shrink-0"
                >
                  Verified Node
                </Badge>
              )}
            </div>

            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-normal leading-normal select-text pr-1 italic">
              {profileComplianceMetrics.percentage >= 100
                ? "Your professional identity vector indices are completely synchronized for market matching sequences."
                : `${profileComplianceMetrics.totalCount - profileComplianceMetrics.completedCount} critical pipeline sections remain vacant to optimize employer discovery tracks.`}
            </p>
            <Progress
              value={profileComplianceMetrics.percentage}
              className="h-1.5 border-none bg-primary/10 shadow-inner w-full block rounded-full mt-1.5"
            />
          </div>
        </div>

        {/* DATA BLOCK DECK: COMPOSITE INDIVIDUAL CHECKLIST MATRIX ELEMENTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full font-bold text-xs tracking-tight text-left">
          {completionItems.map((checkItem) => (
            <div
              key={checkItem.key}
              className={cn(
                "flex items-center justify-between gap-3.5 p-3.5 rounded-xl border transition-all duration-300 font-semibold text-xs leading-none select-none",
                checkItem.isComplete
                  ? "bg-emerald-500/[0.01] border-emerald-500/10 opacity-60 text-foreground"
                  : "bg-muted/20 border-border/40 text-foreground",
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-transparent shadow-xs transition-colors",
                  checkItem.isComplete
                    ? "bg-emerald-500/10 border-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted/50 border-border/20 text-muted-foreground/60",
                )}
              >
                <checkItem.icon className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>

              <div className="flex-1 min-w-0 text-left space-y-1 flex flex-col justify-center leading-none">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide truncate text-ellipsis block leading-none select-text",
                    checkItem.isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/90",
                  )}
                >
                  {checkItem.label}
                </span>
                <span className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-wider block leading-none pt-0.5">
                  {checkItem.isComplete ? "Complete" : "To do"}
                </span>
              </div>

              {checkItem.isComplete ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 stroke-[2.5]" />
              ) : (
                <Circle className="h-4.5 w-4.5 text-muted-foreground/20 shrink-0 stroke-[2.2] animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* BOTTOM TRIGGER BUTTON CALL-TO-ACTION DESPATCH STRIP */}
        {showActions && profileComplianceMetrics.percentage < 100 && (
          <Button
            type="button"
            onClick={handleEditHandshake}
            className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 mt-1 select-none"
          >
            <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] shrink-0 animate-pulse" />
            <span>
              {nextAction
                ? `Complete ${nextAction.key.toUpperCase()}`
                : "Finish your profile"}
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
