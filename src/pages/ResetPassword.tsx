import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Resend dialog state
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase first
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionValid(true);
        setIsVerifying(false);
      }
    });

    // Also check the URL hash for `type=recovery` and existing session
    const verify = async () => {
      const hash = window.location.hash || "";
      const isRecoveryLink = hash.includes("type=recovery");
      const { data } = await supabase.auth.getSession();

      if (isRecoveryLink && data.session) {
        setSessionValid(true);
      } else if (isRecoveryLink) {
        // Wait briefly for PASSWORD_RECOVERY event before failing
        setTimeout(async () => {
          const { data: again } = await supabase.auth.getSession();
          if (again.session) setSessionValid(true);
          setIsVerifying(false);
        }, 800);
        return;
      } else {
        // No recovery indicator at all → reject (do NOT silently log in)
        setSessionValid(false);
      }
      setIsVerifying(false);
    };
    verify();

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await withTimeout(updatePassword(password), TIMEOUTS.AUTH, "Request timed out. Please try again.");
      toast.success("Password updated. You're all set.");
      navigate("/app/feed", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Couldn't update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setIsResending(true);
    try {
      await resetPassword(resendEmail);
      toast.success("Reset link sent. Check your inbox.");
      setTimeout(() => navigate("/auth"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send reset link.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4">Verifying your reset link…</p>
      </div>
    );

  if (!sessionValid)
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-md w-full rounded-3xl border-border/40 shadow-xl">
          <CardContent className="pt-10 text-center space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Link expired</h2>
              <p className="text-muted-foreground text-sm">
                This reset link is invalid or has expired. Enter your email below and we'll send a new one.
              </p>
            </div>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <Label className="text-xs font-medium text-muted-foreground ml-1">Email address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="rounded-xl h-11"
                required
              />
              <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={isResending}>
                {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send a new link"}
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl text-sm"
              onClick={() => navigate("/auth")}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        <header className="text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">Choose a new password to continue.</p>
          </div>
        </header>

        <Card className="rounded-3xl border-border/40 shadow-xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-semibold">New password</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground ml-1">New password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-border/40 pr-10",
                      validationErrors.password && "border-rose-500/50",
                    )}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-rose-500 ml-1">{validationErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground ml-1">Confirm password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-border/40 pr-10",
                      validationErrors.confirmPassword && "border-rose-500/50",
                    )}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-rose-500 ml-1">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    Update password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
