import { supabase } from "@/integrations/supabase/client";
import { aiGigVerifier } from "@/domains/gigs/api/gigsApi";

/**
 * Fire-and-forget invocation of the AI gig verifier.
 * Replaces legacy auto-review-gig-submission. Phase 5.3.
 */
export async function triggerAutoReview(
  submissionId: string,
  gigKind: "quick" | "marketplace" = "quick"
): Promise<void> {
  if (!submissionId) return;
  try {
    await aiGigVerifier({ submission_id: submissionId, gig_kind: gigKind });
  } catch (err) {
    console.warn("[ai-gig-verifier] invocation failed", err);
  }
}
