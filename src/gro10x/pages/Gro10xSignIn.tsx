import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Dedicated Gro10x sign-in page. Always lands company members in
 * /gro10x/inbox — never bounces them to the talent app.
 */
export default function Gro10xSignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongApp, setWrongApp] = useState(false);

  useEffect(() => {
    setError(null);
    setWrongApp(false);
  }, [email, password]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: siErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (siErr) throw siErr;
      const userId = data.user?.id;
      const userEmail = data.user?.email;
      if (!userId || !userEmail) throw new Error("Sign-in failed");

      // Verify membership via service-role edge function (RLS-immune),
      // mirroring the same lookup Riya uses in the auth chat.
      const { data: lookup, error: lookupErr } = await supabase.functions.invoke(
        "check-company-account",
        { body: { email: userEmail } },
      );

      if (lookupErr) {
        // Don't lie about "talent account" when we genuinely couldn't verify.
        toast.error("Couldn't verify your workspace. Please try again.");
        setError("Workspace verification failed. Please retry.");
        return;
      }

      if (!lookup?.isCompany) {
        setWrongApp(true);
        await supabase.auth.signOut();
        return;
      }

      navigate("/gro10x/inbox", { replace: true });
    } catch (err: any) {
      console.error("[Gro10xSignIn] error:", err);
      setError(err.message || "Invalid email or password.");
      toast.error(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    if (!email) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success("Check your inbox for a reset link.");
    } catch (err: any) {
      toast.error(err.message || "Could not send reset email.");
    }
  };

  return (
    <div className={cn(GRO10X_BG, GRO10X_TEXT, "min-h-[100dvh] flex flex-col")}>
      <header className="px-5 pt-6 pb-3 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate("/gro10x")}
          className="flex items-center gap-2"
        >
          <img src="/gro10x/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
          <span className="font-semibold tracking-tight">Gro10x</span>
        </button>
      </header>

      <main className="flex-1 px-5 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mt-4">Welcome back</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to your Gro10x workspace.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300">Work email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@yourcompany.com"
              className="mt-1 w-full h-12 rounded-xl bg-[#0F172A] border border-white/10 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#33E1E4]/50"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full h-12 rounded-xl bg-[#0F172A] border border-white/10 px-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#33E1E4]/50"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {wrongApp && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-3 space-y-2">
              <p className="text-amber-200">
                This email isn't linked to a Gro10x company workspace. It looks
                like a talent account.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-[#33E1E4] font-semibold"
              >
                Open the talent app <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#33E1E4] disabled:opacity-50 text-[#06121A] font-semibold inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onForgot}
            className="w-full text-center text-xs text-slate-400 hover:text-[#33E1E4] py-1"
          >
            Forgot password?
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          New to Gro10x?{" "}
          <Link to="/gro10x/auth" className="text-[#33E1E4] hover:underline">
            Create a workspace
          </Link>
        </p>
      </main>
    </div>
  );
}
