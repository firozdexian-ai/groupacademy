import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { ArrowLeft, Loader2, MapPin, Eye, Bookmark, Mail, Phone, Linkedin } from "lucide-react";
import { toast } from "sonner";

interface Applicant {
  id: string;
  talent_id: string | null;
  created_at: string;
  status: string;
  talents: {
    id: string;
    full_name: string | null;
    country: string | null;
    headline: string | null;
  } | null;
}

interface RevealedTalent {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  headline: string | null;
  linkedin_url: string | null;
}

export default function Gro10xJobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState("Job");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RevealedTalent | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", jobId)
      .maybeSingle();
    if (job?.title) setJobTitle(job.title);

    const { data, error } = await supabase.functions.invoke("company-agent-tools", {
      body: { tool_key: "get_job_applicants", args: { job_id: jobId } },
    });
    if (error || !data?.ok) {
      toast.error(data?.error ?? error?.message ?? "Could not load applicants");
      setApplicants([]);
    } else {
      setApplicants((data.result?.applicants ?? []) as Applicant[]);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reveal = async (talentId: string) => {
    setRevealing(talentId);
    try {
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: "reveal_talent", args: { talent_id: talentId } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Could not reveal");
        return;
      }
      if (data.user_message) toast.success(data.user_message);
      setSelected(data.result?.talent as RevealedTalent);
    } finally {
      setRevealing(null);
    }
  };

  const saveToShortlist = async (talentId: string) => {
    setSaving(talentId);
    try {
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: "save_to_shortlist", args: { talent_id: talentId } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Could not save");
        return;
      }
      toast.success("Saved to shortlist");
    } finally {
      setSaving(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/gro10x/work")}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="font-medium truncate">{jobTitle}</p>
          <p className={`text-[11px] ${GRO10X_MUTED}`}>
            {applicants.length} applicant{applicants.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {loading && (
        <div className="py-10 text-center text-sm text-slate-400 inline-flex items-center gap-2 w-full justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && applicants.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-slate-400 mb-3">No applicants yet.</p>
          <Link
            to="/gro10x/c/sourcer"
            className="inline-flex items-center gap-1 text-[11px] text-[#33E1E4] hover:underline"
          >
            Ask Sourcer to find candidates →
          </Link>
        </div>
      )}

      <ul className="px-4 py-3 space-y-2 pb-20">
        {applicants.map((a) => (
          <li
            key={a.id}
            className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-sm font-semibold">
                {(a.talents?.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.talents?.full_name ?? "Candidate"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {a.talents?.headline ?? "No headline"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                  {a.talents?.country && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {a.talents.country}
                    </span>
                  )}
                  <span>
                    {new Date(a.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/5 capitalize">
                    {a.status}
                  </span>
                </div>
              </div>
            </div>

            {a.talent_id && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => reveal(a.talent_id!)}
                  disabled={revealing === a.talent_id}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-[#33E1E4] text-[#06121A] font-semibold disabled:opacity-50"
                >
                  {revealing === a.talent_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  Reveal contact
                </button>
                <button
                  onClick={() => saveToShortlist(a.talent_id!)}
                  disabled={saving === a.talent_id}
                  className="inline-flex items-center justify-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                >
                  {saving === a.talent_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                  Save
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Revealed contact drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-[#0F172A] border-t border-white/10 rounded-t-2xl p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
            <p className="text-base font-semibold">{selected.full_name ?? "Candidate"}</p>
            <p className="text-xs text-slate-400 mb-3">{selected.headline ?? ""}</p>

            <div className="space-y-2 text-sm">
              {selected.email && (
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Mail className="h-4 w-4 text-[#33E1E4]" />
                  <span className="truncate">{selected.email}</span>
                </a>
              )}
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Phone className="h-4 w-4 text-[#33E1E4]" />
                  <span>{selected.phone}</span>
                </a>
              )}
              {selected.linkedin_url && (
                <a
                  href={selected.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Linkedin className="h-4 w-4 text-[#33E1E4]" />
                  <span className="truncate">LinkedIn profile</span>
                </a>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => saveToShortlist(selected.id)}
                disabled={saving === selected.id}
                className="flex-1 inline-flex items-center justify-center gap-1 text-xs py-2 rounded-full bg-white/5 border border-white/10"
              >
                <Bookmark className="h-3.5 w-3.5" /> Save to shortlist
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 text-xs py-2 rounded-full bg-[#33E1E4] text-[#06121A] font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
