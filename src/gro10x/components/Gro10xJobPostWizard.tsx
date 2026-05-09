import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGro10xCompanyId } from "../hooks/useGro10xCompanyId";
import { employerJobsQueryKey } from "../hooks/useEmployerJobsDashboard";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { X, Loader2, Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  location: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  vacancies: string;
  requirements: string; // newline-separated
  job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance";
  experience_level: "entry" | "mid" | "senior" | "lead";
  publish: boolean;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  location: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "BDT",
  vacancies: "1",
  requirements: "",
  job_type: "full_time",
  experience_level: "mid",
  publish: false,
};

/**
 * Manual "Post a Job" wizard for employers — bypasses chat and inserts directly
 * into `jobs` for the active company.
 */
export default function Gro10xJobPostWizard({ open, onClose }: Props) {
  const { user } = useAuth();
  const { data: companyId } = useGro10xCompanyId();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No active company workspace.");
      if (!form.title.trim()) throw new Error("Title is required.");
      if (!form.description.trim()) throw new Error("Description is required.");

      // Resolve company name (jobs.company_name is NOT NULL)
      const { data: co } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", companyId)
        .maybeSingle();

      const reqs = form.requirements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        company_id: companyId,
        company_name: co?.name ?? "Company",
        company_logo_url: co?.logo_url ?? null,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        requirements: reqs,
        job_type: form.job_type,
        experience_level: form.experience_level,
        vacancies: Math.max(1, parseInt(form.vacancies || "1", 10)),
        salary_currency: form.salary_currency || "BDT",
        salary_range_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
        salary_range_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
        is_active: form.publish,
        posted_by: user?.id ?? null,
        job_kind: "employer",
        application_type: "email",
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert(payload)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      return data?.id as string;
    },
    onSuccess: () => {
      toast.success(form.publish ? "Job published" : "Draft saved");
      qc.invalidateQueries({ queryKey: employerJobsQueryKey(companyId) });
      setForm(EMPTY);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create job");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        className={`${GRO10X_PANEL} border border-white/10 w-full md:max-w-xl rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto`}
      >
        <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#33E1E4]" />
            <h2 className="text-sm font-semibold">Post a Job</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 bg-white/5 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Role overview, responsibilities, what you're looking for…"
              className={inputCls}
            />
          </Field>

          <Field
            label="Requirements"
            hint="One per line — stored as a JSON list"
          >
            <textarea
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              rows={4}
              placeholder={"5+ years React\nTypeScript fluency\nRemote-friendly"}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Remote · Dhaka · …"
                className={inputCls}
              />
            </Field>
            <Field label="Vacancies">
              <input
                type="number"
                min={1}
                value={form.vacancies}
                onChange={(e) => set("vacancies", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Min salary">
              <input
                type="number"
                min={0}
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Max salary">
              <input
                type="number"
                min={0}
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.salary_currency}
                onChange={(e) => set("salary_currency", e.target.value)}
                className={inputCls}
              >
                <option value="BDT">BDT</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={form.job_type}
                onChange={(e) => set("job_type", e.target.value as FormState["job_type"])}
                className={inputCls}
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </Field>
            <Field label="Experience">
              <select
                value={form.experience_level}
                onChange={(e) =>
                  set("experience_level", e.target.value as FormState["experience_level"])
                }
                className={inputCls}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(e) => set("publish", e.target.checked)}
              className="h-4 w-4 rounded accent-[#33E1E4]"
            />
            Publish immediately (otherwise saved as draft)
          </label>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !companyId}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {form.publish ? "Publish job" : "Save draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#33E1E4]/60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-300 mb-1">{label}</label>
      {children}
      {hint && <p className={`text-[10px] mt-1 ${GRO10X_MUTED}`}>{hint}</p>}
    </div>
  );
}
