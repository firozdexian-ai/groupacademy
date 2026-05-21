import React, { createContext, useContext, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTalentRowByUserId, updateTalentById } from "@/domains/talent/repo/talentRepo";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { Education, Experience, Skill } from "@/types/common";
import { toast } from "sonner";

/**
 * GroUp Academy: Core Identity & Profile Orchestrator (V5.6.0)
 * CTO Reference: Authoritative high-performance context provider anchoring talent profiles.
 * Architecture: Optimized via TanStack Query cache nodes to completely eliminate re-render cycles.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
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
  profession: string | null;
  experience_years: number | null;
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
    profession: row.profession || row.custom_profession || null,
    experience_years: row.experience_years || 0,
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
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["talent-profile", user?.id], [user?.id]);

  // --- SENSOR: CORE_PROFILE_QUERY_NODE ---
  const {
    data: talent = null,
    isLoading: isTalentLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!user?.id && !isAuthLoading,
    staleTime: 5 * 60 * 1000, // 5-minute profile structural residency baseline
    queryFn: async (): Promise<TalentProfile | null> => {
      // HUD: EXECUTING_PROFILE_REGISTRY_INGRESS_SELECT
      const data = await getTalentRowByUserId(user!.id);
      return data ? mapRowToTalent(data) : null;
    },
  });

  // --- ACTION: PROFILE_UPDATE_MUTATION ---
  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<TalentProfile>) => {
      if (!talent?.id) throw new Error("NO_ACTIVE_PROFILE");

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
        profession: "profession",
        experience_years: "experience_years",
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

      Object.entries(patch).forEach(([key, value]) => {
        if (mappings[key]) updateData[mappings[key]] = value;
      });

      // HUD: COMMITTING_PROFILE_CHANGES_TRANSACTION
      await updateTalentById(talent.id, updateData);
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<TalentProfile | null>(queryKey);

      // HUD: APPLYING_OPTIMISTIC_CONTEXT_PATCH
      if (previous) {
        qc.setQueryData<TalentProfile | null>(queryKey, {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }
      console.error("[Digital Workforce] ANOMALY: profile update database synchronization failed.", err);
      toast.error("Profile synchronization timeout. Structural changes rolled back.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  // --- ACTION: SERVICE_FOOTPRINT_MUTATION ---
  const serviceMutation = useMutation({
    mutationFn: async (service: string) => {
      if (!talent?.id) return;
      const currentServices = (talent.servicesUsed || []).map((s) => String(s));
      if (currentServices.includes(service)) return;

      const newServices = [...currentServices, service];

      await updateTalentById(talent.id, { services_used: newServices });

      return newServices;
    },
    onMutate: async (service) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<TalentProfile | null>(queryKey);

      if (previous) {
        const currentServices = (previous.servicesUsed || []).map((s) => String(s));
        if (!currentServices.includes(service)) {
          qc.setQueryData<TalentProfile | null>(queryKey, {
            ...previous,
            servicesUsed: [...currentServices, service],
          });
        }
      }
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      console.error("[Digital Workforce] ANOMALY: addServiceUsed transaction failed.", err);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  // --- PHASE: MUTATION_PROXY_INTERFACES ---

  const refreshTalent = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateTalent = React.useCallback(
    async (data: Partial<TalentProfile>): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation],
  );

  const addServiceUsed = React.useCallback(
    async (service: string) => {
      serviceMutation.mutate(service);
    },
    [serviceMutation],
  );

  // Compiled value metrics containing stable, non-render-thrashing dependency paths
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
