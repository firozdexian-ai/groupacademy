import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";

/**
 * GroUp Academy: Identity & Access Orchestrator
 * CTO Reference: Primary sensor for session lifecycle and identity resolution.
 * Architecture: Digital Workforce enabled - anomaly detection on auth failure.
 * Phase: Z0 Code Freeze Hardened.
 */

export async function createStudentProfile(
  userId: string,
  fullName: string,
  email: string,
  phone: string,
  accountType: string = "free_learner",
): Promise<boolean> {
  const { error } = await (supabase as any).from("students").insert({
    user_id: userId,
    full_name: fullName,
    email,
    phone,
    account_type: accountType,
  });
  if (error) {
    console.error("[createStudentProfile] failed:", error.message);
    return false;
  }
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

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // HUD: BOOTSTRAP_IDENTITY_NODE
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted.current) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err: any) {
        console.warn("[Digital Workforce] Session handshake failed:", err);
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

      // Protocol: Handle silent token expirations to prevent stale UI states
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !nextSession)) {
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

  /**
   * HUD: IDENTITY_RESOLUTION_PROTOCOL
   * Resolves phone digits to primary email node for login.
   */
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

    // ANOMALY SENSOR: Multiple accounts detected for one phone node
    if (data.length > 1) {
      console.error("[Digital Workforce] IDENTITY_COLLISION: Multiple emails for phone", cleanPhone);
      throw new Error("MULTIPLE_NODES_DETECTED: Please sign in with email.");
    }

    return data[0].email;
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier.trim();

      if (isPhoneNumber(identifier)) {
        const resolved = await resolveIdentifier(identifier);
        if (!resolved) throw new Error("NO_NODE_FOUND: No account assigned to this phone.");
        email = resolved;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success("Identity Verified: Welcome back.");
    } catch (err: any) {
      toast.error(err.message || "Identity verification failed.");
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
      // Identity Verify: CV fingerprinting check should ideally occur before this
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || "",
            country: country || "BD",
            country_code: countryCode || "+880",
            account_type: "talent", // Default protocol for this line
          },
          emailRedirectTo: `${window.location.origin}/app/feed`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("IDENTITY_PROVISIONING_FAILED");

      // HUD: REFERRAL_HANDSHAKE
      const ref = localStorage.getItem("pending_ref") || localStorage.getItem("ga_referral");
      if (ref && authData.user) {
        const { data: referrer } = await supabase
          .from("talents")
          .select("id")
          .or(`ref_code.eq.${ref},id.eq.${ref}`)
          .maybeSingle();

        if (referrer?.id) {
          await supabase.from("talents").update({ referred_by: referrer.id }).eq("user_id", authData.user.id);

          console.log("[Digital Workforce] REFERRAL_SYNC_SUCCESS");
        }
        localStorage.removeItem("pending_ref");
        localStorage.removeItem("ga_referral");
      }

      // HUD: WELCOME_TELEMETRY (Trigger Edge Function)
      void supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome",
          recipientEmail: email.trim(),
          idempotencyKey: `welcome-${authData.user.id}`,
          templateData: { name: fullName?.split(" ")[0] || "Learner" },
        },
      });

      toast.success("Registration Complete: Welcome to Group Academy.");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
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
      console.error("[Digital Workforce] OAUTH_FAULT:", err);
      toast.error("Social handshake failed.");
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Session Terminated.");
    navigate("/", { replace: true });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast.success("Recovery Link Sent.");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success("Security Node Updated.");
  };

  return { user, session, isLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword, updatePassword };
};
