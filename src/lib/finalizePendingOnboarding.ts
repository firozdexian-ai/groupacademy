import { supabase } from "@/integrations/supabase/client";
import {
  getTalentOnboardingStateByUser,
  patchTalentByUser,
} from "@/domains/talent/repo/talentRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface PendingOnboarding {
  country: { id: string; iso2: string; name: string };
  stage: { id: string; name: string; slug: string; academy_id: string | null };
  institution: { id: string; name: string; country: string | null };
  school: { id: string; name: string; slug: string; academy_id: string | null };
  funnelParams?: Record<string, string>;
  stashedAt?: number;
}

const KEY = "pending_onboarding";

export function readPendingOnboarding(): PendingOnboarding | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOnboarding;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Apply a pre-auth onboarding stash to the current user's talents row.
 * Only fills blank fields so we never overwrite something the user already set.
 * Safe to call multiple times — clears the stash on success.
 */
export async function finalizePendingOnboarding(): Promise<boolean> {
  const pending = readPendingOnboarding();
  if (!pending) return false;

  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) return false;
    const userId = authData.user.id;

    const existing = await getTalentOnboardingStateByUser(userId);

    const isFreeform = pending.institution.id.startsWith("freeform:");
    const patch: Record<string, unknown> = {};
    if (!existing?.country_id) {
      patch.country_id = pending.country.id;
      patch.country_code = pending.country.iso2;
      patch.country = pending.country.name;
    }
    if (!existing?.career_stage_id) patch.career_stage_id = pending.stage.id;
    if (!existing?.institution_id && !existing?.institution) {
      patch.institution_id = isFreeform ? null : pending.institution.id;
      patch.institution = pending.institution.name;
    }
    if (!existing?.school_id) patch.school_id = pending.school.id;
    if (!existing?.onboarding_completed_at) {
      patch.onboarding_step = 4;
      patch.onboarding_completed_at = new Date().toISOString();
    }

    if (Object.keys(patch).length > 0) {
      await patchTalentByUser(userId, patch);
    }

    trackEvent("pending_onboarding_finalized", {
      filledKeys: Object.keys(patch),
      freeformInstitution: isFreeform,
    });
    clearPendingOnboarding();
    return true;
  } catch (err) {
    trackError(err, { component: "finalizePendingOnboarding" });
    return false;
  }
}
