import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { FileText, Briefcase, GraduationCap, Linkedin, ArrowRight, X, Zap, Target, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissingField {
  key: string;
  label: string;
  icon: React.ElementType;
  action: string;
  priority: number;
}

interface ProfileCompletionPromptProps {
  variant?: "card" | "banner" | "inline";
  showDismiss?: boolean;
  className?: string;
}

/**
 * GroUp Academy: Profile Integrity & Completion Prompt Catalyst (ProfileCompletionPrompt)
 * An authoritative operational sandbox monitoring profile variable density and prompting sync workflows.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfileCompletionPrompt({
  variant = "card",
  showDismiss = true,
  className = "",
}: ProfileCompletionPromptProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent, isLoading } = useTalent();

  const isMountedRef = useRef<boolean>(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Structural Data Reconstruction Pass: Compute data density gaps dynamically via memoized bounds
  const profileFidelityMetrics = useMemo(() => {
    if (isLoading || !talent || isDismissed) {
      return { missingFields: [], yieldPercentage: 100, shouldRender: false };
    }

    const gaps: MissingField[] = [];

    if (!talent.cvUrl) {
      gaps.push({
        key: "cv",
        label: "Artifact Sync (CV)",
        icon: FileText,
        action: "Deploy CV for AI Matching",
        priority: 1,
      });
    }

    if (!talent.linkedinUrl) {
      gaps.push({
        key: "linkedin",
        label: "Network Handshake",
        icon: Linkedin,
        action: "Authorize LinkedIn Sync",
        priority: 2,
      });
    }

    if (!Array.isArray(talent.experience) || talent.experience.length === 0) {
      gaps.push({
        key: "experience",
        label: "Professional Ledger",
        icon: Briefcase,
        action: "Add work experience",
        priority: 3,
      });
    }

    if (!Array.isArray(talent.education) || talent.education.length === 0) {
      gaps.push({
        key: "education",
        label: "Academic Registry",
        icon: GraduationCap,
        action: "Add education",
        priority: 4,
      });
    }

    if (!Array.isArray(talent.skills) || talent.skills.length === 0) {
      gaps.push({
        key: "skills",
        label: "Skill Matrix",
        icon: Target,
        action: "Add your skills",
        priority: 5,
      });
    }

    const TOTAL_COMPLIANCE_NODES_COUNT = 8;
    const completedNodesCount = [
      !!talent.fullName,
      !!talent.email,
      !!talent.phone,
      !!talent.cvUrl,
      Array.isArray(talent.experience) && talent.experience.length > 0,
      Array.isArray(talent.education) && talent.education.length > 0,
      Array.isArray(talent.skills) && talent.skills.length > 0,
      !!talent.linkedinUrl,
    ].filter(Boolean).length;

    const yieldPercentage = Math.round((completedNodesCount / TOTAL_COMPLIANCE_NODES_COUNT) * 100);

    // High-fidelity profiles or complete registries pass validation limits cleanly
    const shouldRender = yieldPercentage < 75 && gaps.length > 0;

    return {
      missingFields: gaps.sort((a, b) => a.priority - b.priority),
      yieldPercentage,
      shouldRender,
    };
  }, [talent, isLoading, isDismissed]);

  // Monitor layout metrics impressions safely down telemetry tracks
  useEffect(() => {
    if (profileFidelityMetrics.shouldRender) {
      trackEvent("profile_completion_prompt_rendered", {
        promptVariant: variant,
        currentYieldPercentage: profileFidelityMetrics.yieldPercentage,
      });
    }
  }, [profileFidelityMetrics.shouldRender, variant, profileFidelityMetrics.yieldPercentage]);

  const topMissingNodes = useMemo(() => {
    return profileFidelityMetrics.missingFields.slice(0, 2);
  }, [profileFidelityMetrics.missingFields]);

  const handleActionProtocolTrigger = async () => {
    trackEvent("profile_completion_prompt_action_clicked", { variant });

    try {
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      if (isMountedRef.current) {
        navigate("/app/profile/edit");
      }
    } catch (err) {
      trackError(err, { component: "ProfileCompletionPrompt", action: "execute_action_protocol" });
      navigate("/app/profile/edit"); // Safe fallback bypass pass
    }
  };

  const handleDismissProtocolTrigger = () => {
    trackEvent("profile_completion_prompt_dismissed", { variant });
    setIsDismissed(true);
  };

  if (!profileFidelityMetrics.shouldRender) return null;

  // =========================================================================
  // VIEW OPTION A: COMPACT FEED HORIZONTAL BANNER INGRESS
  // =========================================================================
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "w-full text-left rounded-xl border border-primary/20 bg-primary/[0.015] p-4 sm:p-5 shadow-sm backdrop-blur-md transform-gpu antialiased select-none animate-in slide-in-from-top-2 duration-300 flex items-center justify-between gap-4",
          className,
        )}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
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
                strokeDasharray={`${profileFidelityMetrics.yieldPercentage * 1.193} 119.3`}
                strokeLinecap="round"
                className="text-primary border-none shrink-0"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-tighter text-foreground/90 tabular-nums">
              {profileFidelityMetrics.yieldPercentage}%
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1 flex flex-col justify-center leading-none text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary block leading-none font-mono">
              Incomplete Alignment Registry
            </span>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground/90 truncate text-ellipsis block pr-1 leading-none select-text">
              {topMissingNodes[0]?.action || "Optimize professional career synchronization yields"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-bold text-xs">
          <Button
            size="sm"
            type="button"
            onClick={handleActionProtocolTrigger}
            className="h-8 px-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wide gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-transform active:scale-[0.98]"
          >
            <span>Sync Now</span>
            <Zap className="h-3 w-3 fill-primary-foreground/10 stroke-[2.2] animate-pulse" />
          </Button>
          {showDismiss && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={handleDismissProtocolTrigger}
              className="h-8 w-8 rounded-xl text-muted-foreground/40 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW OPTION B: INLINE LAYOUT TELEMETRY PROGRESS SLOT STRIP
  // =========================================================================
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "w-full text-left rounded-xl border border-border/40 bg-card/20 hover:bg-card/30 p-3.5 flex items-center justify-between gap-4 font-bold text-xs tracking-tight select-none shadow-sm shadow-inner transform-gpu",
          className,
        )}
      >
        <div className="w-16 shrink-0 select-none">
          <Progress
            value={profileFidelityMetrics.yieldPercentage}
            className="h-1.5 border-none bg-primary/10 rounded-full block"
          />
        </div>
        <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/60 flex-1 min-w-0 truncate leading-none">
          <span className="text-primary font-black">{profileFidelityMetrics.yieldPercentage}%</span> Profile Elements
          Synchronized
        </p>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={handleActionProtocolTrigger}
          className="h-7 px-2.5 rounded-lg text-muted-foreground/70 hover:text-primary font-bold uppercase text-[9px] tracking-wider shrink-0 cursor-pointer hover:bg-primary/5 transition-colors"
        >
          <span>Complete Nodes</span>
          <ArrowRight className="ml-1 h-3.5 w-3.5 stroke-[2.5]" />
        </Button>
      </div>
    );
  }

  // =========================================================================
  // VIEW OPTION C: DEFAULT CRITERIA EXECUTIVE CHECKLIST SYSTEM CARD
  // =========================================================================
  return (
    <Card
      className={cn(
        "w-full text-left rounded-xl border border-primary/20 bg-card/40 backdrop-blur-md shadow-sm transform-gpu antialiased overflow-hidden select-none group/card",
        className,
      )}
    >
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
      <CardContent className="p-5 sm:p-6 space-y-5 w-full min-w-0 flex flex-col justify-center">
        {/* VIEW SEGMENT CARD HEADING ROW */}
        <div className="flex items-start justify-between gap-4 select-none leading-none w-full shrink-0">
          <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 flex-1 text-left">
            <h3 className="text-sm sm:text-base font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
              <ShieldCheck className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span>Registry Synchronization Alignment</span>
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
              Maximize candidate visibility parameters and automated neural index matching yields
            </p>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={handleDismissProtocolTrigger}
              className="h-8 w-8 rounded-xl text-muted-foreground/40 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors shrink-0 p-0 border-none shadow-none"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          )}
        </div>

        {/* INTEGRATED GAUGE BAR TRACK STRIP */}
        <div className="space-y-2 p-3 rounded-xl border border-border/40 bg-muted/10 w-full select-none shadow-sm leading-none shrink-0 font-bold text-[10px] tracking-tight text-muted-foreground/70 tabular-nums">
          <div className="flex justify-between items-center w-full leading-none uppercase tracking-wider font-mono">
            <span>Identity Fidelity Yield Curve</span>
            <span className="text-primary font-black">{profileFidelityMetrics.yieldPercentage}% complete</span>
          </div>
          <Progress
            value={profileFidelityMetrics.yieldPercentage}
            className="h-2 rounded-full border-none bg-primary/10 shadow-inner w-full block"
          />
        </div>

        {/* DYNAMIC LISTING OF HIGHEST PRIORITY REMAINING SUB-NODES */}
        <div className="space-y-2 w-full min-w-0 text-left font-bold text-xs tracking-tight">
          {topMissingNodes.map((fieldItem) => {
            const FieldIconComponent = fieldItem.icon || Target;
            return (
              <div
                key={fieldItem.key}
                role="button"
                onClick={handleActionProtocolTrigger}
                className="group/node flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-primary/[0.01] hover:border-primary/10 transition-all cursor-pointer transform-gpu w-full min-w-0 select-none leading-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 h-full">
                  <div className="h-9 w-9 bg-muted/40 border border-border/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover/node:text-primary group-hover/node:border-primary/40 text-muted-foreground/60 transition-colors">
                    <FieldIconComponent className="h-4 w-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col justify-center leading-none min-w-0 flex-1 text-left space-y-1.5">
                    <span className="text-xs font-bold text-foreground/90 uppercase tracking-wide truncate text-ellipsis block pr-1 leading-none select-text">
                      {fieldItem.label}
                    </span>
                    <span className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-wider block leading-none pt-0.5 opacity-60 group-hover/node:opacity-100 transition-opacity">
                      {fieldItem.action}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary/30 group-hover/node:text-primary transition-all group-hover/node:translate-x-0.5 shrink-0 stroke-[2.5]" />
              </div>
            );
          })}
        </div>

        {/* OVERALL COMPLETE TRANSACTION DESPATCH COMMAND BUTTON FOOTER */}
        <Button
          type="button"
          onClick={handleActionProtocolTrigger}
          className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 mt-1 select-none"
        >
          <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Synchronize Digital Professional Identity Vector</span>
        </Button>
      </CardContent>
    </Card>
  );
}
