import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { Briefcase, Loader2, Pause, Play, X, Plus, Users } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  deadline: string | null;
  applicant_count?: number;
}

export default function Gro10xJobsList() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data: m } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    const cid = m?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("jobs")
      .select("id, title, location, is_active, created_at, deadline")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as Job[];

    // Fetch applicant counts in one query
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const { data: counts } = await supabase
        .from("job_applications")
        .select("job_id")
        .in("job_id", ids);
      const map = new Map<string, number>();
      (counts ?? []).forEach((c: any) => {
        map.set(c.job_id, (map.get(c.job_id) ?? 0) + 1);
      });
      rows.forEach((r) => (r.applicant_count = map.get(r.id) ?? 0));
    }

    setJobs(rows);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (job: Job) => {
    setBusy(job.id);
    try {
      const tool = job.is_active ? "pause_job" : "publish_job";
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: tool, args: { job_id: job.id } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Failed");
        return;
      }
      toast.success(job.is_active ? "Paused" : "Published");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const closeJob = async (job: Job) => {
    if (!confirm(`Close "${job.title}"? It will stop accepting applications.`)) return;
    setBusy(job.id);
    try {
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: "close_job", args: { job_id: job.id } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Failed");
        return;
      }
      toast.success("Closed");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const visible = jobs.filter((j) => {
    if (filter === "active") return j.is_active;
    if (filter === "draft") return !j.is_active;
    return true;
  });

  if (!companyId && !loading) {
    return (
      <div className="px-4 py-10 text-center">
        <Briefcase className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">Set up your workspace first.</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Filter chips + new job CTA */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>
          Live
        </FilterChip>
        <FilterChip active={filter === "draft"} onClick={() => setFilter("draft")}>
          Draft
        </FilterChip>
        <Link
          to="/gro10x/c/recruiter"
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#33E1E4] text-[#06121A] px-3 py-1.5 text-xs font-semibold"
        >
          <Plus className="h-3 w-3" /> New
        </Link>
      </div>

      {loading && (
        <div className="px-4 py-6 text-center text-sm text-slate-400 inline-flex items-center gap-2 w-full justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="px-4 py-10 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-slate-500 mb-3" />
          <p className="text-sm text-slate-400 mb-3">No jobs yet.</p>
          <Link
            to="/gro10x/c/recruiter"
            className="inline-flex items-center gap-1 rounded-full bg-[#33E1E4] text-[#06121A] px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" /> Ask Recruiter to draft one
          </Link>
        </div>
      )}

      <ul className="px-4 space-y-2">
        {visible.map((j) => (
          <li
            key={j.id}
            className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                      j.is_active
                        ? "bg-[#10D576]/15 text-[#10D576]"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {j.is_active ? "Live" : "Draft"}
                  </span>
                </div>
                <p className={`text-[11px] ${GRO10X_MUTED} truncate mt-0.5`}>
                  {j.location ?? "Remote"} ·{" "}
                  {new Date(j.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Link
                to={`/gro10x/work/jobs/${j.id}/applicants`}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#33E1E4]/10 text-[#33E1E4] border border-[#33E1E4]/20"
              >
                <Users className="h-3 w-3" />
                {j.applicant_count ?? 0} applicant
                {(j.applicant_count ?? 0) === 1 ? "" : "s"}
              </Link>

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => toggleActive(j)}
                  disabled={busy === j.id}
                  className="rounded-full p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40"
                  aria-label={j.is_active ? "Pause" : "Publish"}
                  title={j.is_active ? "Pause" : "Publish (5 credits)"}
                >
                  {busy === j.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : j.is_active ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-[#10D576]" />
                  )}
                </button>
                <button
                  onClick={() => closeJob(j)}
                  disabled={busy === j.id}
                  className="rounded-full p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40"
                  aria-label="Close"
                  title="Close job"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[11px] border ${
        active
          ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4] font-semibold"
          : "bg-white/5 border-white/10 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
