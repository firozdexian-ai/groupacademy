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
        emailRedirectTo: `${window.location.origin}/my-learning`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.code === '23505') {
        throw new Error('This email is already registered.');
      }
      throw signUpError;
    }

    if (!authData.user) throw new Error('Signup failed');

    // Wait for session to establish
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Verify session exists
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.warning('Account created! Please sign in to continue.');
      return false;
    }

    // Create student profile with retry logic
    const profileCreated = await createStudentProfile(authData.user.id, fullName, email, phone);
    
    if (!profileCreated) {
      toast.warning('Account created! Please complete your profile.');
    }

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

// Shared student profile creation logic with retry
export const createStudentProfile = async (
  userId: string,
  fullName: string,
  email: string,
  phone?: string,
  status: 'free_learner' | 'lead' | 'enrolled' | 'graduated' = 'free_learner'
): Promise<boolean> => {
  const maxRetries = 3;
  const delays = [500, 1000, 2000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { error: profileError } = await supabase.from('students').insert([
        {
          user_id: userId,
          student_id: '',
          full_name: fullName,
          email: email,
          phone: phone || '',
          status: status,
        },
      ]);

      if (profileError) {
        if (profileError.code === '23505') {
          await new Promise(resolve => setTimeout(resolve, 300));
          const { data: existingProfile } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (existingProfile) {
            return true;
          }
        }
        throw profileError;
      }

      return true;
    } catch (error: any) {
      console.error(`Profile creation attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  return false;
};
