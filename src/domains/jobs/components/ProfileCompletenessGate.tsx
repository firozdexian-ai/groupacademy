import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sparkles, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  talent: any;
}

interface Step {
  key: string;
  label: string;
  done: boolean;
}

/**
 * GroUp Academy: Profile Completeness Gate Control Node
 * CTO Reference: Authoritative presentation intercept container blocking feeds until parsing metrics settle.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfileCompletenessGate({ talent }: Props) {
  const navigate = useNavigate();

  // Clean arrays defensively against runtime parameter variations
  const skills = Array.isArray(talent?.skills) ? talent.skills : [];
  const experience = Array.isArray(talent?.experience) ? talent.experience : [];
  const education = Array.isArray(talent?.education) ? talent.education : [];
  const projects = Array.isArray(talent?.projects) ? talent.projects : [];

  // 1. Data Contract Alignment: Using cvUrl to match camelCase schema patterns cleanly
  const steps: Step[] = [
    {
      key: "profession",
      label: "Set your profession",
      done: !!talent?.profession_category_id || !!talent?.custom_profession || !!talent?.professionCategoryId,
    },
    {
      key: "skills",
      label: "Add at least 3 skills",
      done: skills.length >= 3,
    },
    {
      key: "experience",
      label: "Add work experience or projects",
      done: experience.length > 0 || projects.length > 0,
    },
    {
      key: "education",
      label: "Add education",
      done: education.length > 0,
    },
    {
      key: "cv",
      label: "Upload your CV",
      done: !!talent?.cvUrl || !!talent?.cv_url,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  // Monitor layout element visibility parameters via telemetry hooks
  useEffect(() => {
    if (talent?.id && completionPercentage < 60) {
      trackEvent("profile_completeness_gate_rendered", {
        talentId: talent.id,
        currentPercentage: completionPercentage,
        completedSteps: completedCount,
      });
    }
  }, [talent?.id, completionPercentage, completedCount]);

  // Phase Z0 Optimization: If metrics pass requirements threshold, skip presentation tree natively
  if (completionPercentage >= 60) {
    return null;
  }

  const missingStepsCollection = steps.filter((s) => !s.done).slice(0, 3);
  const completedStepsCollection = steps.filter((s) => s.done).slice(0, 1);

  const handleNavigationInterceptClick = () => {
    trackEvent("profile_completeness_gate_cta_clicked", { talentId: talent?.id });
    try {
      navigate("/app/profile");
    } catch (err) {
      trackError(err, {
        component: "ProfileCompletenessGate",
        action: "execute_navigate_profile_callback",
      });
    }
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-primary/20 bg-primary/5 select-none sm:select-text antialiased transform-gpu shadow-sm relative overflow-hidden animate-in fade-in duration-300">
      {/* Decorative Glow Mesh Layer */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      <CardContent className="p-4 space-y-3.5 w-full min-w-0">
        {/* HUD LEVEL 1: PROFILE PARITY SYNC STATUS STRIP */}
        <div className="flex items-start gap-3 w-full min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="h-4.5 w-4.5 stroke-[2.2] animate-pulse fill-primary/10" />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 leading-tight">
              Complete your profile for better matches
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 leading-normal select-text selection:bg-primary/15 tracking-tight">
              Your profile is{" "}
              <span className="font-bold text-primary tabular-nums">{completionPercentage}% complete</span>. Filling
              the rest helps us recommend stronger job matches.
            </p>
          </div>
        </div>

        {/* HUD LEVEL 2: COMPACT TRACKING INDICATOR METER */}
        <div className="space-y-1 select-none">
          <Progress value={completionPercentage} className="h-1.5 rounded-full bg-primary/10 shadow-inner" />
        </div>

        {/* HUD LEVEL 3: DYNAMIC STEP MATRIX LIST VIEW */}
        <div className="space-y-1.5 pt-1.5 border-t border-border/10 w-full min-w-0 font-semibold text-[11px] sm:text-xs">
          {/* Missing Constraints Targets */}
          {missingStepsCollection.map((stepItem) => (
            <div key={stepItem.key} className="flex items-center gap-2 text-muted-foreground/80 w-full min-w-0">
              <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 stroke-[2.2]" />
              <span className="truncate pr-1 font-medium">{stepItem.label}</span>
            </div>
          ))}

          {/* Completed Settlement Items Array */}
          {completedStepsCollection.map((stepItem) => (
            <div
              key={stepItem.key}
              className="flex items-center gap-2 text-muted-foreground/60 w-full min-w-0 animate-in fade-in duration-200 select-none"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
              <span className="truncate pr-1 line-through font-medium text-muted-foreground/40">{stepItem.label}</span>
            </div>
          ))}
        </div>

        {/* HUD LEVEL 4: PLATFORM INTERCEPT CTA DISPATCH NODE */}
        <Button
          type="button"
          onClick={handleNavigationInterceptClick}
          className="w-full h-9 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-transform select-none cursor-pointer gap-1.5 mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>Complete Profile Settings</span>
          <ArrowRight className="h-3.5 w-3.5 text-white stroke-[2.5]" />
        </Button>
      </CardContent>
    </Card>
  );
}
