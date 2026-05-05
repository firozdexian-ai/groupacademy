import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";

/**
 * GroUp Academy: Neural Identity Orchestrator
 * CTO Reference: Authoritative controller for identity sync and session lifecycle.
 * Sync Version: 2026.04.29 - Fixed createStudentProfile parameter mismatch (TS2554).
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

    // HUD: IDENTITY_STATE_LISTENER
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted.current) {
        if (event === "TOKEN_REFRESHED" && !session) {
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    const executeSessionAudit = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted.current && data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err: any) {
        console.warn("[Auth] Registry_Audit_Fault:", err);
        if (err?.message?.includes("Refresh Token")) await supabase.auth.signOut();
        if (mounted.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    };

    executeSessionAudit();

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
    if (data.length > 1) throw new Error("IDENTITY_COLLISION: Multiple accounts detected. Use email ingress.");

    return data[0].email;
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier.trim();

      if (isPhoneNumber(identifier)) {
        const resolved = await resolveIdentifier(identifier);
        if (!resolved) throw new Error("IDENTITY_NOT_FOUND: No account linked to this phone.");
        email = resolved;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success("WELCOME_BACK: Identity verified.");
    } catch (err: any) {
      toast.error(err.message || "SIGN_IN_FAULT");
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
      if (!authData.user) throw new Error("INGRESS_FAULT: Signup artifact creation failed.");

      toast.loading("INITIALIZING_PROFILE_ARTIFACT...", { duration: 1500 });
      await new Promise((r) => setTimeout(r, 1500));

      let activeSession = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          activeSession = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!activeSession) {
        toast.dismiss();
        toast.warning("REGISTRY_SYNC_DELAYED: Please sign in manually.");
        return false;
      }

      // Apply pending referral, if any
      try {
        const ref = localStorage.getItem("pending_ref") || localStorage.getItem("ga_referral");
        if (ref && authData.user) {
          // Look up referrer by ref_code or by id
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

      toast.dismiss();
      toast.success("ACCOUNT_SYNC_COMPLETE");
      return true;
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "SIGN_UP_FAULT");
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("SESSION_TERMINATED");
    navigate("/", { replace: true });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast.success("RECOVERY_SYNC_SENT");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success("ARTIFACT_UPDATED: Password reset complete.");
  };

  return { user, session, isLoading, signIn, signUp, signOut, resetPassword, updatePassword };
};

/**
 * Institutional Profile Handshake
 * CTO Reference: Corrected signature to resolve TS2554. Hydrates the talent registry.
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
        email: email,
        phone: phone || "",
        status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("IDENTITY_HYDRATION_FAULT:", err);
    return false;
  }
};
