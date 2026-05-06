import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";

/**
 * Talent identity hook — wraps Supabase auth with friendly toasts and phone-based sign-in.
 */

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

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Bootstrap: read existing session FIRST, then attach listener (race-free).
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted.current) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err: any) {
        console.warn("[Auth] Session check failed:", err);
        if (mounted.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted.current) return;
      if (event === "TOKEN_REFRESHED" && !nextSession) {
        setSession(null);
        setUser(null);
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const resolveIdentifier = async (phone: string): Promise<string | null> => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const variants = [cleanPhone, cleanPhone.startsWith("+") ? cleanPhone.substring(1) : `+${cleanPhone}`];
    const matchQuery = variants.map((p) => `phone.eq.${p}`).join(",");

    const { data, error } = await supabase
      .from("talents")
      .select("email")
      .or(matchQuery)
      .not("email", "is", null)
      .limit(2);

    if (error || !data || data.length === 0) return null;
    if (data.length > 1) throw new Error("Multiple accounts use this phone. Please sign in with email instead.");

    return data[0].email;
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier.trim();

      if (isPhoneNumber(identifier)) {
        const resolved = await resolveIdentifier(identifier);
        if (!resolved) throw new Error("No account found for that phone number.");
        email = resolved;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Couldn't sign you in. Please try again.");
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
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || "",
            country: country || "BD",
            country_code: countryCode || "+880",
          },
          emailRedirectTo: `${window.location.origin}/app/feed`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("We couldn't create your account. Please try again.");

      // Auto-confirm is ON, so a session should be present immediately.
      // Apply pending referral if any.
      try {
        const ref = localStorage.getItem("pending_ref") || localStorage.getItem("ga_referral");
        if (ref && authData.user) {
          const { data: referrer } = await supabase
            .from("talents")
            .select("id")
            .or(`ref_code.eq.${ref},id.eq.${ref}`)
            .maybeSingle();
          if (referrer?.id) {
            await supabase
              .from("talents")
              .update({ referred_by: referrer.id })
              .eq("user_id", authData.user.id);
          }
          localStorage.removeItem("pending_ref");
          localStorage.removeItem("ga_referral");
        }
      } catch {}

      // Fire welcome email (non-blocking, idempotent on user id)
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome",
            recipientEmail: email.trim(),
            idempotencyKey: `welcome-${authData.user.id}`,
            templateData: { name: fullName?.split(" ")[0] || undefined },
          },
        });
      } catch (e) {
        console.warn("[Auth] welcome email enqueue failed", e);
      }

      toast.success("Account created.");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Couldn't create your account. Please try again.");
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast.error("Couldn't sign in with Google. Please try again.");
        throw result.error;
      }
      // If redirected, browser navigates away; otherwise tokens already set.
    } catch (err: any) {
      if (!err?.message) toast.error("Couldn't sign in with Google. Please try again.");
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate("/", { replace: true });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast.success("Reset link sent — check your inbox.");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success("Password updated.");
  };

  return { user, session, isLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword, updatePassword };
};

/**
 * Helper for hydrating the talents table after a manual signup (used by access-code flows).
 */
export const createStudentProfile = async (
  userId: string,
  fullName: string,
  email: string,
  phone?: string,
  status: "free_learner" | "lead" | "enrolled" | "graduated" = "free_learner",
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("talents").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        phone: phone || "",
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Failed to create talent profile:", err);
    return false;
  }
};
