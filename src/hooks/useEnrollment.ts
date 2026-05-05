/**
 * Single source of truth for enrolling in any course type.
 * Wraps the `enroll_in_content` RPC and exposes enrollment lookup.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

const REF_KEYS = ["pending_ref", "ga_referral", "course_ref"];

function readRef(): string | null {
  for (const k of REF_KEYS) {
    const v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (v) return v;
  }
  return null;
}

export function useEnrollment(contentId: string | undefined) {
  const { talent } = useTalent();
  const qc = useQueryClient();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const query = useQuery({
    queryKey: ["enrollment", talent?.id, contentId],
    enabled: !!talent?.id && !!contentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, status, enrolled_at, progress")
        .eq("content_id", contentId!)
        .or(`talent_id.eq.${talent!.id},student_id.eq.${talent!.id}`)
        .maybeSingle();
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["enrollment", talent?.id, contentId] });
    qc.invalidateQueries({ queryKey: ["app-academy-courses"] });
    qc.invalidateQueries({ queryKey: ["talent-stats"] });
  };

  const enroll = useCallback(
    async (refOverride?: string | null): Promise<{ success: boolean; error?: string; whatsapp?: string }> => {
      if (!contentId) return { success: false, error: "no_content" };
      setIsEnrolling(true);
      try {
        const ref = refOverride ?? readRef();
        const { data, error } = await (supabase.rpc as any)("enroll_in_content", {
          p_content_id: contentId,
          p_ref_code: ref || null,
        });
        if (error) throw error;
        if (!data?.success) {
          const msg = humanizeError(data?.error, data);
          toast.error(msg);
          return { success: false, error: data?.error };
        }
        if (!data.already_enrolled) {
          toast.success("You're enrolled!");
        }
        // Clear referral once successfully used
        REF_KEYS.forEach((k) => localStorage.removeItem(k));
        invalidate();
        return { success: true, whatsapp: data.whatsapp_link };
      } catch (e: any) {
        toast.error(e?.message || "Enrollment failed");
        return { success: false, error: e?.message };
      } finally {
        setIsEnrolling(false);
      }
    },
    [contentId, talent?.id],
  );

  return { ...query, enrollment: query.data, invalidate, enroll, isEnrolling };
}

function humanizeError(code?: string, data?: any): string {
  switch (code) {
    case "auth_required":
      return "Please sign in to enroll.";
    case "profile_missing":
      return "Complete your profile first.";
    case "course_not_found":
    case "course_inactive":
      return "This course is no longer available.";
    case "event_unscheduled":
    case "event_expired":
      return "This session has ended.";
    case "sold_out":
      return "All seats are taken.";
    case "insufficient_credits":
      return `You need ${data?.required ?? "more"} credits — top up to enroll.`;
    default:
      return code ? `Enrollment failed (${code})` : "Enrollment failed";
  }
}
