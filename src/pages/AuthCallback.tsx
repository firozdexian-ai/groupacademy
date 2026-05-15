import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";
import { supabase } from "@/integrations/supabase/client";

const WELCOME_KEY_PREFIX = "ga_welcome_sent_";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { accountType, isLoading: accountTypeLoading } = useAccountType();
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (authLoading || accountTypeLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Brand-new OAuth users: talents row may not exist yet — retry once.
    if (accountType === "unknown" && !retried) {
      setRetried(true);
      const t = setTimeout(() => setRetried(false), 600);
      return () => clearTimeout(t);
    }

    // Fire-and-forget welcome email (idempotent, once per user).
    const welcomeKey = `${WELCOME_KEY_PREFIX}${user.id}`;
    if (!localStorage.getItem(welcomeKey)) {
      const fullName = (user.user_metadata as any)?.full_name || "Learner";
      void supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "welcome",
            recipientEmail: user.email,
            idempotencyKey: `welcome-${user.id}`,
            templateData: { name: fullName.split(" ")[0] || "Learner" },
          },
        })
        .catch(() => {});
      localStorage.setItem(welcomeKey, "1");
      // Clear stale referral once it's been consumed by the trigger.
      localStorage.removeItem("pending_ref");
      localStorage.removeItem("ga_referral");
    }

    const dest = resolvePostAuthRoute(accountType, params.get("returnTo")) || "/app/feed";
    navigate(dest, { replace: true });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, params, retried]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
