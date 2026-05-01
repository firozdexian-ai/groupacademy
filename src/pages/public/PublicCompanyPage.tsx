import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, MapPin, Briefcase } from "lucide-react";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}
function setJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
}

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

interface Job {
  id: string;
  title: string;
  location: string | null;
  job_type: string;
}

interface Member {
  full_name: string | null;
  profile_photo_url: string | null;
  custom_profession: string | null;
}

/**
 * Public company mirror at /c/:slug. No auth required, SEO-friendly with
 * JSON-LD Organization markup. Powered by the "Public can view onboarded
 * companies by slug" RLS policy.
 */
export default function PublicCompanyPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const { data: c } = await supabase
        .from("companies")
        .select("id,name,tagline,about,logo_url,banner_url,website,country,slug")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCompany(c as Company);

      const { data: jobRows } = await supabase
        .from("jobs")
        .select("id, title, location, job_type")
        .eq("company_id", c.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!cancelled) setJobs((jobRows ?? []) as Job[]);

      // Public team grid via talents (only those with a profile photo or name)
      const { data: rawMembers } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", c.id)
        .eq("status", "active")
        .limit(12);
      const userIds = (rawMembers ?? []).map((m: any) => m.user_id).filter(Boolean) as string[];
      if (userIds.length) {
        const { data: t } = await supabase
          .from("talents")
          .select("full_name, profile_photo_url, custom_profession")
          .in("user_id", userIds)
          .limit(12);
        if (!cancelled) setMembers((t ?? []) as Member[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (notFound || !company) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6 text-center">
        <div>
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Company not found.</p>
          <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to home</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.about || company.tagline || undefined,
    url: company.website || `https://groupacademy.online/c/${company.slug}`,
    logo: company.logo_url || undefined,
    image: company.banner_url || undefined,
    address: company.country ? { "@type": "PostalAddress", addressCountry: company.country } : undefined,
  };

  // Set head tags imperatively (no react-helmet dep)
  if (typeof document !== "undefined") {
    document.title = `${company.name} — ${company.tagline ?? "Company"}`.slice(0, 60);
    setMeta("description", (company.about ?? company.tagline ?? `${company.name} on Gro10x`).slice(0, 155));
    setCanonical(`https://groupacademy.online/c/${company.slug}`);
    setMeta("og:title", company.name, "property");
    setMeta("og:description", (company.tagline ?? company.about ?? "").slice(0, 155), "property");
    if (company.banner_url) setMeta("og:image", company.banner_url, "property");
    setJsonLd("ld-org-company", jsonLd);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main className="max-w-3xl mx-auto pb-12">
        <div
          className="aspect-[3/1] w-full bg-gradient-to-br from-muted to-muted-foreground/10"
          style={
            company.banner_url
              ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="-mt-10 px-4">
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-background border grid place-items-center text-2xl font-bold overflow-hidden">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  company.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
                {company.tagline && <p className="text-sm text-muted-foreground">{company.tagline}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {company.country && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {company.country}
                    </span>
                  )}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {company.about && (
          <section className="px-4 mt-6">
            <h2 className="text-base font-semibold mb-2">About</h2>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{company.about}</p>
          </section>
        )}

        {members.length > 0 && (
          <section className="px-4 mt-8">
            <h2 className="text-base font-semibold mb-3">Team</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {members.map((m, i) => (
                <div key={i} className="bg-card border rounded-xl p-3 text-center">
                  <div className="h-12 w-12 mx-auto rounded-full bg-background border grid place-items-center text-sm overflow-hidden">
                    {m.profile_photo_url ? (
                      <img src={m.profile_photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (m.full_name ?? "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="text-xs mt-1 truncate">{m.full_name ?? "Member"}</p>
                  {m.custom_profession && (
                    <p className="text-[10px] text-muted-foreground truncate">{m.custom_profession}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="px-4 mt-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Open roles
            </h2>
            <div className="space-y-2">
              {jobs.map((j) => (
                <Link key={j.id} to={`/jobs/${j.id}`} className="block bg-card border rounded-xl p-3 hover:bg-accent transition-colors">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {j.location ?? "Remote"} · {j.job_type.replace(/_/g, " ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-xs text-muted-foreground mt-12">
          Powered by <Link to="/gro10x" className="text-primary hover:underline">Gro10x</Link>
        </p>
      </main>
    </div>
  );
}
