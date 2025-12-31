import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session with timeout
    const checkSession = async () => {
      const timeoutMs = 10000; // 10 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Session check timed out'));
            });
          })
        ]);
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Session check failed:', error);
        // On timeout/error, assume no session
        setSession(null);
        setUser(null);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email or password is incorrect. Please check your credentials.');
      }
      throw error;
    }

    toast.success('Welcome back!');
  };

  const signUp = async (fullName: string, email: string, password: string, phone?: string) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
        emailRedirectTo: `${window.location.origin}/app/feed`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.code === '23505') {
        throw new Error('This email is already registered.');
      }
      throw signUpError;
    }

    if (!authData.user) throw new Error('Signup failed');

    // Wait for session to establish and trigger to create talent record
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Verify session exists
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.warning('Account created! Please sign in to continue.');
      return false;
    }

    // The database trigger handle_new_user_talent creates the talent profile automatically
    toast.success('Account created successfully!');
    return true;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('Signed out successfully');
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    toast.success('Password reset link sent to your email');
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    toast.success('Password updated successfully');
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

// Legacy function - kept for backward compatibility but no longer used
// The database trigger handle_new_user_talent now handles profile creation
// @deprecated Use the database trigger instead
export const createStudentProfile = async (
  _userId: string,
  _fullName: string,
  _email: string,
  _phone?: string,
  _status: 'free_learner' | 'lead' | 'enrolled' | 'graduated' = 'free_learner'
): Promise<boolean> => {
  console.warn('[useAuth] createStudentProfile is deprecated. Talent profiles are now created via database trigger.');
  return true;
};
