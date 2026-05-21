import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";
import { sendTransactionalEmail } from "@/domains/messaging/api/messagingApi";

/**
 * Identity & session orchestrator.
 * - Listener attached BEFORE getSession so INITIAL_SESSION is never missed.
 * - Refresh-token failures clear local state and route to /auth.
 * - Welcome email is fired by the auth-callback flow after email confirmation.
 */

/**
 * @deprecated Legacy `students` table shim. New flows use the `talents` table
 * (auto-created by the handle_new_user trigger). Kept as a no-op so legacy
 * call sites (AccessCodeDialog, CourseDetail) keep compiling.
 */
export async function createStudentProfile(
  _userId: string,
  _fullName: string,
  _email: string,
  _phone: string,
  _accountType: string = "free_learner",
): Promise<boolean> {
  return true;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
    country?: string,
    countryCode?: string,
  ) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

function friendlyAuthError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Your account is being activated — please try again in a moment.";
  if (m.includes("user already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password") && m.includes("weak")) return "Choose a stronger password (at least 8 characters).";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network")) return "Network issue. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // 1) Attach listener FIRST so we never miss INITIAL_SESSION / TOKEN_REFRESHED.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted.current) return;

      // Refresh-token failure / explicit sign-out → wipe local state.
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !nextSession)) {
        setSession(null);
        setUser(null);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    // 2) Then hydrate the existing session.
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted.current) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.warn("[useAuth] session hydrate failed:", err);
        if (mounted.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    })();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  /** Resolve phone → email so users can sign in by phone. */
  const resolveIdentifier = async (phone: string): Promise<string | null> => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const variants = [cleanPhone, cleanPhone.startsWith("+") ? cleanPhone.substring(1) : `+${cleanPhone}`];
    return resolveTalentEmailByPhoneVariants(variants);
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier.trim();
      if (isPhoneNumber(identifier)) {
        const resolved = await resolveIdentifier(identifier);
        if (!resolved) throw new Error("No account found for this phone number.");
        email = resolved;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back.");
    } catch (err: any) {
      toast.error(friendlyAuthError(err.message));
      throw err;
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
    country?: string,
    countryCode?: string,
  ) => {
    try {
      const ref = localStorage.getItem("pending_ref") || localStorage.getItem("ga_referral") || "";

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || "",
            country: country || "BD",
            country_code: countryCode || "+880",
            account_type: "talent",
            referral_code: ref || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Could not create your account. Please try again.");

      // Email auto-confirmation is enabled — user is signed in immediately.
      // Fire welcome email once (idempotent via idempotencyKey).
      const welcomeKey = `ga_welcome_sent_${authData.user.id}`;
      if (typeof localStorage !== "undefined" && !localStorage.getItem(welcomeKey)) {
        void sendTransactionalEmail({
          templateName: "welcome",
          recipientEmail: email.trim(),
          idempotencyKey: `welcome-${authData.user.id}`,
          templateData: { name: (fullName || "Learner").split(" ")[0] || "Learner" },
        }).catch(() => {});
        localStorage.setItem(welcomeKey, "1");
      }
      toast.success("Welcome — let's set up your profile.");
      return true;
    } catch (err: any) {
      toast.error(friendlyAuthError(err.message));
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      console.error("[useAuth] OAuth failed:", err);
      toast.error("Google sign-in failed. Please try again.");
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    toast.success("Signed out.");
    navigate("/", { replace: true });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast.success("Password reset link sent.");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success("Password updated.");
  };

  return { user, session, isLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword, updatePassword };
};
