import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTalentUserIdById } from "@/domains/talent/repo/talentRepo";
import { getInstructorRecentEarningsCount } from "@/domains/learning/repo/learningRepo";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { GraduationCap, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveInstructorChipProps {
  talentId?: string | null;
  className?: string;
}

/**
 * GroUp Academy: Instructor Activity Verification Badge Surfer (ActiveInstructorChip)
 * An authoritative operational utility auditing recent ledger activity indexes to verify premium mentor roles.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ActiveInstructorChip({ talentId, className = "" }: ActiveInstructorChipProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);
  const [isActiveInstructor, setIsActiveInstructor] = useState<boolean>(false);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!talentId) {
      setIsActiveInstructor(false);
      return;
    }

    let isRequestActive = true;
    trackEvent("instructor_verification_audit_initiated", { talentId });

    const executeInstructorLedgerAudit = async () => {
      try {
        // Step 1: Resolve talentId master profile mapping down to user_id indices
        const targetUserUuidStr = await getTalentUserIdById(talentId);

        // Defensive Check: Close execution threads safely if relational ids break down paths
        if (!targetUserUuidStr) {
          trackEvent("instructor_verification_abandoned_missing_uid", { talentId });
          if (isRequestActive && isMountedRef.current) {
            setIsActiveInstructor(false);
          }
          return;
        }

        // Step 2: Establish chronologically bound limits (Core standard threshold: 30 days)
        const THIRTY_DAYS_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
        const baselineChronologyTimestampStr = new Date(Date.now() - THIRTY_DAYS_IN_MILLISECONDS).toISOString();

        // Step 3: Run exact head count operations over secure accounting ledger tables
        const activeEarningsLedgerCount = await getInstructorRecentEarningsCount(targetUserUuidStr, baselineChronologyTimestampStr);

        const dynamicHasRecentActivityBool = activeEarningsLedgerCount > 0;

        // Automated Efficiency: Synchronize state markers inside central cache registers safely
        await queryClient.invalidateQueries({ queryKey: ["instructor-activity", talentId] });

        if (isRequestActive && isMountedRef.current) {
          setIsActiveInstructor(dynamicHasRecentActivityBool);
          trackEvent("instructor_verification_audit_complete", { talentId, active: dynamicHasRecentActivityBool });
        }
      } catch (caughtPipelineExceptionErr) {
        trackError(caughtPipelineExceptionErr, {
          component: "ActiveInstructorChip",
          action: "execute_instructor_ledger_audit",
          talentId,
        });

        if (isRequestActive && isMountedRef.current) {
          setIsActiveInstructor(false);
        }
      }
    };

    executeInstructorLedgerAudit();

    return () => {
      isRequestActive = false;
    };
  }, [talentId, queryClient]);

  if (!isActiveInstructor) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5.5 rounded text-[10px] font-extrabold tracking-wide uppercase border border-transparent bg-primary/10 text-primary select-none leading-none shadow-xs shrink-0 animate-in fade-in duration-200",
        className,
      )}
    >
      <GraduationCap className="h-3 w-3 stroke-[2.5] shrink-0" />
      <span className="pt-0.5 block">Active Instructor</span>
    </Badge>
  );
}
