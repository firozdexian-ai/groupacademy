import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";
import { safeReturnTo } from "@/lib/safeReturnTo";
import { finalizePendingOnboarding } from "@/lib/finalizePendingOnboarding";
import { sendTransactionalEmail } from "@/domains/messaging/api/messagingApi";

const WELCOME_KEY_PREFIX = "ga_welcome_sent_";
const MAX_ACCOUNT_TYPE_RETRIES = 3;
const ACCOUNT_TYPE_RETRY_MS = 600;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { accountType, isLoading: accountTypeLoading } = useAccountType();
  const [retryTick, setRetryTick] = useState(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (authLoading || accountTypeLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Brand-new OAuth users: the talents row is created by a trigger and
    // may not be visible yet. Poll up to 3× (≈1.8s total) before falling
    // back to the talent default.
    if (accountType === "unknown" && retryCountRef.current < MAX_ACCOUNT_TYPE_RETRIES) {
      retryCountRef.current += 1;
      const t = setTimeout(() => setRetryTick((n) => n + 1), ACCOUNT_TYPE_RETRY_MS);
      return () => clearTimeout(t);
    }

    // Fire-and-forget welcome email (idempotent, once per user).
    const welcomeKey = `${WELCOME_KEY_PREFIX}${user.id}`;
    if (!localStorage.getItem(welcomeKey)) {
      const fullName = (user.user_metadata as any)?.full_name || "Learner";
      void sendTransactionalEmail({
        templateName: "welcome",
        recipientEmail: user.email,
        idempotencyKey: `welcome-${user.id}`,
        templateData: { name: fullName.split(" ")[0] || "Learner" },
      }).catch(() => {});
      localStorage.setItem(welcomeKey, "1");
      // Clear stale referral once it's been consumed by the trigger.
      localStorage.removeItem("pending_ref");
      localStorage.removeItem("ga_referral");
    }

    // Apply any pre-auth onboarding selections stashed at /start before
    // routing. Fire-and-forget — failure shouldn't block sign-in.
    void finalizePendingOnboarding();

    const dest =
      resolvePostAuthRoute(accountType, safeReturnTo(params.get("returnTo"))) || "/app/feed";
    navigate(dest, { replace: true });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, params, retryTick]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
