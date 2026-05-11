import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { Education, Experience, Skill } from "@/types/common";

/**
 * GroUp Academy: Talent Context Node
 * CTO Audit: Expanded interface to capture 'profession' and 'experience_years' to perfectly ground AI logic.
 */

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
  professionalRoleId: string | null;
  customProfession: string | null;
  profession: string | null; // CTO FIX: Explicitly added for AI context
  experience_years: number | null; // CTO FIX: Explicitly added for AI context
  currentStatus: string | null;
  primaryGoal: string | null;
  cvFingerprint: string | null;
  isSuspectedDuplicate: boolean;
  fieldOfStudy: string | null;
  institution: string | null;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  languages: Array<{ language: string; proficiency: string }>;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  profilePhotoUrl: string | null;
  coverImageUrl: string | null;
  servicesUsed: string[];
  isFeatured: boolean;
  learnerStatus: string;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string | null;
  onboardingStep: number;
  country: string | null;
  countryCode: string | null;
  whatsappBonusClaimedAt: string | null;
  // Reference FKs (added for the upgraded routing logic)
  institutionId: string | null;
  careerStageId: string | null;
  schoolId: string | null;
  countryId: string | null;
}

interface TalentContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  talent: TalentProfile | null;
  isLoading: boolean;
  isTalentLoading: boolean;
  refreshTalent: () => Promise<void>;
  updateTalent: (data: Partial<TalentProfile>) => Promise<boolean>;
  addServiceUsed: (service: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
    country?: string,
    countryCode?: string,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const TalentContext = createContext<TalentContextValue | undefined>(undefined);

function mapRowToTalent(row: any): TalentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email || "",
    fullName: row.full_name || "",
    phone: row.phone,
    cvUrl: row.cv_url,
    cvText: row.cv_text,
    cvParsedAt: row.cv_parsed_at,
    professionCategoryId: row.profession_category_id,
    professionalRoleId: row.professional_role_id,
    customProfession: row.custom_profession,
    profession: row.profession || row.custom_profession || null, // CTO FIX: Mapping explicit profession
    experience_years: row.experience_years || 0, // CTO FIX: Mapping explicit experience
    currentStatus: row.current_status,
    primaryGoal: row.primary_goal || null,
    cvFingerprint: row.cv_fingerprint || null,
    isSuspectedDuplicate: row.is_suspected_duplicate || false,
    fieldOfStudy: row.field_of_study,
    institution: row.institution,
    education: Array.isArray(row.education) ? row.education : [],
    experience: Array.isArray(row.experience) ? row.experience : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    projects: Array.isArray(row.projects) ? row.projects : [],
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    profilePhotoUrl: row.profile_photo_url,
    coverImageUrl: row.cover_image_url || null,
    servicesUsed: Array.isArray(row.services_used) ? row.services_used : [],
    isFeatured: row.is_featured || false,
    learnerStatus: row.learner_status || "free_learner",
    studentId: row.student_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    onboardingCompletedAt: row.onboarding_completed_at || null,
    onboardingStep: row.onboarding_step || 0,
    country: row.country || null,
    countryCode: row.country_code || null,
    whatsappBonusClaimedAt: row.whatsapp_bonus_claimed_at || null,
    institutionId: row.institution_id || null,
    careerStageId: row.career_stage_id || null,
    schoolId: row.school_id || null,
    countryId: row.country_id || null,
  };
}

