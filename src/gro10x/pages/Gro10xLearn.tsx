/**
 * Gro10x Learn — B2B-only learning hub.
 *
 * Three sections:
 *  1. Assigned to me — pushed by the company (with sponsorship pill).
 *  2. B2B catalog — courses tagged is_b2b=true.
 *  3. (Reserved) Company tracks — coming next phase.
 *
 * All course detail / playback re-uses the Talent learning routes
 * (/app/learning/...) — single source of truth.
 */
import { Link } from "react-router-dom";
import { GraduationCap, Sparkles, BookOpen, Building2, Clock, Coins } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { useB2BCatalog, useMyAssignments } from "../hooks/useCourseAssignments";

export default function Gro10xLearn() {
  const catalog = useB2BCatalog();
  const assignments = useMyAssignments();

  return (
    <div className="max-w-md mx-auto pb-24">
      <header className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#33E1E4]" />
            <h1 className="text-xl font-semibold tracking-tight">Learn</h1>
          </div>
          <p className={`text-xs ${GRO10X_MUTED} mt-0.5`}>
            B2B courses for your team. Sponsored or free, all in one place.
          </p>
        </div>
        <Link
          to="/gro10x/learn/ops"
          className="text-[10px] px-2 py-1 rounded-full bg-[#33E1E4]/15 text-[#33E1E4] border border-[#33E1E4]/30"
        >
          Learning Ops
        </Link>
      </header>

      {/* Assigned to me */}
      <section className="px-4 mt-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-300" /> Assigned to me
          </h2>
          {assignments.data && assignments.data.length > 0 && (
            <span className="text-[10px] text-slate-500">{assignments.data.length}</span>
          )}
        </div>

        {assignments.isLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : !assignments.data || assignments.data.length === 0 ? (
          <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
            <p className="text-xs text-slate-400">
              Nothing assigned yet. Ask your admin to push a course to you.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {assignments.data.map((a) => (
              <li key={a.id}>
                <Link
                  to={a.content?.slug ? `/app/learning/${a.content.slug}` : `/app/learning`}
                  className={`block ${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 hover:bg-white/5`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[#0B1220] border border-white/10 grid place-items-center overflow-hidden shrink-0">
                      {a.content?.thumbnail_url || a.content?.cover_image_url ? (
                        <img
                          src={a.content.thumbnail_url ?? a.content.cover_image_url ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.content?.title ?? "Course"}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <SponsorPill mode={a.sponsorship_mode} company={a.company_name ?? "Company"} />
                        {a.due_at && (
                          <span className="inline-flex items-center gap-0.5 text-amber-300">
                            <Clock className="h-2.5 w-2.5" /> due {new Date(a.due_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* B2B catalog */}
      <section className="px-4 mt-6">
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-[#33E1E4]" /> B2B catalog
        </h2>

        {catalog.isLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : !catalog.data || catalog.data.length === 0 ? (
          <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
            <p className="text-xs text-slate-400">
              No B2B courses yet. The catalog is being curated — check back soon.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {catalog.data.map((c) => (
              <li key={c.id}>
                <Link
                  to={c.slug ? `/app/learning/${c.slug}` : `/app/learning`}
                  className={`block ${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 hover:bg-white/5`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[#0B1220] border border-white/10 grid place-items-center overflow-hidden shrink-0">
                      {c.thumbnail_url || c.cover_image_url ? (
                        <img
                          src={c.thumbnail_url ?? c.cover_image_url ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      {c.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        {c.duration_hours && (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {c.duration_hours}h
                          </span>
                        )}
                        {!!c.credit_cost && (
                          <span className="inline-flex items-center gap-0.5 text-[#33E1E4]">
                            <Coins className="h-2.5 w-2.5" /> {c.credit_cost}
                          </span>
                        )}
                        {(c.b2b_audience ?? []).slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/5 capitalize">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Coming soon */}
      <div className={`mx-4 mt-6 ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-slate-400" /> Company tracks · soon
        </p>
        <p className={`text-[11px] ${GRO10X_MUTED} mt-1`}>
          Curated multi-course paths (e.g. "Sales onboarding", "New manager") — assignable to your whole team in one tap.
        </p>
      </div>
    </div>
  );
}

function SponsorPill({ mode, company }: { mode: "free" | "company_credits" | "employee_credits"; company: string }) {
  const map = {
    free: { label: `Free · ${company}`, cls: "bg-emerald-500/15 text-emerald-300" },
    company_credits: { label: `Paid by ${company}`, cls: "bg-[#33E1E4]/15 text-[#33E1E4]" },
    employee_credits: { label: `Top-up · ${company}`, cls: "bg-amber-500/15 text-amber-300" },
  } as const;
  const m = map[mode];
  return <span className={`px-1.5 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}
