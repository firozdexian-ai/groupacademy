import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Globe, MapPin, Briefcase, Edit2, Check, X, Package, ChevronRight } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { CompletionRing } from "../components/CompletionRing";
import { useCompanyOfferings } from "../hooks/useCompanyOfferings";
import { toast } from "sonner";
import {
  getActiveCompanyMembership,
  getCompanyMemberRole,
  getCompanyPublicProfile,
  listActiveCompanyMembers,
  updateCompanyField,
} from "@/domains/companies/repo/companiesRepo";
import { listTalentMiniProfilesByUserIds } from "@/domains/talent/repo/talentRepo";
import { listActiveJobsByCompanyId } from "@/domains/jobs/repo/jobsRepo";

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
      const m = await getActiveCompanyMembership(user.id);
      companyId = m?.company_id;
      // Owner only — admins can manage hiring/CRM but not the public face.
      editor = m?.role === "owner";
    } else if (companyId && user?.id) {
      const role = await getCompanyMemberRole(user.id, companyId);
      editor = role === "owner";
    }
    setCanEdit(editor);

    if (!companyId) {
      // Bail early so the empty state renders instead of a perpetual spinner.
      setCompany(null);
      setMembers([]);
      setJobs([]);
      setLoading(false);
      return;
    }

    const c = await getCompanyPublicProfile(companyId);
    setCompany(c as Company | null);

    // Team — fetch members then enrich with talents
    const rawMembers = await listActiveCompanyMembers(companyId);
    const userIds = rawMembers.map((m: any) => m.user_id).filter(Boolean) as string[];
    const talentRows = await listTalentMiniProfilesByUserIds(userIds);
    const talents: Record<string, any> = Object.fromEntries(
      talentRows.map((row: any) => [row.user_id, row]),
    );
    setMembers(
      rawMembers.map((m: any) => ({
        ...m,
        full_name: talents[m.user_id]?.full_name ?? null,
        profile_photo_url: talents[m.user_id]?.profile_photo_url ?? null,
        custom_profession: talents[m.user_id]?.custom_profession ?? null,
      })),
    );

    // Open jobs
    const jobRows = await listActiveJobsByCompanyId(companyId, 10);
    setJobs(jobRows as Job[]);

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
    const { error } = await updateCompanyField(company.id, { [editing]: draftValue.trim() || null });
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Saved");
    setCompany({ ...company, [editing]: draftValue.trim() || null });
    setEditing(null);
  };

  if (loading) {
    return <div className="max-w-md md:max-w-5xl mx-auto p-6 text-center text-slate-400 text-sm">Loading company…</div>;
  }
  if (!company) {
    return (
      <div className="max-w-md md:max-w-5xl mx-auto p-6 text-center">
        <Building2 className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">
          You're not connected to a company yet. Finish onboarding to create or join one.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-5xl mx-auto pb-6">
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
            {members.map((m, i) => (
              <Link
                key={i}
                to={m.user_id ? `/app/profile/${m.user_id}` : "#"}
                className={`${GRO10X_PANEL} border border-white/10 rounded-xl p-2 text-center hover:bg-white/5`}
              >
                <div className="h-10 w-10 mx-auto rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-xs overflow-hidden">
                  {m.profile_photo_url ? (
                    <img src={m.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.full_name || m.invited_email || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-[11px] mt-1 truncate">{m.full_name || m.invited_email || "Member"}</p>
                <p className="text-[9px] text-slate-500 capitalize">{m.role}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Offerings */}
      <OfferingsSection companyId={company.id} canEdit={canEdit} />

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

function OfferingsSection({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const { data } = useCompanyOfferings(companyId, { activeOnly: !canEdit });
  const list = data ?? [];
  if (list.length === 0 && !canEdit) return null;
  return (
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" /> What we offer · {list.length}
        </h2>
        {canEdit && (
          <Link to="/gro10x/offerings" className="text-[11px] text-[#33E1E4] inline-flex items-center gap-0.5">
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {list.length === 0 ? (
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 text-center`}>
          <p className="text-xs text-slate-400">No offerings yet.</p>
          <Link
            to="/gro10x/offerings"
            className="mt-2 inline-block text-xs text-[#33E1E4] hover:underline"
          >
            Add your first service or product
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 6).map((o) => (
            <div key={o.id} className={`${GRO10X_PANEL} border border-white/10 rounded-xl p-3`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{o.name}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-300 capitalize">
                  {o.kind}
                </span>
              </div>
              {o.tagline && <p className="text-[11px] text-slate-400 truncate">{o.tagline}</p>}
              {(o.price_min || o.price_max) && (
                <p className="text-[11px] text-emerald-300 mt-1">
                  {o.currency === "USD" ? "$" : `${o.currency} `}
                  {o.price_min && o.price_max && o.price_min !== o.price_max
                    ? `${Number(o.price_min).toLocaleString()}–${Number(o.price_max).toLocaleString()}`
                    : Number(o.price_min ?? o.price_max).toLocaleString()}
                  {o.unit && <span className="text-slate-500"> /{o.unit}</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

