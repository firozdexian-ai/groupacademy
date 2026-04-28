import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Credential Issuance Orchestrator
 * CTO Reference: Authoritative controller for pedagogical artifact generation.
 * Logic: Implements idempotent issuance and verification key retrieval.
 */

interface IssueCertificateParams {
  enrollment_id: string;
  talent_id: string;
  content_id: string;
  holder_name: string;
  course_title: string;
  score: number;
  total_questions: number;
  percentage: number;
}

export function useCertificate() {
  const [issuing, setIssuing] = useState(false);

  /**
   * PHASE: Issue_Artifact
   * Synchronizes assessment results with the global certificate registry.
   */
  const issueCertificate = async (params: IssueCertificateParams) => {
    setIssuing(true);
    try {
      // HUD: REGISTRY_AUDIT
      // Prevent redundant artifact creation for existing trajectories
      const { data: existing } = await supabase
        .from("certificates")
        .select("id, verify_code")
        .eq("enrollment_id", params.enrollment_id)
        .maybeSingle();

      if (existing) {
        console.log("[useCertificate] Existing_Artifact_Found: Returning legacy code.");
        return existing;
      }

      // HUD: ATOMIC_INGRESS
      const { data, error } = await supabase
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

      if (error) throw error;

      toast.success("CREDENTIAL_SYNC_COMPLETE: Certificate issued! 🎓");
      return data;
    } catch (err: any) {
      console.error("CREDENTIAL_ISSUANCE_FAULT:", err);
      toast.error("ARTIFACT_FAULT: Failed to issue institutional credential.");
      return null;
    } finally {
      setIssuing(false);
    }
  };

  /**
   * PHASE: Retrieve_Artifact
   * Retrieves full credential metadata for the achievement viewport.
   */
  const getCertificateForEnrollment = async (enrollmentId: string) => {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (error) console.error("REGISTRY_FETCH_FAULT:", error);
    return data;
  };

  return { issueCertificate, getCertificateForEnrollment, issuing };
}
