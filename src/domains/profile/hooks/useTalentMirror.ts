import { useQuery } from "@tanstack/react-query";
import { learnerTalentMirror } from "@/domains/learning/api/learningApi";

/**
 * GroUp Academy: Psychometric Analytics & Talent Mirror Hub (V5.6.0)
 * CTO Reference: Authoritative analytical sensor pulling profile capability matrices.
 * Architecture: Optimized via TanStack Query v5 to completely protect edge runtime budgets.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface TalentMirrorCourse {
  content_id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  modules: number;
  topics: number;
  avg_mastery: number;
  due_now: number;
  weakest: { topic_tag: string; module_title: string | null; mastery: number }[];
}

export interface TalentMirrorTopic {
  topic_tag: string;
  module_title: string | null;
  course_title: string | null;
  content_id: string;
  mastery: number;
}

export interface TalentMirror {
  talent_id: string;
  summary: { courses: number; modules: number; topics: number; avg_mastery: number | null; due_now: number };
  signal_split: { quiz: number; scenario: number };
  courses: TalentMirrorCourse[];
  weakest_topics: TalentMirrorTopic[];
  strongest_topics: TalentMirrorTopic[];
}

/**
 * Orchestrates the retrieval of deep learner capability matrices and profile statistics.
 */
export function useTalentMirror() {
  const queryResult = useQuery({
    queryKey: ["talent-mirror"],
    // Performance Baseline: 2-minute stability caching for heavy psychometric analytics aggregates
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<TalentMirror> => {
      // HUD: INVOKING_LEARNER_TALENT_MIRROR_EDGE_ENGINE
      const data = await learnerTalentMirror({});

      const raw = (data as any) || {};

      // Defensive Parsing: Map and normalize courses array to secure UI layout stability
      const normalizedCourses: TalentMirrorCourse[] = Array.isArray(raw.courses)
        ? raw.courses.map((c: any) => ({
            content_id: String(c?.content_id ?? ""),
            title: String(c?.title ?? "Curriculum Track"),
            slug: c?.slug ? String(c.slug) : null,
            thumbnail_url: c?.thumbnail_url ? String(c.thumbnail_url) : null,
            modules: Number(c?.modules ?? 0),
            topics: Number(c?.topics ?? 0),
            avg_mastery: Number(c?.avg_mastery ?? 0),
            due_now: Number(c?.due_now ?? 0),
            weakest: Array.isArray(c?.weakest)
              ? c.weakest.map((w: any) => ({
                  topic_tag: String(w?.topic_tag ?? "General Tag"),
                  module_title: w?.module_title ? String(w.module_title) : null,
                  mastery: Number(w?.mastery ?? 0),
                }))
              : [],
          }))
        : [];

      // Helper function for mapping nested topic capability arrays uniformly
      const mapTopicList = (list: any[]): TalentMirrorTopic[] =>
        Array.isArray(list)
          ? list.map((t: any) => ({
              topic_tag: String(t?.topic_tag ?? "General Skill"),
              module_title: t?.module_title ? String(t.module_title) : null,
              course_title: t?.course_title ? String(t.course_title) : null,
              content_id: String(t?.content_id ?? ""),
              mastery: Number(t?.mastery ?? 0),
            }))
          : [];

      // HUD: STRUCTURAL_PAYLOAD_VALIDATION_COMPLETE
      return {
        talent_id: String(raw.talent_id ?? ""),
        summary: {
          courses: Number(raw.summary?.courses ?? 0),
          modules: Number(raw.summary?.modules ?? 0),
          topics: Number(raw.summary?.topics ?? 0),
          avg_mastery:
            raw.summary?.avg_mastery !== undefined && raw.summary?.avg_mastery !== null
              ? Number(raw.summary.avg_mastery)
              : null,
          due_now: Number(raw.summary?.due_now ?? 0),
        },
        signal_split: {
          quiz: Number(raw.signal_split?.quiz ?? 0),
          scenario: Number(raw.signal_split?.scenario ?? 0),
        },
        courses: normalizedCourses,
        weakest_topics: mapTopicList(raw.weakest_topics),
        strongest_topics: mapTopicList(raw.strongest_topics),
      };
    },
  });

  return {
    data: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error instanceof Error ? queryResult.error.message : null,
    refresh: queryResult.refetch,
  };
}
