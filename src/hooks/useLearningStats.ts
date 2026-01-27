import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "./useTalent";

interface EnrollmentContent {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  content_type: string;
  modules_count: number | null;
  estimated_hours: number | null;
}

interface CourseModule {
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
  modules?: CourseModule[];
}

interface LearningActivity {
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

function calculateStreak(activities: LearningActivity[]): number {
  if (!activities.length) return 0;
  
  // Sort by date descending
  const sorted = [...activities].sort((a, b) => 
    new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = today;
  
  for (const activity of sorted) {
    const activityDate = new Date(activity.activity_date);
    activityDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      // Activity is today or yesterday (consecutive)
      streak++;
      currentDate = activityDate;
    } else if (diffDays > 1) {
      // Gap in activity, streak broken
      break;
    }
  }
  
  return streak;
}

export function useLearningStats(): LearningStats {
  const { talent } = useTalent();

  // Fetch active enrollments with content and modules
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["learning-stats-enrollments", talent?.id],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select(`
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
            estimated_hours
          )
        `)
        .eq("talent_id", talent!.id)
        .in("status", ["active", "pending_payment"])
        .order("last_accessed_at", { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch modules for each enrollment
      const enrichedEnrollments = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          if (!enrollment.content) return enrollment as unknown as ActiveEnrollment;
          
          const contentData = enrollment.content as unknown as EnrollmentContent;
          const { data: modules } = await supabase
            .from("course_modules")
            .select("id, title, display_order, estimated_time_minutes")
            .eq("content_id", contentData.id)
            .order("display_order");
          
          return {
            ...enrollment,
            content: contentData,
            modules: modules || [],
          } as ActiveEnrollment;
        })
      );
      
      return enrichedEnrollments;
    },
    enabled: !!talent?.id,
  });

  // Fetch completed courses count
  const { data: completedCount = 0 } = useQuery({
    queryKey: ["learning-stats-completed", talent?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", talent!.id)
        .eq("status", "completed");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!talent?.id,
  });

  // Fetch learning activity for streak calculation
  const { data: activities = [] } = useQuery({
    queryKey: ["learning-activity", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_activity")
        .select("activity_date, minutes_learned, modules_completed, stages_completed")
        .eq("talent_id", talent!.id)
        .order("activity_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as LearningActivity[];
    },
    enabled: !!talent?.id,
  });

  const currentStreak = calculateStreak(activities);
  const totalHoursLearned = activities.reduce((sum, a) => sum + (a.minutes_learned || 0), 0) / 60;
  const modulesCompleted = activities.reduce((sum, a) => sum + (a.modules_completed || 0), 0);

  return {
    currentStreak,
    totalHoursLearned: Math.round(totalHoursLearned * 10) / 10,
    coursesCompleted: completedCount,
    modulesCompleted,
    activeEnrollments: enrollmentsData || [],
    isLoading: enrollmentsLoading,
  };
}
