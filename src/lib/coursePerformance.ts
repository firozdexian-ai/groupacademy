import { useEffect, useState } from "react";
import {
  listEnrollmentsForContent,
  listCourseModulesForContent,
  listQuizAttemptsForModules,
  listScenarioRunsForModules,
  listModuleQuizPoolForModules,
  listModuleScenarioPoolForModules,
} from "@/domains/learning/repo/learningRepo";
import { listTalentNamesByIds } from "@/domains/talent/repo/talentRepo";

export interface ModuleStat {
  id: string;
  title: string;
  display_order: number;
  reachedCount: number;
  dropoffPct: number;
  quizAttempts: number;
  quizAvgScore: number | null;
  scenarioRuns: number;
  scenarioAvgScore: number | null;
  quizPoolSize: number;
  quizPoolAvgQuality: number | null;
  quizPoolServed: number;
  quizPoolLowQuality: number;
  scenarioPoolSize: number;
  scenarioPoolAvgQuality: number | null;
  scenarioPoolServed: number;
  scenarioPoolLowQuality: number;
}

export interface CoursePerformance {
  totalEnrollments: number;
  activeLast7d: number;
  completionRate: number;
  avgProgress: number;
  funnel: { label: string; value: number }[];
  modules: ModuleStat[];
  recent: { kind: "enroll" | "quiz" | "scenario"; at: string; talentName: string; detail: string }[];
}

const QUIZ_TARGET = 20;
const SCENARIO_TARGET = 10;

export function poolStatusColor(size: number, target: number): "green" | "amber" | "red" {
  if (size >= target) return "green";
  if (size >= Math.floor(target / 2)) return "amber";
  return "red";
}

