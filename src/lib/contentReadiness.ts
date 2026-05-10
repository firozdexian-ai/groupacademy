/**
 * Pure readiness computation for a content/course in admin.
 * Mirrors (but doesn't replace) the DB trigger — used for live UI feedback.
 */
import type { ModuleStats } from "@/components/dashboard/learning/content-widgets/ContentReadinessBadge";

export type CheckSeverity = "pass" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  label: string;
  detail?: string;
  severity: CheckSeverity;
  field?: string; // data-readiness-field anchor
}

export interface ReadinessFormSnapshot {
  title?: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  content_type?: string;
  price?: string | number | null;
  currency?: string | null;
  instructor_name?: string | null;
  event_date?: string | null;
  event_timezone?: string | null;
  event_duration_minutes?: string | number | null;
  max_capacity?: string | number | null;
  venue_name?: string | null;
  venue_address?: string | null;
  whatsapp_group_link?: string | null;
  youtube_url?: string | null;
  profession_line_id?: string | null;
  profession_level_id?: string | null;
}

const isLiveType = (t?: string) =>
  t === "live_webinar" || t === "batch_class" || t === "offline_seminar";

export function computeChecks(
  f: ReadinessFormSnapshot,
  moduleStats: ModuleStats | undefined,
  moduleAudit: Array<{ id: string; reason: string }>,
  sessionCount: number,
): ReadinessCheck[] {
  const out: ReadinessCheck[] = [];
  const t = f.content_type;

  // Universal
  out.push({
    id: "cover",
    label: "Cover image set",
    severity: f.cover_image_url ? "pass" : "fail",
    field: "cover_image",
  });
  out.push({
    id: "title",
    label: "Title present",
    severity: (f.title || "").trim().length >= 4 ? "pass" : "fail",
    field: "title",
  });
  out.push({
    id: "slug",
    label: "URL slug present",
    severity: /^[a-z0-9-]{3,}$/.test(f.slug || "") ? "pass" : "fail",
    field: "slug",
  });
  const desc = (f.description || "").trim();
  out.push({
    id: "desc",
    label: "Description ≥ 200 characters",
    detail: `${desc.length} chars`,
    severity: desc.length >= 200 ? "pass" : desc.length >= 80 ? "warn" : "fail",
    field: "description",
  });

  const priceNum = parseFloat((f.price ?? "").toString());
  out.push({
    id: "price",
    label: "Pricing configured",
    detail: priceNum > 0 ? `${f.currency || "USD"} ${priceNum}` : priceNum === 0 ? "Free" : undefined,
    severity: !isNaN(priceNum) ? "pass" : "warn",
    field: "price",
  });

  out.push({
    id: "category",
    label: "Profession line & level set",
    severity: f.profession_line_id && f.profession_level_id ? "pass" : "warn",
    field: "category",
  });

  // Recorded / free video
  if (t === "recorded_course" || t === "free_video") {
    const count = moduleStats?.module_count ?? 0;
    out.push({
      id: "modules",
      label: "Has at least one module",
      detail: `${count} module${count === 1 ? "" : "s"}`,
      severity: count > 0 ? "pass" : "fail",
    });
    if (t === "recorded_course") {
      const playable = moduleStats?.playable_modules ?? 0;
      const missing = Math.max(0, count - playable);
      out.push({
        id: "playable",
        label: "Every module is playable",
        detail: missing > 0
          ? `${missing} module${missing === 1 ? "" : "s"} missing video or resource`
          : "All modules have media",
        severity: count === 0 ? "fail" : missing === 0 ? "pass" : "fail",
      });
    }
  }

  // Live + batch
  if (t === "live_webinar" || t === "batch_class") {
    out.push({
      id: "event_date",
      label: "Event date set",
      severity: f.event_date ? "pass" : "fail",
      field: "event_date",
    });
    if (f.event_date) {
      const inFuture = new Date(f.event_date).getTime() > Date.now();
      out.push({
        id: "future",
        label: "Event date is in the future",
        severity: inFuture ? "pass" : "warn",
        field: "event_date",
      });
    }
    out.push({
      id: "duration",
      label: "Event duration set",
      severity: parseInt((f.event_duration_minutes ?? "").toString()) > 0 ? "pass" : "warn",
      field: "event_duration",
    });
    out.push({
      id: "instructor",
      label: "Instructor assigned",
      severity: (f.instructor_name || "").trim() ? "pass" : "fail",
      field: "instructor_name",
    });
    out.push({
      id: "stream",
      label: "Meeting or stream link",
      severity: (f.whatsapp_group_link || f.youtube_url) ? "pass" : "warn",
      field: "youtube_url",
    });
    if (t === "batch_class") {
      out.push({
        id: "sessions",
        label: "Has scheduled sessions",
        detail: `${sessionCount} session${sessionCount === 1 ? "" : "s"}`,
        severity: sessionCount > 0 ? "pass" : "fail",
      });
    }
  }

  // Offline seminar
  if (t === "offline_seminar") {
    out.push({
      id: "event_date",
      label: "Event date set",
      severity: f.event_date ? "pass" : "fail",
      field: "event_date",
    });
    out.push({
      id: "venue",
      label: "Venue & address set",
      severity: f.venue_name && f.venue_address ? "pass" : "fail",
      field: "venue_name",
    });
    out.push({
      id: "capacity",
      label: "Capacity defined",
      severity: parseInt((f.max_capacity ?? "").toString()) > 0 ? "pass" : "warn",
      field: "max_capacity",
    });
  }

  return out;
}

export function readinessSummary(checks: ReadinessCheck[]) {
  const total = checks.length;
  const passed = checks.filter((c) => c.severity === "pass").length;
  const blockers = checks.filter((c) => c.severity === "fail").length;
  const warnings = checks.filter((c) => c.severity === "warn").length;
  const pct = total ? Math.round((passed / total) * 100) : 0;
  return { total, passed, blockers, warnings, pct };
}
