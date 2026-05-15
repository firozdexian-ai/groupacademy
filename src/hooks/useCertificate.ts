import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Credential Issuance Orchestrator
 * CTO Reference: Authoritative controller for pedagogical artifact generation.
 * Logic: Implements idempotent issuance and verification key retrieval using TanStack Query v5.
 * Phase: Z0 Code Freeze Hardened.
 */

export interface IssueCertificateParams {
  enrollment_id: string;
  talent_id: string;
  content_id: string;
  holder_name: string;
  course_title: string;
  score: number;
  total_questions: number;
  percentage: number;
}

export interface CertificateRegistryNode {
  id: string;
  enrollment_id: string;
  talent_id: string;
  content_id: string;
  holder_name: string;
  course_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  verify_code: string;
  issued_at: string;
  created_at: string;
}

export function useCertificate() {
  const queryClient = useQueryClient();

  /**
   * PHASE: Issue_Artifact
   * Declarative mutation handler that guarantees idempotent transaction states.
   * Leverages Supabase RLS and triggers the cache invalidation matrix safely.
   */
  const issueMutation = useMutation({
    mutationFn: async (params: IssueCertificateParams) => {
      // HUD: REGISTRY_AUDIT
      // Prevent redundant artifact creation for existing trajectories
      const { data: existing, error: auditError } = await supabase
        .from("certificates")
        .select("id, verify_code")
        .eq("enrollment_id", params.enrollment_id)
        .maybeSingle();

      if (auditError) {
        throw auditError;
      }

      if (existing) {
        console.log("[Digital Workforce] Existing_Artifact_Found: Re-linking layout tokens.");
        return existing;
      }

      // HUD: ATOMIC_INGRESS
      const { data, error: insertError } = await supabase
        .from("certificates")
        .insert({
          enrollment_id: params.enrollment_id,
          talent_id: params.talent_id,
          content_id: params.content_id,
          holder_name: params.holder_name,
          course_title: params.course_title,
          score: params.score,
          total_questions: params.total_questions,
          percentage: params.percentage,
          issued_at: new Date().toISOString(),
        })
        .select("id, verify_code")
        .single();

      if (insertError) {
        throw insertError;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the cache to force asset player views and dashboards to synchronize
      queryClient.invalidateQueries({
        queryKey: ["certificate", variables.enrollment_id],
      });
      toast.success("CREDENTIAL_SYNC_COMPLETE: Certificate issued! 🎓");
    },
    onError: (err: any, variables) => {
      // Digital Workforce Architecture: Stream explicitly signed operational errors
      // intended for high-priority monitoring by Admin Chat console layers.
      console.error("[Digital Workforce] ANOMALY: CREDENTIAL_ISSUANCE_FAULT detected.", {
        enrollmentId: variables.enrollment_id,
        talentId: variables.talent_id,
        message: err.message,
        code: err.code,
      });
      toast.error("ARTIFACT_FAULT: Failed to issue institutional credential.");
    },
  });

  /**
   * PHASE: Retrieve_Artifact
   * Standard query selector bound to specific enrollment nodes.
   * Prevents UI locks and ensures cached hydration of verify codes.
   */
  const useCertificateForEnrollment = (enrollmentId: string | undefined) => {
    return useQuery({
      queryKey: ["certificate", enrollmentId],
      enabled: !!enrollmentId,
      staleTime: 5 * 60 * 1000, // 5 minute stability mapping
      queryFn: async (): Promise<CertificateRegistryNode | null> => {
        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("enrollment_id", enrollmentId!)
          .maybeSingle();

        if (error) {
          console.error("[Digital Workforce] FAULT: REGISTRY_FETCH_FAULT.", error);
          throw error;
        }
        return data as CertificateRegistryNode | null;
      },
    });
  };

  return {
    // Legacy mapping support ensuring 100% plug-and-play coverage with current controllers
    issueCertificate: issueMutation.mutateAsync,
    getCertificateForEnrollment: async (enrollmentId: string) => {
      const { data } = await supabase.from("certificates").select("*").eq("enrollment_id", enrollmentId).maybeSingle();
      return data;
    },
    useCertificateForEnrollment,
    issuing: issueMutation.isPending,
  };
}