export const QUIZ_POOL_TARGET = QUIZ_TARGET;
export const SCENARIO_POOL_TARGET = SCENARIO_TARGET;

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function useCoursePerformance(contentId: string | undefined) {
  const [data, setData] = useState<CoursePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [enrollments, modules] = await Promise.all([
          listEnrollmentsForContent(contentId),
          listCourseModulesForContent(contentId),
        ]);
        const moduleIds = modules.map((m) => m.id);

        const [quizAttempts, scenarioRuns, quizPool, scenarioPool] = await Promise.all([
          listQuizAttemptsForModules(moduleIds),
          listScenarioRunsForModules(moduleIds),
          listModuleQuizPoolForModules(moduleIds),
          listModuleScenarioPoolForModules(moduleIds),
        ]);

        // KPIs
        const totalEnrollments = enrollments.length;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const activeLast7d = enrollments.filter(
          (e) => e.last_accessed_at && new Date(e.last_accessed_at).getTime() >= sevenDaysAgo,
        ).length;
        const completed = enrollments.filter((e) => e.status === "completed").length;
        const completionRate = totalEnrollments ? completed / totalEnrollments : 0;
        const avgProgress = totalEnrollments
          ? enrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / totalEnrollments
          : 0;

        // Funnel
        const started = enrollments.filter((e) => (e.progress ?? 0) > 0).length;
        const mid = enrollments.filter((e) => (e.progress ?? 0) >= 50).length;
        const funnel = [
          { label: "Enrolled", value: totalEnrollments },
          { label: "Started", value: started },
          { label: "Mid (≥50%)", value: mid },
          { label: "Completed", value: completed },
        ];

        // Module stats
        const moduleStats: ModuleStat[] = modules.map((m, idx) => {
          const orderIdx = idx;
          // Reached: enrollments whose progress passed this module's relative position
          const moduleThreshold = modules.length ? (orderIdx / modules.length) * 100 : 0;
          const reachedCount = enrollments.filter(
            (e) => (e.progress ?? 0) >= moduleThreshold || e.current_module_id === m.id,
          ).length;
          const prevReached =
            idx === 0
              ? totalEnrollments
              : enrollments.filter(
                  (e) => (e.progress ?? 0) >= ((idx - 1) / modules.length) * 100,
                ).length;
          const dropoffPct = prevReached ? Math.max(0, 1 - reachedCount / prevReached) : 0;

          const qa = quizAttempts.filter((q) => q.module_id === m.id);
          const sr = scenarioRuns.filter((s) => s.module_id === m.id);
          const qp = quizPool.filter((q) => q.module_id === m.id);
          const sp = scenarioPool.filter((s) => s.module_id === m.id);

          const scenarioScores = sr
            .map((s) => {
              const ev = s.evaluation;
              if (!ev) return null;
              const v = typeof ev === "object" ? Number((ev as any).score) : null;
              return Number.isFinite(v) ? v : null;
            })
            .filter((v): v is number => v !== null);

          return {
            id: m.id,
            title: m.title,
            display_order: m.display_order ?? idx,
            reachedCount,
            dropoffPct,
            quizAttempts: qa.length,
            quizAvgScore: avg(qa.map((q) => Number(q.score)).filter((n) => Number.isFinite(n))),
            scenarioRuns: sr.length,
            scenarioAvgScore: avg(scenarioScores),
            quizPoolSize: qp.length,
            quizPoolAvgQuality: avg(qp.map((q) => Number(q.quality_score) || 0)),
            quizPoolServed: qp.reduce((s, q) => s + (Number(q.times_served) || 0), 0),
            quizPoolLowQuality: qp.filter((q) => Number(q.quality_score) < 0).length,
            scenarioPoolSize: sp.length,
            scenarioPoolAvgQuality: avg(sp.map((s) => Number(s.quality_score) || 0)),
            scenarioPoolServed: sp.reduce((acc, s) => acc + (Number(s.times_served) || 0), 0),
            scenarioPoolLowQuality: sp.filter((s) => Number(s.quality_score) < 0).length,
          };
        });

        // Recent activity (last 10) — fetch talent names lazily
        type RecentRaw = { kind: "enroll" | "quiz" | "scenario"; at: string; talent_id: string; detail: string };
        const recentRaw: RecentRaw[] = [
          ...enrollments
            .filter((e) => e.enrolled_at)
            .map((e) => ({
              kind: "enroll" as const,
              at: e.enrolled_at as string,
              talent_id: e.talent_id ?? "",
              detail: "Enrolled",
            })),
          ...quizAttempts.map((q) => ({
            kind: "quiz" as const,
            at: q.created_at,
            talent_id: q.talent_id,
            detail: `Quiz · ${q.score ?? 0}%`,
          })),
          ...scenarioRuns.map((s) => ({
            kind: "scenario" as const,
            at: s.created_at,
            talent_id: s.talent_id,
            detail: "Scenario run",
          })),
        ]
          .filter((r) => r.at && r.talent_id)
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 10);

        const talentIds = Array.from(new Set(recentRaw.map((r) => r.talent_id)));
        let nameMap = new Map<string, string>();
        if (talentIds.length) {
          const talents = await listTalentNamesByIds(talentIds);
          talents.forEach((t) => nameMap.set(t.id, t.full_name ?? "Unknown"));
        }

        const recent = recentRaw.map((r) => ({
          kind: r.kind,
          at: r.at,
          talentName: nameMap.get(r.talent_id) ?? "Talent",
          detail: r.detail,
        }));

        if (cancelled) return;
        setData({
          totalEnrollments,
          activeLast7d,
          completionRate,
          avgProgress,
          funnel,
          modules: moduleStats,
          recent,
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load performance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  return { data, loading, error };
}

export function modulesToCsv(modules: ModuleStat[]): string {
  const headers = [
    "order",
    "title",
    "reached",
    "dropoff_pct",
    "quiz_attempts",
    "quiz_avg_score",
    "scenario_runs",
    "scenario_avg_score",
    "quiz_pool_size",
    "quiz_pool_avg_quality",
    "quiz_pool_served",
    "scenario_pool_size",
    "scenario_pool_avg_quality",
    "scenario_pool_served",
  ];
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = modules.map((m) =>
    [
      m.display_order,
      m.title,
      m.reachedCount,
      (m.dropoffPct * 100).toFixed(1),
      m.quizAttempts,
      m.quizAvgScore?.toFixed(1) ?? "",
      m.scenarioRuns,
      m.scenarioAvgScore?.toFixed(1) ?? "",
      m.quizPoolSize,
      m.quizPoolAvgQuality?.toFixed(2) ?? "",
      m.quizPoolServed,
      m.scenarioPoolSize,
      m.scenarioPoolAvgQuality?.toFixed(2) ?? "",
      m.scenarioPoolServed,
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
