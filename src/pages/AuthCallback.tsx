import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { accountType, isLoading: accountTypeLoading, refresh } = useAccountType();
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (authLoading || accountTypeLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    // For brand-new OAuth users, the talents row may not exist yet — retry once.
    if (accountType === "unknown" && !retried) {
      setRetried(true);
      const t = setTimeout(() => {
        try { (refresh as any)?.(); } catch { /* noop */ }
      }, 600);
      return () => clearTimeout(t);
    }
    const dest = resolvePostAuthRoute(accountType, params.get("returnTo")) || "/app/feed";
    navigate(dest, { replace: true });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, params, retried, refresh]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
