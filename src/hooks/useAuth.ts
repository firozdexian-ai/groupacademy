import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // Ensure loading stops when state changes
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
      } catch (error) {
        console.error("Session check failed:", error);
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

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
