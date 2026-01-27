import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
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
  country: string | null;
  countryCode: string | null;
}

interface TalentContextValue {
  // Auth state (inherited from useAuth)
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // Talent profile
  talent: TalentProfile | null;

  // Loading states
  isLoading: boolean; // Global loading (Auth + Talent)
  isTalentLoading: boolean; // Specific talent fetch loading

  // Actions
  refreshTalent: () => Promise<void>;
  updateTalent: (data: Partial<TalentProfile>) => Promise<boolean>;
  addServiceUsed: (service: string) => Promise<void>;

  // Auth actions (delegated to useAuth)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, phone?: string, country?: string, countryCode?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const TalentContext = createContext<TalentContextValue | undefined>(undefined);

// Helper: Map database row to TalentProfile with strict null checks
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
    customProfession: row.custom_profession,
    currentStatus: row.current_status,
    fieldOfStudy: row.field_of_study,
    institution: row.institution,
    // Ensure JSON fields are always arrays
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
    country: row.country || null,
    countryCode: row.country_code || null,
  };
}

export function TalentProvider({ children }: { children: React.ReactNode }) {
  // 1. Consume the Auth Context (The Single Source of Truth)
  const { user, session, isLoading: isAuthLoading, signIn, signUp, signOut } = useAuth();

  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [isTalentLoading, setIsTalentLoading] = useState(true);

  // 2. Fetch Talent Profile logic
  const fetchTalent = useCallback(async (userId: string) => {
    try {
      setIsTalentLoading(true);
      const { data, error } = await supabase.from("talents").select("*").eq("user_id", userId).maybeSingle();

      if (error) {
        console.error("[TalentContext] Error fetching talent:", error);
        setTalent(null);
      } else if (data) {
        setTalent(mapRowToTalent(data));
      } else {
        // User authenticated but no talent profile found
        console.warn("[TalentContext] No talent profile found for user:", userId);
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
    let mounted = true;

    const initTalent = async () => {
      if (isAuthLoading) return;

      if (user) {
        // Only fetch if we don't have talent or if the user changed
        if (!talent || talent.userId !== user.id) {
          if (mounted) await fetchTalent(user.id);
        } else {
          // We already have the correct talent loaded
          if (mounted) setIsTalentLoading(false);
        }
      } else {
        if (mounted) {
          setTalent(null);
          setIsTalentLoading(false);
        }
      }
    };

    initTalent();

    return () => {
      mounted = false;
    };
  }, [user, isAuthLoading, fetchTalent, talent]); // Added talent to deps to check current state

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

        // Helper to map camelCase to snake_case for DB
        const mapField = (jsKey: keyof TalentProfile, dbKey: string) => {
          if (data[jsKey] !== undefined) updateData[dbKey] = data[jsKey];
        };

        mapField("fullName", "full_name");
        mapField("phone", "phone");
        mapField("cvUrl", "cv_url");
        mapField("cvText", "cv_text");
        mapField("cvParsedAt", "cv_parsed_at");
        mapField("professionCategoryId", "profession_category_id");
        mapField("customProfession", "custom_profession");
        mapField("currentStatus", "current_status");
        mapField("fieldOfStudy", "field_of_study");
        mapField("institution", "institution");
        mapField("education", "education");
        mapField("experience", "experience");
        mapField("skills", "skills");
        mapField("projects", "projects");
        mapField("achievements", "achievements");
        mapField("linkedinUrl", "linkedin_url");
        mapField("portfolioUrl", "portfolio_url");
        mapField("profilePhotoUrl", "profile_photo_url");
        mapField("onboardingCompletedAt", "onboarding_completed_at");
        mapField("onboardingStep", "onboarding_step");
        mapField("country", "country");
        mapField("countryCode", "country_code");

        // Optimistic update locally
        setTalent((prev) => (prev ? { ...prev, ...data } : null));

        const { error } = await supabase.from("talents").update(updateData).eq("id", talent.id);

        if (error) {
          // Revert on failure (or just fetch fresh)
          console.error("[TalentContext] Update failed, reverting:", error);
          await refreshTalent();
          throw error;
        }

        // Fetch fresh to ensure server-generated fields (like updated_at) are sync
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

        // Optimistic update
        setTalent((prev) => (prev ? { ...prev, servicesUsed: newServices } : null));

        const { error } = await supabase.from("talents").update({ services_used: newServices }).eq("id", talent.id);

        if (error) {
          console.error("Failed to sync service usage", error);
          // Ideally revert here, but for services used, slight desync is acceptable
        }
      } catch (error) {
        console.error("[TalentContext] Error adding service:", error);
      }
    },
    [talent?.id, talent?.servicesUsed],
  );

  // 5. Memoize the value to prevent unnecessary re-renders in consumers
  const value = useMemo<TalentContextValue>(
    () => ({
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
