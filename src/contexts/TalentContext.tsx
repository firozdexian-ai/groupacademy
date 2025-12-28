import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface TalentProfile {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  cvUrl: string | null;
  cvText: string | null;
  cvParsedAt: string | null;
  professionCategoryId: string | null;
  customProfession: string | null;
  currentStatus: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  education: any[];
  experience: any[];
  skills: any[];
  projects: any[];
  achievements: any[];
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  profilePhotoUrl: string | null;
  servicesUsed: string[];
  isFeatured: boolean;
  learnerStatus: string;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TalentContextValue {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // Talent profile
  talent: TalentProfile | null;
  
  // Loading states
  isLoading: boolean;
  isAuthLoading: boolean;
  isTalentLoading: boolean;
  
  // Actions
  refreshTalent: () => Promise<void>;
  updateTalent: (data: Partial<TalentProfile>) => Promise<boolean>;
  addServiceUsed: (service: string) => Promise<void>;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const TalentContext = createContext<TalentContextValue | undefined>(undefined);

// Map database row to TalentProfile
function mapRowToTalent(row: any): TalentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    cvUrl: row.cv_url,
    cvText: row.cv_text,
    cvParsedAt: row.cv_parsed_at,
    professionCategoryId: row.profession_category_id,
    customProfession: row.custom_profession,
    currentStatus: row.current_status,
    fieldOfStudy: row.field_of_study,
    institution: row.institution,
    education: Array.isArray(row.education) ? row.education : [],
    experience: Array.isArray(row.experience) ? row.experience : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    projects: Array.isArray(row.projects) ? row.projects : [],
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    profilePhotoUrl: row.profile_photo_url,
    servicesUsed: Array.isArray(row.services_used) ? row.services_used : [],
    isFeatured: row.is_featured || false,
    learnerStatus: row.learner_status || 'free_learner',
    studentId: row.student_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function TalentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isTalentLoading, setIsTalentLoading] = useState(false);

  // Fetch talent profile by user ID or email
  const fetchTalent = useCallback(async (userId?: string, email?: string) => {
    if (!userId && !email) {
      setTalent(null);
      return;
    }

    setIsTalentLoading(true);
    try {
      let query = supabase.from('talents').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (email) {
        query = query.ilike('email', email);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[TalentContext] Error fetching talent:', error);
        setTalent(null);
        return;
      }

      if (data) {
        setTalent(mapRowToTalent(data));
      } else {
        setTalent(null);
      }
    } catch (error) {
      console.error('[TalentContext] Error fetching talent:', error);
      setTalent(null);
    } finally {
      setIsTalentLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[TalentContext] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer talent fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchTalent(session.user.id, session.user.email);
          }, 0);
        } else {
          setTalent(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchTalent(session.user.id, session.user.email);
      }
      
      setIsAuthLoading(false);
    }).catch((error) => {
      console.error('[TalentContext] Error getting session:', error);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchTalent]);

  // Refresh talent profile
  const refreshTalent = useCallback(async () => {
    if (user) {
      await fetchTalent(user.id, user.email ?? undefined);
    }
  }, [user, fetchTalent]);

  // Update talent profile
  const updateTalent = useCallback(async (data: Partial<TalentProfile>): Promise<boolean> => {
    if (!talent?.id) return false;

    try {
      // Map camelCase to snake_case
      const updateData: any = {};
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.cvUrl !== undefined) updateData.cv_url = data.cvUrl;
      if (data.cvText !== undefined) updateData.cv_text = data.cvText;
      if (data.cvParsedAt !== undefined) updateData.cv_parsed_at = data.cvParsedAt;
      if (data.professionCategoryId !== undefined) updateData.profession_category_id = data.professionCategoryId;
      if (data.customProfession !== undefined) updateData.custom_profession = data.customProfession;
      if (data.currentStatus !== undefined) updateData.current_status = data.currentStatus;
      if (data.fieldOfStudy !== undefined) updateData.field_of_study = data.fieldOfStudy;
      if (data.institution !== undefined) updateData.institution = data.institution;
      if (data.education !== undefined) updateData.education = data.education;
      if (data.experience !== undefined) updateData.experience = data.experience;
      if (data.skills !== undefined) updateData.skills = data.skills;
      if (data.projects !== undefined) updateData.projects = data.projects;
      if (data.achievements !== undefined) updateData.achievements = data.achievements;
      if (data.linkedinUrl !== undefined) updateData.linkedin_url = data.linkedinUrl;
      if (data.portfolioUrl !== undefined) updateData.portfolio_url = data.portfolioUrl;
      if (data.profilePhotoUrl !== undefined) updateData.profile_photo_url = data.profilePhotoUrl;

      const { error } = await supabase
        .from('talents')
        .update(updateData)
        .eq('id', talent.id);

      if (error) {
        console.error('[TalentContext] Error updating talent:', error);
        return false;
      }

      // Refresh the profile
      await refreshTalent();
      return true;
    } catch (error) {
      console.error('[TalentContext] Error updating talent:', error);
      return false;
    }
  }, [talent?.id, refreshTalent]);

  // Add a service to services_used (normalized to simple string array)
  const addServiceUsed = useCallback(async (service: string) => {
    if (!talent?.id) return;

    try {
      // Normalize to simple string array format
      const currentServices = (talent.servicesUsed || []).map((s: any) => 
        typeof s === 'string' ? s : (s?.service || s?.name || String(s))
      );
      
      // Avoid duplicates
      if (currentServices.includes(service)) return;

      const newServices = [...currentServices, service];
      
      await supabase
        .from('talents')
        .update({ services_used: newServices })
        .eq('id', talent.id);

      // Update local state
      setTalent(prev => prev ? { ...prev, servicesUsed: newServices } : null);
    } catch (error) {
      console.error('[TalentContext] Error adding service:', error);
    }
  }, [talent?.id, talent?.servicesUsed]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email or password is incorrect.');
      }
      throw error;
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<boolean> => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
        emailRedirectTo: `${window.location.origin}/my-learning`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.code === '23505') {
        throw new Error('This email is already registered.');
      }
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Signup failed');
    }

    // The database trigger will create the talent record
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setTalent(null);
  }, []);

  const value: TalentContextValue = {
    user,
    session,
    isAuthenticated: !!session,
    talent,
    isLoading: isAuthLoading || isTalentLoading,
    isAuthLoading,
    isTalentLoading,
    refreshTalent,
    updateTalent,
    addServiceUsed,
    signIn,
    signUp,
    signOut,
  };

  return (
    <TalentContext.Provider value={value}>
      {children}
    </TalentContext.Provider>
  );
}

export function useTalent() {
  const context = useContext(TalentContext);
  if (context === undefined) {
    throw new Error('useTalent must be used within a TalentProvider');
  }
  return context;
}

// Helper hook to ensure talent is available (for protected routes)
export function useRequiredTalent() {
  const { talent, isLoading, isAuthenticated } = useTalent();
  
  return {
    talent,
    isLoading,
    isAuthenticated,
    hasTalent: !!talent,
  };
}
