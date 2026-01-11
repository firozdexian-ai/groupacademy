import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth"; // <--- INTEGRATING THE FOUNDATION
import { Education, Experience, Skill } from "@/types/common";

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
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  profilePhotoUrl: string | null;
  servicesUsed: string[];
  isFeatured: boolean;
  learnerStatus: string;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string | null;
  onboardingStep: number;
}

interface TalentContextValue {
  // Auth state (inherited from useAuth)
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // Talent profile
  talent: TalentProfile | null;

  // Loading states
  isLoading: boolean;
  isTalentLoading: boolean;

  // Actions
  refreshTalent: () => Promise<void>;
  updateTalent: (data: Partial<TalentProfile>) => Promise<boolean>;
  addServiceUsed: (service: string) => Promise<void>;

  // Auth actions (delegated to useAuth)
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
    learnerStatus: row.learner_status || "free_learner",
    studentId: row.student_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    onboardingCompletedAt: row.onboarding_completed_at || null,
    onboardingStep: row.onboarding_step || 0,
  };
}

export function TalentProvider({ children }: { children: React.ReactNode }) {
  // 1. Consume the Auth Context (The Single Source of Truth)
  const { user, session, isLoading: isAuthLoading, signIn, signUp, signOut } = useAuth();

  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [isTalentLoading, setIsTalentLoading] = useState(true);

  // 2. Fetch Talent Profile when User changes
  const fetchTalent = useCallback(async (userId: string) => {
    setIsTalentLoading(true);
    try {
      const { data, error } = await supabase.from("talents").select("*").eq("user_id", userId).maybeSingle();

      if (error) {
        console.error("[TalentContext] Error fetching talent:", error);
        setTalent(null);
      } else if (data) {
        setTalent(mapRowToTalent(data));
      } else {
        // User exists but no talent profile?
        // This is rare but possible if the trigger failed.
        setTalent(null);
      }
    } catch (error) {
      console.error("[TalentContext] Unexpected error:", error);
      setTalent(null);
    } finally {
      setIsTalentLoading(false);
    }
  }, []);

  // 3. React to Auth Changes
  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to settle

    if (user) {
      fetchTalent(user.id);
    } else {
      setTalent(null);
      setIsTalentLoading(false);
    }
  }, [user, isAuthLoading, fetchTalent]);

  // 4. Actions
  const refreshTalent = useCallback(async () => {
    if (user) {
      await fetchTalent(user.id);
    }
  }, [user, fetchTalent]);

  const updateTalent = useCallback(
    async (data: Partial<TalentProfile>): Promise<boolean> => {
      if (!talent?.id) return false;

      try {
        const updateData: any = {};
        // Map helper fields
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
        if (data.onboardingCompletedAt !== undefined) updateData.onboarding_completed_at = data.onboardingCompletedAt;

        const { error } = await supabase.from("talents").update(updateData).eq("id", talent.id);

        if (error) throw error;

        await refreshTalent();
        return true;
      } catch (error) {
        console.error("[TalentContext] Error updating talent:", error);
        return false;
      }
    },
    [talent?.id, refreshTalent],
  );

  const addServiceUsed = useCallback(
    async (service: string) => {
      if (!talent?.id) return;
      try {
        const currentServices = (talent.servicesUsed || []).map((s: any) =>
          typeof s === "string" ? s : s?.service || s?.name || String(s),
        );

        if (currentServices.includes(service)) return;

        const newServices = [...currentServices, service];

        await supabase.from("talents").update({ services_used: newServices }).eq("id", talent.id);

        setTalent((prev) => (prev ? { ...prev, servicesUsed: newServices } : null));
      } catch (error) {
        console.error("[TalentContext] Error adding service:", error);
      }
    },
    [talent?.id, talent?.servicesUsed],
  );

  const value: TalentContextValue = {
    user,
    session,
    isAuthenticated: !!user,
    talent,
    isLoading: isAuthLoading || isTalentLoading,
    isTalentLoading,
    refreshTalent,
    updateTalent,
    addServiceUsed,
    signIn,
    signUp,
    signOut,
  };

  return <TalentContext.Provider value={value}>{children}</TalentContext.Provider>;
}

export function useTalent() {
  const context = useContext(TalentContext);
  if (context === undefined) {
    throw new Error("useTalent must be used within a TalentProvider");
  }
  return context;
}

export function useRequiredTalent() {
  const { talent, isLoading, isAuthenticated } = useTalent();

  return {
    talent,
    isLoading,
    isAuthenticated,
    hasTalent: !!talent,
  };
}
