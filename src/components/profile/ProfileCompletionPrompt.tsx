import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Linkedin,
  ArrowRight,
  X,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Profile Readiness Catalyst
 * CTO Reference: Authoritative node for driving profile data density.
 */

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

export function ProfileCompletionPrompt({
  variant = "card",
  showDismiss = true,
  className = "",
}: ProfileCompletionPromptProps) {
  const { talent, isLoading } = useTalent();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || !talent || isDismissed) return null;

  // DATA RECONSTRUCTION: Map registry gaps
  const missingFields: MissingField[] = [];

  if (!talent.cvUrl) {
    missingFields.push({
      key: "cv",
      label: "Artifact_Sync (CV)",
      icon: FileText,
      action: "DEPLOY_CV_FOR_AI_MATCHING",
      priority: 1,
    });
  }

  if (!talent.linkedinUrl) {
    missingFields.push({
      key: "linkedin",
      label: "Network_Handshake",
      icon: Linkedin,
      action: "AUTHORIZE_LINKEDIN_SYNC",
      priority: 2,
    });
  }

  if (talent.experience?.length === 0) {
    missingFields.push({
      key: "experience",
      label: "Professional_Ledger",
      icon: Briefcase,
      action: "SYNC_CAREER_TRAJECTORY",
      priority: 3,
    });
  }

  if (talent.education?.length === 0) {
    missingFields.push({
      key: "education",
      label: "Academic_Registry",
      icon: GraduationCap,
      action: "LOG_INSTITUTIONAL_CREDENTIALS",
      priority: 4,
    });
  }

  if (talent.skills?.length === 0) {
    missingFields.push({
      key: "skills",
      label: "Skill_Matrix",
      icon: Target,
      action: "INITIALIZE_MATCH_VECTORS",
      priority: 5,
    });
  }

  // TELEMETRY: Calculate completeness yield
  const totalNodes = 8;
  const completedNodes = [
    !!talent.fullName,
    !!talent.email,
    !!talent.phone,
    !!talent.cvUrl,
    (talent.experience?.length || 0) > 0,
    (talent.education?.length || 0) > 0,
    (talent.skills?.length || 0) > 0,
    !!talent.linkedinUrl,
  ].filter(Boolean).length;

  const yield_percentage = Math.round((completedNodes / totalNodes) * 100);

  // LOGIC: High-fidelity profiles bypass this prompt
  if (yield_percentage >= 75 || missingFields.length === 0) return null;

  const topMissing = missingFields.slice(0, 2);
  const handleActionProtocol = () => navigate("/app/profile/edit");

  // VARIANT: BANNER PROTOCOL (High-Yield Feed Ingress)
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "bg-primary/5 border-2 border-primary/20 rounded-[24px] p-5 animate-in slide-in-from-top-4 duration-500 shadow-xl backdrop-blur-md",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-primary/10"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${yield_percentage * 1.256} 125.6`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic">
                {yield_percentage}%
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase italic tracking-widest text-primary leading-none mb-1">
                Incomplete_Registry
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-80">
                {topMissing[0]?.action || "Optimize professional visibility"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleActionProtocol}
              className="h-10 px-6 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-lg active:scale-95"
            >
              Sync_Now <Zap className="h-3 w-3 fill-current" />
            </Button>
            {showDismiss && (
              <Button
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="h-10 w-10 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: INLINE TELEMETRY
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 bg-muted/20 backdrop-blur-sm rounded-2xl border border-border/40 shadow-inner",
          className,
        )}
      >
        <div className="flex-shrink-0 w-20">
          <Progress value={yield_percentage} className="h-2 rounded-full bg-primary/10" />
        </div>
        <p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground flex-1">
          <span className="text-primary">{yield_percentage}%</span> Profile_Synchronized
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleActionProtocol}
          className="h-8 font-black uppercase text-[9px] tracking-widest hover:text-primary"
        >
          Complete <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  // DEFAULT: EXECUTIVE AUDIT CARD
  return (
    <Card
      className={cn(
        "rounded-[32px] border-2 border-primary/10 bg-card/30 backdrop-blur-md shadow-2xl overflow-hidden group",
        className,
      )}
    >
      <div className="h-2 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardContent className="p-8 text-left">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h3 className="font-black text-2xl uppercase italic tracking-tighter flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-primary" /> Registry_Status
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic opacity-70">
              Maximize employer synchronization and neural matching yields
            </p>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-black uppercase italic tracking-widest">
            <span className="text-muted-foreground opacity-60">Fidelity_Yield</span>
            <span className="text-primary">{yield_percentage}%</span>
          </div>
          <Progress value={yield_percentage} className="h-3 rounded-full bg-primary/10 shadow-inner" />
        </div>

        <div className="space-y-3 mb-8">
          {topMissing.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.key}
                className="flex items-center gap-4 p-4 rounded-[20px] bg-muted/20 border-2 border-transparent hover:border-primary/10 transition-all cursor-pointer group/node"
                onClick={handleActionProtocol}
              >
                <div className="h-12 w-12 rounded-[18px] bg-background border-2 border-border/40 flex items-center justify-center text-muted-foreground group-hover/node:text-primary group-hover/node:border-primary/40 transition-all shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase italic tracking-tight text-foreground">{field.label}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest opacity-60 group-hover/node:opacity-100 transition-opacity">
                    {field.action}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary/30 group-hover/node:text-primary transition-all group-hover/node:translate-x-1" />
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleActionProtocol}
          className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-xs gap-3 shadow-2xl active:scale-95 transition-all"
        >
          <Zap className="h-5 w-5 fill-current" />
          Synchronize_Professional_Identity
        </Button>
      </CardContent>
    </Card>
  );
}
