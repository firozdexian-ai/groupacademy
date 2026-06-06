import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useTalent } from "@/hooks/useTalent";
import { resolvePostAuthRoute, getDefaultRouteFor } from "@/lib/postAuthRoute";
import { safeReturnTo } from "@/lib/safeReturnTo";

/**
 * Public pre-auth onboarding entry point.
 *
 * Flow:
 *   1) Visitor picks country → stage → university → field.
 *   2) OnboardingWizard (in preAuth mode) stashes the selection to
 *      sessionStorage as `pending_onboarding`.
 *   3) We route them to /auth — after Google or email sign-up,
 *      AuthCallback / AccountUpgradeModal will pick the stash up and
 *      apply it to their talents row.
 *
 * Already-signed-in users skip straight to their account-type default.
 */
export default function Start() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { accountType, isLoading: accountTypeLoading } = useAccountType();
  const { talent } = useTalent();
  const [done, setDone] = useState(false);

  // Returning users bypass onboarding entirely if they have completed the wizard step.
  useEffect(() => {
    if (authLoading || accountTypeLoading) return;
    if (user && talent?.onboardingStep === 4) {
      const returnTo = safeReturnTo(searchParams.get("returnTo"));
      const target = resolvePostAuthRoute(accountType, returnTo) ?? "/app/feed";
      navigate(target, { replace: true });
    }
  }, [user, authLoading, accountType, accountTypeLoading, navigate, searchParams, talent]);

  // After the wizard stashes selections, jump to /auth with an account-type-aware
  // returnTo so the existing post-auth route + AuthCallback finalize step takes over.
  useEffect(() => {
    if (done) {
      const qs = new URLSearchParams(searchParams);
      if (!qs.get("returnTo")) {
        // Pre-auth visitors are talents by default; admins/companies don't go through Start.
        qs.set("returnTo", getDefaultRouteFor("talent"));
      }
      navigate(`/auth?${qs.toString()}`, { replace: true });
    }
  }, [done, navigate, searchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="main">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return <OnboardingWizard preAuth onComplete={() => setDone(true)} />;
}
