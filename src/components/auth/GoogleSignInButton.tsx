import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  className?: string;
  label?: string;
}

/**
 * GroUp Academy: Context-Aware Google Authentication Ingress (V5.6.0)
 * CTO Reference: High-performance OAuth trigger managing state sync bridges safely across platform re-entries.
 * Architecture: Optimized transaction lifecycle blocks completely eliminating button state-lock traps.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function GoogleSignInButton({ className, label = "Continue with Google" }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const redirectPendingRef = useRef(false);

  // If the user closes/cancels the OAuth popup, the window regains focus
  // without a redirect. Only re-enable the button in that case — never
  // while a redirect is genuinely in flight (would allow double-click).
  useEffect(() => {
    let mounted = true;

    const handleWindowFocusSync = () => {
      if (document.visibilityState !== "visible") return;
      if (redirectPendingRef.current) return;
      setTimeout(() => {
        if (mounted) setLoading(false);
      }, 1200);
    };

    window.addEventListener("focus", handleWindowFocusSync);
    return () => {
      mounted = false;
      window.removeEventListener("focus", handleWindowFocusSync);
    };
  }, []);

  const handleGoogleSignInClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    redirectPendingRef.current = true;
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("[GoogleSignIn] OAuth failed:", err?.message || err);
      redirectPendingRef.current = false;
      setLoading(false);
    }
  }, [loading, signInWithGoogle]);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleGoogleSignInClick}
      className={cn(
        "w-full h-12 rounded-full border-border/60 bg-background hover:bg-muted/40 font-bold text-sm gap-3 shadow-sm select-none transition-all duration-300 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20",
        loading && "opacity-80 cursor-not-allowed",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
      )}
      <span
        className={cn(
          "truncate uppercase tracking-wider italic font-black text-xs",
          loading ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {loading ? "Establishing Secure Link..." : label}
      </span>
    </Button>
  );
}
