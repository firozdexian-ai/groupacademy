import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Globe, MapPin } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";

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
}

export default function Gro10xCompanyPage() {
  const { companyId: paramId } = useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let companyId = paramId;
        if (!companyId && user?.id) {
          const { data: m } = await supabase
            .from("company_members")
            .select("company_id, role")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
          companyId = m?.company_id;
          if (m?.role === "owner" || m?.role === "admin") setCanEdit(true);
        }
        if (!companyId) {
          if (!cancelled) setLoading(false);
          return;
        }
        const { data } = await supabase
          .from("companies")
          .select("id,name,tagline,about,logo_url,banner_url,website,country,slug")
          .eq("id", companyId)
          .maybeSingle();
        if (!cancelled) {
          setCompany(data as Company | null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramId, user?.id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-slate-400 text-sm">Loading company…</div>
    );
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
    <div className="max-w-md mx-auto">
      {/* Banner */}
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
            <div className="h-14 w-14 rounded-xl bg-[#0B1220] border border-white/10 grid place-items-center text-xl font-bold">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                company.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{company.name}</h1>
              <p className={`text-sm ${GRO10X_MUTED} truncate`}>
                {company.tagline || "Add a tagline to introduce your company"}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                {company.country && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {company.country}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#33E1E4] hover:underline"
                  >
                    <Globe className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <p className="mt-3 text-[11px] text-slate-400">
              You can edit this page. Inline editing comes online next — for now ask the Ops Agent in the
              inbox to update logo, tagline, or about.
            </p>
          )}
        </div>
      </div>

      {/* About */}
      <section className="px-4 mt-4">
        <h2 className="text-sm font-semibold mb-2">About</h2>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">
          {company.about || "No description yet. Ask the Ops Agent to draft one for you."}
        </p>
      </section>

      {/* Public link */}
      {company.slug && (
        <section className="px-4 mt-6 pb-4">
          <p className="text-[11px] text-slate-400">
            Public page:{" "}
            <a
              href={`/c/${company.slug}`}
              className="text-[#33E1E4] hover:underline"
            >
              /c/{company.slug}
            </a>
          </p>
        </section>
      )}
    </div>
  );
}
