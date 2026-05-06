import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { accountType, isLoading: accountTypeLoading } = useAccountType();

  useEffect(() => {
    if (authLoading || accountTypeLoading) return;
    if (!user) {
      // OAuth failed or got cancelled — back to chat auth.
      navigate("/auth", { replace: true });
      return;
    }
    const dest = resolvePostAuthRoute(accountType, params.get("returnTo")) || "/app/feed";
    navigate(dest, { replace: true });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
