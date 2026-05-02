import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Globe, MapPin, Briefcase, Edit2, Check, X } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { CompletionRing } from "../components/CompletionRing";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  tagline?: string | null;
  about?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  country?: string | null;
  slug?: string | null;
  profile_completion?: number | null;
  verification_tier?: "unverified" | "self_completed" | "verified" | null;
}

interface Member {
  user_id: string | null;
  role: string;
  status: string;
  invited_email: string | null;
  full_name?: string | null;
  profile_photo_url?: string | null;
  custom_profession?: string | null;
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  job_type: string;
  is_active: boolean;
  created_at: string;
}

export default function Gro10xCompanyPage() {
  const { companyId: paramId } = useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<null | "tagline" | "about">(null);
  const [draftValue, setDraftValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let companyId = paramId;
    let editor = false;
    if (!companyId && user?.id) {
      const { data: m } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      companyId = m?.company_id;
      editor = m?.role === "owner" || m?.role === "admin";
    } else if (companyId && user?.id) {
      const { data: m } = await supabase
        .from("company_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      editor = m?.role === "owner" || m?.role === "admin";
    }
    setCanEdit(editor);

    if (!companyId) {
      setLoading(false);
      return;
    }

    const { data: c } = await supabase
      .from("companies")
      .select("id,name,tagline,about,logo_url,banner_url,website,country,slug,profile_completion,verification_tier")
      .eq("id", companyId)
      .maybeSingle();
    setCompany(c as Company | null);

    // Team — fetch members then enrich with talents
    const { data: rawMembers } = await supabase
      .from("company_members")
      .select("user_id, role, status, invited_email")
      .eq("company_id", companyId)
      .eq("status", "active");
    const userIds = (rawMembers ?? []).map((m: any) => m.user_id).filter(Boolean) as string[];
    let talents: Record<string, any> = {};
    if (userIds.length) {
      const { data: t } = await supabase
        .from("talents")
        .select("user_id, full_name, profile_photo_url, custom_profession")
        .in("user_id", userIds);
      talents = Object.fromEntries((t ?? []).map((row: any) => [row.user_id, row]));
    }
    setMembers(
      (rawMembers ?? []).map((m: any) => ({
        ...m,
        full_name: talents[m.user_id]?.full_name ?? null,
        profile_photo_url: talents[m.user_id]?.profile_photo_url ?? null,
        custom_profession: talents[m.user_id]?.custom_profession ?? null,
      }))
    );

    // Open jobs
    const { data: jobRows } = await supabase
      .from("jobs")
      .select("id, title, location, job_type, is_active, created_at")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);
    setJobs((jobRows ?? []) as Job[]);

    setLoading(false);
  }, [paramId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (field: "tagline" | "about") => {
    setEditing(field);
    setDraftValue(((company as any)?.[field] ?? "") as string);
  };

  const saveEdit = async () => {
    if (!editing || !company) return;
    const { error } = await supabase
      .from("companies")
      .update({ [editing]: draftValue.trim() || null })
      .eq("id", company.id);
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Saved");
    setCompany({ ...company, [editing]: draftValue.trim() || null });
    setEditing(null);
  };

  if (loading) {
    return <div className="max-w-md mx-auto p-6 text-center text-slate-400 text-sm">Loading company…</div>;
  }
  if (!company) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <Building2 className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">
          You're not connected to a company yet. Finish onboarding to create or join one.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-6">
      {/* Banner — 3:1 aspect */}
      <div
        className="aspect-[3/1] w-full bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        style={
          company.banner_url
            ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      {/* Header card */}
      <div className="-mt-8 px-4">
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-xl bg-[#0B1220] border border-white/10 grid place-items-center text-xl font-bold overflow-hidden">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                company.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{company.name}</h1>
              {editing === "tagline" ? (
                <div className="mt-1 flex gap-1">
                  <input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    autoFocus
                    placeholder="A short tagline"
                    className="flex-1 bg-white/5 rounded px-2 py-1 text-sm border border-white/10 focus:outline-none focus:border-[#33E1E4]"
                  />
                  <button onClick={saveEdit} className="rounded p-1 bg-[#33E1E4] text-[#06121A]"><Check className="h-3 w-3"/></button>
                  <button onClick={() => setEditing(null)} className="rounded p-1 bg-white/10"><X className="h-3 w-3"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <p className={`text-sm ${GRO10X_MUTED} truncate`}>
                    {company.tagline || "Add a tagline to introduce your company"}
                  </p>
                  {canEdit && (
                    <button onClick={() => startEdit("tagline")} className="opacity-50 hover:opacity-100">
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                {company.country && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {company.country}
                  </span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#33E1E4] hover:underline">
                    <Globe className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <CompletionRing
                completion={company.profile_completion ?? 0}
                tier={company.verification_tier ?? "unverified"}
              />
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <section className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">About</h2>
          {canEdit && editing !== "about" && (
            <button onClick={() => startEdit("about")} className="text-[11px] text-[#33E1E4] inline-flex items-center gap-1">
              <Edit2 className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
        {editing === "about" ? (
          <div className="space-y-2">
            <textarea
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              rows={4}
              autoFocus
              placeholder="What does your company do?"
              className="w-full bg-white/5 rounded p-2 text-sm border border-white/10 focus:outline-none focus:border-[#33E1E4]"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">Cancel</button>
              <button onClick={saveEdit} className="text-xs px-3 py-1.5 rounded-full bg-[#33E1E4] text-[#06121A] font-semibold">Save</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {company.about || "No description yet. Tap Edit to add one."}
          </p>
        )}
      </section>

      {/* Team */}
      {members.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-semibold mb-2">Team · {members.length}</h2>
          <div className="grid grid-cols-3 gap-2">
            {members.slice(0, 9).map((m, i) => (
              <div key={i} className={`${GRO10X_PANEL} border border-white/10 rounded-xl p-2 text-center`}>
                <div className="h-10 w-10 mx-auto rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-xs overflow-hidden">
                  {m.profile_photo_url ? (
                    <img src={m.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.full_name || m.invited_email || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-[11px] mt-1 truncate">{m.full_name || m.invited_email || "Member"}</p>
                <p className="text-[9px] text-slate-500 capitalize">{m.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open jobs */}
      {jobs.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Open roles · {jobs.length}
          </h2>
          <div className="space-y-2">
            {jobs.map((j) => (
              <Link
                key={j.id}
                to={`/jobs/${j.id}`}
                className={`block ${GRO10X_PANEL} border border-white/10 rounded-xl p-3 hover:bg-white/5`}
              >
                <p className="text-sm font-medium truncate">{j.title}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {j.location ?? "Remote"} · {j.job_type.replace(/_/g, " ")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public link */}
      {company.slug && (
        <section className="px-4 mt-6">
          <p className="text-[11px] text-slate-400">
            Public page:{" "}
            <a href={`/c/${company.slug}`} className="text-[#33E1E4] hover:underline">
              /c/{company.slug}
            </a>
          </p>
        </section>
      )}
    </div>
  );
}
