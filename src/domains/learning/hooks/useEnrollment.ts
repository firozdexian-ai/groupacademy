import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { enrollInContent } from "@/domains/learning/repo/learningRepo";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

/**
 * GroUp Academy: Trajectory Enrollment & LMS Ingress Engine (V5.6.0)
 * CTO Reference: Single source of truth for programmatic course and track registry.
 * Architecture: Digital Workforce enabled - logs conversion exceptions directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

export interface EnrollmentNode {
  id: string;
  status: "active" | "completed" | "dropped" | string;
  enrolled_at: string;
  progress: number;
}

export interface EnrollmentHandshakePayload {
  success: boolean;
  error?: string | null;
  already_enrolled?: boolean;
  whatsapp_link?: string;
  required_credits?: number;
}

const REF_KEYS = ["pending_ref", "ga_referral", "course_ref"];

function readRef(): string | null {
  if (typeof window === "undefined") return null;
  for (const k of REF_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function useEnrollment(contentId: string | undefined) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // --------------------------------------------------------
  // PHASE: Declarative Course Enrollment State Check
  // --------------------------------------------------------
  const enrollmentQuery = useQuery({
    queryKey: ["enrollment", talent?.id, contentId],
    enabled: !!talent?.id && !!contentId,
    staleTime: 2 * 60 * 1000, // 2-minute baseline consistency window
    queryFn: async (): Promise<EnrollmentNode | null> => {
      // HUD: EXECUTING_CANONICAL_ENROLLMENT_LOOKUP
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, status, enrolled_at, progress")
        .eq("content_id", contentId!)
        .or(`talent_id.eq.${talent!.id},student_id.eq.${talent!.id}`)
        .maybeSingle();

      if (error) {
        console.error("[Digital Workforce] FAULT: enrollments table selection evaluation error.", {
          talentId: talent?.id,
          contentId,
          error: error.message,
        });
        throw error;
      }
      return data as unknown as EnrollmentNode | null;
    },
  });

  const invalidateMatrix = () => {
    queryClient.invalidateQueries({ queryKey: ["enrollment", talent?.id, contentId] });
    queryClient.invalidateQueries({ queryKey: ["app-academy-courses"] });
    queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
    queryClient.invalidateQueries({ queryKey: ["instructor-dashboard"] });
  };

  // --------------------------------------------------------
  // PHASE: Trajectory Ingress Mutation Engine
  // --------------------------------------------------------
  const enrollmentMutation = useMutation({
    mutationFn: async (refOverride?: string | null): Promise<EnrollmentHandshakePayload> => {
      if (!contentId) throw new Error("MISSING_ARG_CONSTRAINT: Target content ID node undefined.");
      if (!talent?.id) throw new Error("IDENTITY_SYNC_FAULT: Valid account context required.");

      const activeRef = refOverride ?? readRef();

      // HUD: EXECUTING_RPC_ATOMIC_ENROLLMENT_INGRESS
      const { data, error } = await supabase.rpc("enroll_in_content" as any, {
        p_content_id: contentId,
        p_ref_code: activeRef || null,
      });

      if (error) throw error;
      return data as EnrollmentHandshakePayload;
    },
    onSuccess: (data) => {
      if (!data?.success) {
        const humanizedMessage = humanizeError(data?.error || "unknown_failure", data);
        toast.error(humanizedMessage);
        return;
      }

      if (!data.already_enrolled) {
        toast.success("You're enrolled! Trajectory activated. 🎓");
      }

      // Automated Efficiency: clear referral parameters once transaction commits
      REF_KEYS.forEach((k) => {
        if (typeof window !== "undefined") localStorage.removeItem(k);
      });

      invalidateMatrix();
    },
    onError: (err: any) => {
      // Digital Workforce Sensor: Intercept unhandled anomalies to enable rapid telemetry updates
      console.error("[Digital Workforce] ANOMALY: enroll_in_content transaction pipeline dropout.", {
        talentId: talent?.id,
        contentId,
        message: err.message,
      });
      toast.error(err.message || "Enrollment processing timeout. Connection enqueued for system audit.");
    },
  });

  return {
    ...enrollmentQuery,
    enrollment: enrollmentQuery.data,
    invalidate: invalidateMatrix,
    enroll: async (refOverride?: string | null) => {
      return enrollmentMutation.mutateAsync(refOverride).then((res) => ({
        success: !!res?.success,
        error: res?.error || undefined,
        whatsapp: res?.whatsapp_link,
      }));
    },
    isEnrolling: enrollmentMutation.isPending,
  };
}

/**
 * Maps system core database transition blocks to high-fidelity 2024 SaaS instructions responses.
 * Immutable platform feature component.
 */
function humanizeError(code: string, data?: any): string {
  switch (code) {
    case "auth_required":
      return "Please sign in to your authenticated account to enroll.";
    case "profile_missing":
      return "Your onboarding timeline is incomplete. Complete your profile coordinates first.";
    case "course_not_found":
    case "course_inactive":
      return "This structural track trajectory is no longer available.";
    case "event_unscheduled":
    case "event_expired":
      return "This live structural segment session has reached its expiry threshold.";
    case "sold_out":
      return "All available programmatic tier seats are currently filled.";
    case "insufficient_credits":
      return `Fiscal deficit detected. This transaction requires ${data?.required ?? "additional"} credits — update your wallet to enroll.`;
    default:
      return `Enrollment transaction interface rejected (${code})`;
  }
}
