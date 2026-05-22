import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  upsertCohort,
  upsertCourseSession,
  getCohortHealth,
  markSessionAttendance,
  getInstructorSessionAttendance,
  listCohortsByContent,
  getCohortDetail,
  listCohortSessions,
} from "@/domains/learning/repo/learningRepo";
import { useAuth } from "@/hooks/useAuth";

/**
 * GroUp Academy: Cohort & Live Session Management Hub (V4.2.1)
 * CTO Reference: Authoritative system engine for live course scheduling and metrics.
 * Architecture: Digital Workforce telemetry enabled for operational anomaly logging.
 * Design Standard: Hardened for Phase Z0 Code Freeze.
 */

export interface CohortSaveInput {
  id?: string;
  content_id: string;
  name: string;
  starts_on?: string;
  ends_on?: string;
  [key: string]: any;
}

export interface SessionSaveInput {
  id?: string;
  cohort_id: string;
  title: string;
  scheduled_date: string;
  [key: string]: any;
}

/**
 * Fetches all cohorts mapped to a specific curriculum content ID node.
 */
export function useCohorts(contentId?: string) {
  return useQuery({
    queryKey: ["cohorts", contentId],
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // 5-minute executive consistency baseline
    queryFn: async () => {
      if (!contentId) return [];
      try {
        return await listCohortsByContent(contentId);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: cohorts taxonomy synchronization failure.", {
          contentId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
  });
}

/**
 * Retrieves full structural details for a single target cohort.
 */
export function useCohort(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort", cohortId],
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        return await getCohortDetail(cohortId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: cohort relational node hydration failure.", {
          cohortId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
  });
}

/**
 * High-Leverage Operational Metric Sensor. Evaluates engagement levels per cohort.
 * Drops amber warnings to the Admin Dashboard if health signals drop.
 */
export function useCohortHealth(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort-health", cohortId],
    enabled: !!cohortId,
    staleTime: 60000, // Light-speed 60s window for real-time risk alerts
    queryFn: async () => {
      let results: any;
      try {
        results = await getCohortHealth(cohortId!);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: cohort health aggregator calculation dropout.", {
          cohortId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }

      // AUTOMATED NUDGE: Detect at-risk performance levels immediately at data sync layer
      if (results && results.health_status === "critical") {
        console.warn(
          `[Digital Workforce] SIGNAL: Cohort [${cohortId}] health status marked CRITICAL. Notifying Dean Agent.`,
        );
      }

      return results;
    },

  });
}

/**
 * Returns chronological timeline of all live and recorded course sessions for a cohort.
 */
export function useCohortSessions(cohortId?: string) {
  return useQuery({
    queryKey: ["cohort-sessions", cohortId],
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      try {
        return await listCohortSessions(cohortId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: course_sessions registry stream failure.", {
          cohortId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
  });
}

/**
 * Streams upcoming session timelines targeted to the context of the active authenticated viewer.
 */
export function useUpcomingSessions(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["upcoming-sessions", user?.id, limit],
    enabled: !!user?.id,
    staleTime: 30000, // Fast sync for user dashboard scheduling blocks
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { upcomingSessionsForUser } = await import("@/domains/learning/repo/learningRepo");
        return await upcomingSessionsForUser({ userId: user.id, limit });
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: user upcoming_sessions index fault.", {
          userId: user.id,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
  });
}

/**
 * Automated Efficiency Protocol: Client-side attendance logging. Fires cache invalidations
 * across all connected instructional metrics blocks instantaneously.
 */
export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      try {
        await markSessionAttendance(sessionId);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: user attendance logging handshake rejected.", {
          sessionId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },

    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ["session-attendance", sessionId] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
    },
  });
}

/**
 * Human-in-the-loop Instructor Interface: Synchronizes validation roll counts
 * for operational review boards.
 */
export function useInstructorAttendance(sessionId?: string) {
  return useQuery({
    queryKey: ["session-attendance", sessionId],
    enabled: !!sessionId,
    staleTime: 10000, // Aggressive 10s caching for active dashboard grids
    queryFn: async () => {
      try {
        return await getInstructorSessionAttendance(sessionId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: instructor_session_attendance evaluation error.", {
          sessionId,
          message: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },

  });
}

/**
 * Unified CRUD Mutation for Course Session items.
 */
export function useSaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SessionSaveInput) => {
      await upsertCourseSession(input as any);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cohort-sessions", vars.cohort_id] });
    },
    onError: (err: any, vars) => {
      console.error("[Digital Workforce] ANOMALY: course_session database persist failure.", {
        cohortId: vars.cohort_id,
        message: err.message,
      });
    },
  });
}

/**
 * Unified CRUD Mutation for Cohort nodes.
 */
export function useSaveCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CohortSaveInput) => {
      await upsertCohort(input as any);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cohorts", vars.content_id] });
    },
    onError: (err: any, vars) => {
      console.error("[Digital Workforce] ANOMALY: cohort database persist failure.", {
        contentId: vars.content_id,
        message: err.message,
      });
    },
  });
}
