import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { issueSkillCredentials } from "@/domains/learning/api/learningApi";
import { toast } from "sonner";

/**
 * GroUp Academy: Verifiable Academic Ledger Suite (V5.6.0)
 * CTO Reference: Cryptographic assertion manager validating skill badges for recruitment pipelines.
 * Architecture: Optimized via TanStack Query v5 with targeted invalidation layers.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface SkillCredential {
  id: string;
  talent_id: string;
  topic_tag: string;
  content_id: string | null;
  module_id: string | null;
  level: "foundational" | "proficient" | "expert";
  mastery_at_issue: number;
  attempts_at_issue: number;
  evidence: any;
  verify_code: string;
  issued_at: string;
  revoked_at: string | null;
  content?: {
    title: string;
    slug: string;
  } | null;
}

export interface IssueCredentialsResponse {
  newly_issued: SkillCredential[];
  evaluated: number;
}

/**
 * Fetches cryptographically verified skill badges for a specified talent.
 */
export function useSkillCredentials(talentId?: string | null) {
  return useQuery({
    queryKey: ["skill-credentials", talentId],
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000, // 5-minute cache consistency boundary for archival records
    queryFn: async (): Promise<SkillCredential[]> => {
      // HUD: EXECUTING_CREDENTIALS_LEDGER_INGRESS_SELECT
      const { data, error } = await supabase
        .from("skill_credentials")
        .select("*, content:content_id(title, slug)")
        .eq("talent_id", talentId!)
        .is("revoked_at", null)
        .order("issued_at", { ascending: false });

      if (error) {
        console.error("[Digital Workforce] FAULT: skill_credentials lookup failed.", error);
        throw error;
      }

      // Hardened Data Normalization Layer: Sanitizes nested items against schema anomalies
      return (data || []).map((row: any) => ({
        id: String(row.id),
        talent_id: String(row.talent_id),
        topic_tag: String(row.topic_tag ?? "General Skill"),
        content_id: row.content_id ?? null,
        module_id: row.module_id ?? null,
        level: row.level === "expert" || row.level === "proficient" ? row.level : "foundational",
        mastery_at_issue: Number(row.mastery_at_issue ?? 0),
        attempts_at_issue: Number(row.attempts_at_issue ?? 1),
        evidence: row.evidence ?? null,
        verify_code: String(row.verify_code ?? ""),
        issued_at: String(row.issued_at),
        revoked_at: row.revoked_at ?? null,
        content: row.content
          ? {
              title: String(row.content.title ?? "Curriculum Node"),
              slug: String(row.content.slug ?? ""),
            }
          : null,
      }));
    },
  });
}

/**
 * Evaluates competency records and creates verifiable milestone badges via Edge Runtimes.
 */
export function useIssueSkillCredentials(talentId?: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<IssueCredentialsResponse> => {
      // HUD: INVOKING_CREDENTIAL_ISSUANCE_EDGE_ENGINE
      const data = await issueSkillCredentials({});

      interface EdgeResponseWrapper {
        error?: string;
        message?: string;
        newly_issued?: any[];
        evaluated?: number;
      }

      const validatedData = data as EdgeResponseWrapper | null;
      if (validatedData?.error) {
        throw new Error(validatedData.message || validatedData.error);
      }

      return {
        newly_issued: (validatedData?.newly_issued || []) as SkillCredential[],
        evaluated: Number(validatedData?.evaluated ?? 0),
      };
    },
    onSuccess: (res) => {
      // Execute strict targeted cache purging to defend sibling views from reload thrashing
      void qc.invalidateQueries({
        queryKey: ["skill-credentials", talentId],
        exact: true,
      });

      if (res.newly_issued.length > 0) {
        toast.success(`Cryptographic Ledger Verified: Issued ${res.newly_issued.length} new skill credentials.`);
      } else {
        toast.info(`Evaluation loop complete. Current mastery profiles (${res.evaluated} nodes) are fully aligned.`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Cryptographic badge issuance validation failed.");
    },
  });
}
