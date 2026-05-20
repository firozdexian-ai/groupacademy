import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Pedagogical Telemetry Sentinel (V5.6.0)
 * CTO Reference: Unified analytical controller tracking gamified metrics and streaks.
 * Architecture: Digital Workforce enabled - streams lookup errors directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Variant).
 */

export interface EnrollmentContent {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  content_type: string;
  modules_count: number | null;
  estimated_hours: number | null;
}

export interface CourseModule {
  id: string;
  title: string;
  display_order: number | null;
  estimated_time_minutes: number | null;
}

export interface ActiveEnrollment {
  id: string;
  status: string;
  progress: number;
  current_module_id: string | null;
  last_accessed_at: string | null;
  content: EnrollmentContent | null;
  modules: CourseModule[];
}

export interface LearningActivity {
  activity_date: string;
  minutes_learned: number;
  modules_completed: number;
  stages_completed: number;
}

export interface LearningStats {
  currentStreak: number;
  totalHoursLearned: number;
  coursesCompleted: number;
  modulesCompleted: number;
  activeEnrollments: ActiveEnrollment[];
  isLoading: boolean;
}

/**
 * HUD: STREAK_ALGORITHM
 * Logic: Analyzes activity records to compile consecutive daily participation streaks.
 * Hardened to prevent client timezone desynchronization.
 */
function calculateStreak(activities: LearningActivity[]): number {
  if (!activities.length) return 0;

  // Deduplicate and normalize timestamps to absolute calendar days (Midnight Boundary)
  const uniqueDates = new Set<string>();
  activities.forEach((a) => {
    if (a.activity_date) {
      const dateStr = a.activity_date.split("T")[0]; // Fast ISO-date isolate
      uniqueDates.add(dateStr);
    }
  });

  const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Establish regional boundary markers relative to local user context (Dhaka Baseline)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // If the user hasn't learned today or yesterday, the consecutive streak has broken
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(sortedDates[0]);

  for (const dateStr of sortedDates) {
    const currentActDate = new Date(dateStr);
    const diffTime = expectedDate.getTime() - currentActDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      streak++;
      // Set target parameters back precisely by 1 day
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays > 0) {
      break; // Gap encountered: consecutive chain broken
    }
  }

  return streak;
}

export function useLearningStats(): LearningStats {
  const { talent } = useTalent();

  // --------------------------------------------------------
  // PHASE 1: Combined Relational Enrollment Hydration
  // Optimizes network pipeline by resolving N+1 database hits.
  // --------------------------------------------------------
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["learning-stats-enrollments", talent?.id],
    enabled: !!talent?.id,
    staleTime: 45000, // 45s analytics hydration window
    queryFn: async (): Promise<ActiveEnrollment[]> => {
      // HUD: CORE_SINGLE_ROUNDTRIP_RELATIONAL_SELECT
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          progress,
          current_module_id,
          last_accessed_at,
          content:content_id (
            id,
            title,
            slug,
            thumbnail_url,
            content_type,
            modules_count,
            estimated_hours,
            modules:course_modules (
              id,
              title,
              display_order,
              estimated_time_minutes
            )
          )
        `,
        )
        .eq("talent_id", talent!.id)
        .in("status", ["active", "pending_payment"])
        .order("last_accessed_at", { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) {
        console.error("[Digital Workforce] ANOMALY: Failed to compile unified enrollment analytics schema.", error);
        throw error;
      }

      // Format nested structure to conform strictly to target frontend interface definitions
      return (data || []).map((row: any) => {
        const contentRaw = row.content;
        let mappedModules: CourseModule[] = [];

        if (contentRaw && Array.isArray(contentRaw.modules)) {
          mappedModules = [...contentRaw.modules].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        }

        return {
          id: row.id,
          status: row.status,
          progress: Number(row.progress || 0),
          current_module_id: row.current_module_id,
          last_accessed_at: row.last_accessed_at,
          content: contentRaw
            ? {
                id: contentRaw.id,
                title: contentRaw.title,
                slug: contentRaw.slug,
                thumbnail_url: contentRaw.thumbnail_url,
                content_type: contentRaw.content_type,
                modules_count: contentRaw.modules_count,
                estimated_hours: contentRaw.estimated_hours,
              }
            : null,
          modules: mappedModules,
        };
      });
    },
  });

  // --------------------------------------------------------
  // PHASE 2: Graduation & Completed Counter Metrics
  // --------------------------------------------------------
  const { data: completedCount = 0 } = useQuery({
    queryKey: ["learning-stats-completed", talent?.id],
    enabled: !!talent?.id,
    staleTime: 60000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", talent!.id)
        .eq("status", "completed");

      if (error) {
        console.error("[Digital Workforce] ANOMALY: Completed courses aggregation check failed.", error);
        throw error;
      }
      return count || 0;
    },
  });

  // --------------------------------------------------------
  // PHASE 3: Activity Tracking History Ledgers
  // --------------------------------------------------------
  const { data: activities = [] } = useQuery({
    queryKey: ["learning-activity", talent?.id],
    enabled: !!talent?.id,
    staleTime: 30000,
    queryFn: async (): Promise<LearningActivity[]> => {
      const { data, error } = await supabase
        .from("learning_activity")
        .select("activity_date, minutes_learned, modules_completed, stages_completed")
        .eq("talent_id", talent!.id)
        .order("activity_date", { ascending: false })
        .limit(30);

      if (error) {
        console.error("[Digital Workforce] ANOMALY: Learning activity ledger fetch dropped.", error);
        throw error;
      }
      return data as LearningActivity[];
    },
  });

  // --------------------------------------------------------
  // HUD: METRIC COMPILATION SUMMARY PACK
  // --------------------------------------------------------
  const currentStreak = calculateStreak(activities);
  const totalMinutes = activities.reduce((sum, act) => sum + (act.minutes_learned || 0), 0);
  const totalHoursLearned = totalMinutes / 60;
  const modulesCompleted = activities.reduce((sum, act) => sum + (act.modules_completed || 0), 0);

  return {
    currentStreak,
    totalHoursLearned: Math.round(totalHoursLearned * 10) / 10,
    coursesCompleted: completedCount,
    modulesCompleted,
    activeEnrollments: enrollmentsData || [],
    isLoading: enrollmentsLoading,
  };
}