export function TalentProvider({ children }: { children: React.ReactNode }) {
  const { user, session, isLoading: isAuthLoading, signIn, signUp, signOut } = useAuth();
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [isTalentLoading, setIsTalentLoading] = useState(true);
  const fetchRequestRef = useRef<string | null>(null);

  const fetchTalent = useCallback(async (userId: string) => {
    fetchRequestRef.current = userId;
    try {
      setIsTalentLoading(true);
      const { data, error } = await supabase.from("talents").select("*").eq("user_id", userId).maybeSingle();

      // Only update state if this is still the current user's request
      if (fetchRequestRef.current !== userId) return;

      if (error) {
        console.error("[TalentContext] Fetch error:", error);
        setTalent(null);
      } else {
        setTalent(data ? mapRowToTalent(data) : null);
      }
    } catch (error) {
      console.error("[TalentContext] Unexpected error:", error);
      setTalent(null);
    } finally {
      if (fetchRequestRef.current === userId) setIsTalentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (user) {
      if (!talent || talent.userId !== user.id) {
        fetchTalent(user.id);
      } else {
        setIsTalentLoading(false);
      }
    } else {
      fetchRequestRef.current = null;
      setTalent(null);
      setIsTalentLoading(false);
    }
  }, [user, isAuthLoading, fetchTalent]);

  const refreshTalent = useCallback(async () => {
    if (user) await fetchTalent(user.id);
  }, [user, fetchTalent]);

  const updateTalent = useCallback(
    async (data: Partial<TalentProfile>): Promise<boolean> => {
      if (!talent?.id) return false;

      try {
        const updateData: any = {};
        const mappings: Record<string, string> = {
          fullName: "full_name",
          phone: "phone",
          cvUrl: "cv_url",
          cvText: "cv_text",
          cvParsedAt: "cv_parsed_at",
          professionCategoryId: "profession_category_id",
          professionalRoleId: "professional_role_id",
          customProfession: "custom_profession",
          primaryGoal: "primary_goal",
          cvFingerprint: "cv_fingerprint",
          isSuspectedDuplicate: "is_suspected_duplicate",
          profession: "profession", // CTO FIX: Added to update payload
          experience_years: "experience_years", // CTO FIX: Added to update payload
          currentStatus: "current_status",
          fieldOfStudy: "field_of_study",
          institution: "institution",
          education: "education",
          experience: "experience",
          skills: "skills",
          projects: "projects",
          achievements: "achievements",
          languages: "languages",
          linkedinUrl: "linkedin_url",
          portfolioUrl: "portfolio_url",
          profilePhotoUrl: "profile_photo_url",
          coverImageUrl: "cover_image_url",
          onboardingCompletedAt: "onboarding_completed_at",
          onboardingStep: "onboarding_step",
          country: "country",
          countryCode: "country_code",
          whatsappBonusClaimedAt: "whatsapp_bonus_claimed_at",
        };

        Object.entries(data).forEach(([key, value]) => {
          if (mappings[key]) updateData[mappings[key]] = value;
        });

        // Optimistic update
        const previousTalent = talent;
        setTalent((prev) => (prev ? { ...prev, ...data } : null));

        const { error } = await supabase.from("talents").update(updateData).eq("id", talent.id);

        if (error) {
          setTalent(previousTalent);
          throw error;
        }

        return true;
      } catch (error) {
        console.error("[TalentContext] Update failed:", error);
        return false;
      }
    },
    [talent],
  );

  const addServiceUsed = useCallback(
    async (service: string) => {
      if (!talent?.id) return;
      const currentServices = (talent.servicesUsed || []).map((s) => (typeof s === "string" ? s : String(s)));
      if (currentServices.includes(service)) return;

      const newServices = [...currentServices, service];
      setTalent((prev) => (prev ? { ...prev, servicesUsed: newServices } : null));
      await supabase.from("talents").update({ services_used: newServices }).eq("id", talent.id);
    },
    [talent],
  );

  const value = useMemo<TalentContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      talent,
      isLoading: isAuthLoading || (!!user && isTalentLoading),
      isTalentLoading,
      refreshTalent,
      updateTalent,
      addServiceUsed,
      signIn,
      signUp,
      signOut,
    }),
    [
      user,
      session,
      talent,
      isAuthLoading,
      isTalentLoading,
      refreshTalent,
      updateTalent,
      addServiceUsed,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <TalentContext.Provider value={value}>{children}</TalentContext.Provider>;
}

export function useTalent() {
  const context = useContext(TalentContext);
  if (context === undefined) throw new Error("useTalent must be used within a TalentProvider");
  return context;
}

export function useRequiredTalent() {
  const { talent, isLoading, isAuthenticated } = useTalent();
  return { talent, isLoading, isAuthenticated, hasTalent: !!talent };
}
