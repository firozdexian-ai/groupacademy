import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, Sparkles, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Security requirement: Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Logic error: Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const verifyTokenSequence = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionValid(true);
      } else {
        toast.error("Security session expired. Please request a new recovery link.");
        setTimeout(() => navigate("/auth"), 3000);
      }
      setIsVerifying(false);
    };
    verifyTokenSequence();
  }, [navigate]);

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
      await withTimeout(updatePassword(password), TIMEOUTS.AUTH, "Handshake timed out. Network logic compromised.");
      toast.success("Security Credentials Updated. Protocol Restored.");
      navigate("/app/jobs", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to commit update. Node unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4">
          Verifying Identity Token
        </p>
      </div>
    );

  if (!sessionValid)
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-md w-full rounded-[32px] border-border/40 shadow-2xl overflow-hidden">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Handshake Denied</h2>
              <p className="text-muted-foreground text-sm font-medium px-6">
                The recovery node has expired or the token has been rotated.
              </p>
            </div>
            <Button
              className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              onClick={() => navigate("/auth")}
            >
              Return to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background selection:bg-primary/10 p-6">
      <div className="w-full max-w-md space-y-10 animate-in fade-in duration-700">
        <header className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
            <div className="relative h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Badge
              variant="outline"
              className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-[0.2em] px-4 py-1"
            >
              Identity Recovery
            </Badge>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Reset Logic</h1>
          </div>
        </header>

        <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> New Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  New Password Node
                </Label>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "h-12 rounded-xl border-border/40 bg-muted/20 font-bold focus-visible:ring-primary/20",
                      validationErrors.password && "border-rose-500/50",
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Verify Password Node
                </Label>
                <div className="relative group">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "h-12 rounded-xl border-border/40 bg-muted/20 font-bold focus-visible:ring-primary/20",
                      validationErrors.confirmPassword && "border-rose-500/50",
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    Commit Credentials
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="text-center pt-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
            GroUp Academy Security Protocol v2.6
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;
