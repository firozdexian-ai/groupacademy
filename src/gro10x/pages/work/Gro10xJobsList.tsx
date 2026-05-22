import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGro10xCompanyId } from "../../hooks/useGro10xCompanyId";
import {
  useEmployerJobsDashboard,
  employerJobsQueryKey,
  type EmployerJobRow,
} from "../../hooks/useEmployerJobsDashboard";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { Briefcase, Loader2, Pause, Play, X, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import Gro10xJobPostWizard from "../../components/Gro10xJobPostWizard";
import { companyAgentTools } from "@/domains/agents/api/agentsApi";

export default function Gro10xJobsList() {
  const { data: companyId, isLoading: cidLoading } = useGro10xCompanyId();
  const { data: jobs = [], isLoading } = useEmployerJobsDashboard(companyId);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const mutate = useMutation({
    mutationFn: async ({ tool, job_id }: { tool: string; job_id: string }) => {
      const data = await companyAgentTools({ tool_key: tool, args: { job_id } });
      if (!data?.ok) {
        throw new Error(data?.error ?? "Failed");
      }
      return data;
    },
    onMutate: ({ job_id }) => setBusyId(job_id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employerJobsQueryKey(companyId) });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed"),
  });

  const toggleActive = (job: EmployerJobRow) => {
    mutate.mutate(
      { tool: job.is_active ? "pause_job" : "publish_job", job_id: job.id },
      {
        onSuccess: () => {
          toast.success(job.is_active ? "Paused" : "Published");
          qc.invalidateQueries({ queryKey: employerJobsQueryKey(companyId) });
        },
      },
    );
  };

  const closeJob = (job: EmployerJobRow) => {
    if (!confirm(`Close "${job.title}"? It will stop accepting applications.`)) return;
    mutate.mutate(
      { tool: "close_job", job_id: job.id },
      {
        onSuccess: () => {
          toast.success("Closed");
          qc.invalidateQueries({ queryKey: employerJobsQueryKey(companyId) });
        },
      },
    );
  };

  const visible = jobs.filter((j) => {
    if (filter === "active") return j.is_active;
    if (filter === "draft") return !j.is_active;
    return true;
  });

  const showLoading = (cidLoading || isLoading) && !!companyId;

  if (!cidLoading && !companyId) {
    return (
      <div className="px-4 py-10 text-center">
        <Briefcase className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">Set up your workspace first.</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>Live</FilterChip>
        <FilterChip active={filter === "draft"} onClick={() => setFilter("draft")}>Draft</FilterChip>
        <button
          onClick={() => setWizardOpen(true)}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#33E1E4] text-[#06121A] px-3 py-1.5 text-xs font-semibold"
        >
          <Plus className="h-3 w-3" /> Post a Job
        </button>
      </div>

      {showLoading && (
        <div className="px-4 py-6 text-center text-sm text-slate-400 inline-flex items-center gap-2 w-full justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…
        </div>
      )}

      {!showLoading && visible.length === 0 && (
        <div className="px-4 py-10 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-slate-500 mb-3" />
          <p className="text-sm text-slate-400 mb-3">No jobs yet.</p>
          <button
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-1 rounded-full bg-[#33E1E4] text-[#06121A] px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" /> Post your first job
          </button>
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
                {j.applicant_count} applicant{j.applicant_count === 1 ? "" : "s"}
              </Link>

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => toggleActive(j)}
                  disabled={busyId === j.id}
                  className="rounded-full p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40"
                  aria-label={j.is_active ? "Pause" : "Publish"}
                  title={j.is_active ? "Pause" : "Publish (5 credits)"}
                >
                  {busyId === j.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : j.is_active ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-[#10D576]" />
                  )}
                </button>
                <button
                  onClick={() => closeJob(j)}
                  disabled={busyId === j.id}
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

      <Gro10xJobPostWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
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
