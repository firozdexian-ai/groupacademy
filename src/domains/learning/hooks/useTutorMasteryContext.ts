import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getTutorMasteryContext } from "@/domains/learning/repo/learningRepo";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: AI Tutor Context Synchronizer (V5.6.0)
 * CTO Reference: Authoritative telemetry hook feeding psychometric indicators to LLM prompt runtimes.
 * Architecture: Reference-isolated queries preventing accidental background refetch waterfalls.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface WeakTopicContext {
  tag: string;
  mastery: number;
  attempts: number;
}

export interface StrongTopicContext {
  tag: string;
  mastery: number;
}

export interface CredentialContext {
  tag: string;
  level: string;
}

export interface LastScenarioContext {
  tag: string;
  mastery: number;
  when: string;
}

export interface TutorMasteryContext {
  weak_topics: WeakTopicContext[];
  strong_topics: StrongTopicContext[];
  due_for_review_count: number;
  credentials: CredentialContext[];
  last_scenario: LastScenarioContext | null;
}

interface UseTutorMasteryContextOptions {
  enabled?: boolean;
  moduleId?: string;
  contentId?: string;
}

/**
 * Retrieves a reference-stable psychometric context block to anchor conversational AI personalization layers.
 * RPC: get_tutor_mastery_context
 */
export function useTutorMasteryContext(opts?: UseTutorMasteryContextOptions) {
  const { talent } = useTalent();
  const talentId = talent?.id;

  // Extract option properties down to stable primitive layers to protect against structural reference changes
  const isEnabled = opts?.enabled !== false;
  const moduleIdParam = opts?.moduleId || null;
  const contentIdParam = opts?.contentId || null;

  // HUD: SECURE_REFERENCE_ISOLATED_QUERY_KEY
  const queryKey = useMemo(
    () => ["tutor-mastery-ctx", talentId, moduleIdParam, contentIdParam, isEnabled],
    [talentId, moduleIdParam, contentIdParam, isEnabled],
  );

  return useQuery<TutorMasteryContext | null, Error>({
    queryKey,
    enabled: !!talentId && isEnabled,
    // Performance Baseline: 60-second stability caching window protecting PostgreSQL computing limits
    staleTime: 60 * 1000,
    queryFn: async (): Promise<TutorMasteryContext | null> => {
      if (!talentId) return null;

      // HUD: EXECUTING_AI_TUTOR_CONTEXT_RPC_INGRESS
      let data: any;
      try {
        data = await getTutorMasteryContext({
          talentId,
          moduleId: moduleIdParam,
          contentId: contentIdParam,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_tutor_mastery_context RPC lookup failed.", {
          talentId,
          moduleId: moduleIdParam,
          contentId: contentIdParam,
          message: error?.message,
        });
        throw error;
      }


      const raw = (data as any) || {};

      // Defensive Parsing: Map and normalize weak topic capability context maps safely
      const normalizedWeak: WeakTopicContext[] = Array.isArray(raw.weak_topics)
        ? raw.weak_topics.map((t: any) => ({
            tag: String(t?.tag ?? "General Tag"),
            mastery: Number(t?.mastery ?? 0),
            attempts: Number(t?.attempts ?? 1),
          }))
        : [];

      // Defensive Parsing: Map and normalize strong topic capability context maps safely
      const normalizedStrong: StrongTopicContext[] = Array.isArray(raw.strong_topics)
        ? raw.strong_topics.map((t: any) => ({
            tag: String(t?.tag ?? "General Tag"),
            mastery: Number(t?.mastery ?? 0),
          }))
        : [];

      // Defensive Parsing: Map and normalize verifiable micro-badge arrays uniformly
      const normalizedCredentials: CredentialContext[] = Array.isArray(raw.credentials)
        ? raw.credentials.map((c: any) => ({
            tag: String(c?.tag ?? "Verified Competency"),
            level: String(c?.level ?? "foundational"),
          }))
        : [];

      // Defensive Parsing: Map and structure recent scenario interactions safely
      const normalizedLastScenario: LastScenarioContext | null = raw.last_scenario
        ? {
            tag: String(raw.last_scenario.tag ?? "Immersive Mission"),
            mastery: Number(raw.last_scenario.mastery ?? 0),
            when: String(raw.last_scenario.when ?? new Date().toISOString()),
          }
        : null;

      // HUD: DATA_NORMALIZATION_VALIDATION_COMPLETED
      return {
        weak_topics: normalizedWeak,
        strong_topics: normalizedStrong,
        due_for_review_count: Number(raw.due_for_review_count ?? 0),
        credentials: normalizedCredentials,
        last_scenario: normalizedLastScenario,
      };
    },
  });
}
