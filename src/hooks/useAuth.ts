import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";

// 1. Define the return type for better safety in other files
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, phone?: string, country?: string, countryCode?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 2. Add a ref to track if component is mounted
  // This prevents "Can't perform a React state update on an unmounted component" errors
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted.current) {
        // If token refresh failed (stale session), purge it
        if (event === 'TOKEN_REFRESHED' && !session) {
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

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted.current) {
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      } catch (error: any) {
        console.error("Session check failed:", error);
        // Clear stale tokens on refresh failure to prevent redirect loops
        if (error?.message?.includes('Refresh Token') || error?.code === 'refresh_token_not_found') {
          await supabase.auth.signOut();
        }
        if (mounted.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper to resolve email from phone number (secure exact matching)
  const resolveEmailFromPhone = async (phone: string): Promise<string | null> => {
    // Remove all non-digit characters except leading +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Prepare different phone formats for exact matching
    const phoneVariants: string[] = [];
    
    // Original cleaned phone
    phoneVariants.push(cleanPhone);
    
    // With + prefix if not present
    if (!cleanPhone.startsWith('+')) {
      phoneVariants.push(`+${cleanPhone}`);
    }
    
    // Without + prefix if present
    if (cleanPhone.startsWith('+')) {
      phoneVariants.push(cleanPhone.substring(1));
    }
    
    // Build exact match query (no partial matching for security)
    const exactMatchQuery = phoneVariants.map(p => `phone.eq.${p}`).join(',');
    
    const { data, error } = await supabase
      .from('talents')
      .select('email, phone, country_code')
      .or(exactMatchQuery)
      .not('email', 'is', null)
      .limit(5);

    if (error || !data || data.length === 0) {
      return null;
    }

    // If multiple accounts found with same phone (legacy duplicates)
    if (data.length > 1) {
      throw new Error("Multiple accounts found with this phone. Please use your email to login.");
    }

    return data[0].email;
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier.trim();

      // Check if identifier is a phone number (no @ symbol)
      if (isPhoneNumber(identifier)) {
        const resolvedEmail = await resolveEmailFromPhone(identifier);
        if (!resolvedEmail) {
          throw new Error("No account found with this phone number.");
        }
        email = resolvedEmail;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email or password is incorrect.");
        }
        throw error;
      }

      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
      throw err;
    }
  };

  const signUp = async (fullName: string, email: string, password: string, phone?: string, country?: string, countryCode?: string) => {
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
          // Ensure this points to where you actually want them to go
          emailRedirectTo: `${window.location.origin}/app/feed`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.code === "23505") {
          throw new Error("This email is already registered.");
        }
        throw signUpError;
      }

      if (!authData.user) throw new Error("Signup failed");

      // Wait for session to establish and trigger to create talent record
      // We keep your logic here, but with a toast to inform the user
      toast.loading("Setting up your profile...", { duration: 1500 });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify session exists with retry
      let activeSession = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          activeSession = data.session;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!activeSession) {
        toast.dismiss(); // Remove loading toast
        toast.warning("Account created! Please sign in to continue.");
        return false;
      }

      toast.dismiss();
      toast.success("Account created successfully!");
      return true;
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Signup failed");
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out successfully");
    navigate("/", { replace: true });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    toast.success("Password reset link sent to your email");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    toast.success("Password updated successfully");
  };

  return {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
};

// Legacy function - kept for backward compatibility
export const createStudentProfile = async (
  _userId: string,
  _fullName: string,
  _email: string,
  _phone?: string,
  _status: "free_learner" | "lead" | "enrolled" | "graduated" = "free_learner",
): Promise<boolean> => {
  console.warn("[useAuth] createStudentProfile is deprecated.");
  return true;
};
