import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCompanyPublicProfileBySlug,
  listActiveCompanyMemberUserIds,
} from "@/domains/companies/repo/companiesRepo";
import { listActiveJobsByCompanyIdShort } from "@/domains/jobs/repo/jobsRepo";
import { listTalentBasicByUserIds } from "@/domains/talent/repo/talentRepo";
import { Building2, Globe, MapPin, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

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

// =========================================================================
// ISOLATED IMPERATIVE DOM META HANDLING UTILITIES
// =========================================================================
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

/**
 * GroUp Academy: Authoritative Public Workspace Mirror Node (PublicCompanyPage)
 * Hardened responsive showcase page resolving parallel relational handshakes and isolating SEO injections.
 * Version: Launch Candidate · Phase Z0 Lifecycle Insulation Locked
 */
export default function PublicCompanyPage() {
  const { slug: unverifiedRouteSlugStr } = useParams<{ slug: string }>();

  const [companyRecordState, setCompanyRecordState] = React.useState<Company | null>(null);
  const [associatedJobsState, setAssociatedJobsState] = React.useState<Job[]>([]);
  const [activeMembersState, setActiveMembersState] = React.useState<Member[]>([]);

  const [isPipelineProcessing, setIsPipelineProcessing] = React.useState<boolean>(true);
  const [isRegistryTargetMissing, setIsRegistryTargetMissing] = React.useState<boolean>(false);

  // =========================================================================
  // LIFECYCLE SECTOR 1: CONCURRENT LIFECYCLE SECTOR FETCH COMPILING
  // =========================================================================
  React.useEffect(() => {
    if (!unverifiedRouteSlugStr) {
      setIsRegistryTargetMissing(true);
      setIsPipelineProcessing(false);
      return;
    }

    let isRequestThreadValid = true;
    setIsPipelineProcessing(true);

    const executeConcurrentPlatformLookup = async () => {
      try {
        // Core Step A: Extract baseline company context profile metrics
        const { data: baseCompanyNode, error: companyLookupError } =
          await getCompanyPublicProfileBySlug(unverifiedRouteSlugStr);

        if (!isRequestThreadValid) return;

        if (companyLookupError || !baseCompanyNode) {
          setIsRegistryTargetMissing(true);
          setIsPipelineProcessing(false);
          return;
        }

        setCompanyRecordState(baseCompanyNode as Company);

        // Core Step B: Execute parallel handshakes to resolve child relational nodes simultaneously
        const [jobRows, memberUserIds] = await Promise.all([
          listActiveJobsByCompanyIdShort(baseCompanyNode.id, 10),
          listActiveCompanyMemberUserIds(baseCompanyNode.id, 12),
        ]);

        if (!isRequestThreadValid) return;

        setAssociatedJobsState(jobRows as Job[]);

        if (memberUserIds.length > 0) {
          const verifiedTalentsPayloadNode = await listTalentBasicByUserIds(memberUserIds, 12);

          if (isRequestThreadValid && verifiedTalentsPayloadNode.length) {
            setActiveMembersState(verifiedTalentsPayloadNode as Member[]);
          }
        }
      } catch (fatalPipelineException) {
        if (isRequestThreadValid) setIsRegistryTargetMissing(true);
      } finally {
        if (isRequestThreadValid) setIsPipelineProcessing(false);
      }
    };

    executeConcurrentPlatformLookup();

    return () => {
      isRequestThreadValid = false;
    };
  }, [unverifiedRouteSlugStr]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: ISOLATED SEO STRUC METADATA HANDSHAKE SYNCHRONIZER
  // =========================================================================
  React.useEffect(() => {
    if (!companyRecordState) return;

    const targetCompanyNodeItem = companyRecordState;
    const stableTitleString =
      `${targetCompanyNodeItem.name} — ${targetCompanyNodeItem.tagline ?? "Corporate Profile"}`.slice(0, 60);
    const stableDescriptionString = (
      targetCompanyNodeItem.about ??
      targetCompanyNodeItem.tagline ??
      `${targetCompanyNodeItem.name} Identity Hub`
    ).slice(0, 155);
    const corporateCanonicalRouteUrl = `https://groupacademy.online/c/${targetCompanyNodeItem.slug}`;

    // Execute safe mutations downstream only after compilation loops finalize completely
    document.title = stableTitleString;
    setCanonical(corporateCanonicalRouteUrl);
    setMeta("description", stableDescriptionString);
    setMeta("og:title", targetCompanyNodeItem.name, "property");
    setMeta("og:description", stableDescriptionString, "property");

    if (targetCompanyNodeItem.banner_url) {
      setMeta("og:image", targetCompanyNodeItem.banner_url, "property");
    }

    const structuredOrganizationJsonLdGraph = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: targetCompanyNodeItem.name,
      description: targetCompanyNodeItem.about || targetCompanyNodeItem.tagline || undefined,
      url: targetCompanyNodeItem.website || corporateCanonicalRouteUrl,
      logo: targetCompanyNodeItem.logo_url || undefined,
      image: targetCompanyNodeItem.banner_url || undefined,
      address: targetCompanyNodeItem.country
        ? { "@type": "PostalAddress", addressCountry: targetCompanyNodeItem.country }
        : undefined,
    };

    setJsonLd("ld-org-company", structuredOrganizationJsonLdGraph);
  }, [companyRecordState]);

  // =========================================================================
  // RENDER INTERCEPTS: CONDITION VERIFICATION BARRIERS
  // =========================================================================
  if (isPipelineProcessing) {
    return (
      <div
        role="status"
        className="min-h-screen grid place-items-center bg-background font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-primary animate-spin shrink-0" />
          <span>Loading Company Profile...</span>
        </div>
      </div>
    );
  }

  if (isRegistryTargetMissing || !companyRecordState) {
    return (
      <div
        role="alert"
        className="min-h-screen grid place-items-center bg-background text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-10 w-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Building2 className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Company not found</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The requested company profile could not be found.
            </p>
          </div>
          <Link
            to="/"
            className="h-8 px-4 rounded-lg inline-flex items-center justify-center text-sm font-medium tracking-wider bg-accent text-accent-foreground border border-border/40 transition-colors hover:bg-muted"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 block text-left transform-gpu w-full">
      <main className="max-w-3xl mx-auto pb-12 w-full block">
        {/* HUD LEVEL 1: PROFILE COVER MATRICES */}
        <div
          role="img"
          aria-label={`${companyRecordState.name} cover image`}
          className="aspect-[3/1] w-full bg-linear-to-br from-muted/60 via-muted/20 to-background border-b border-border/10 shrink-0 block select-none pointer-events-none bg-cover bg-center"
          style={
            companyRecordState.banner_url ? { backgroundImage: `url(${companyRecordState.banner_url})` } : undefined
          }
        />

        {/* HUD LEVEL 2: COMPOSITE HEAD DESCRIPTION PROFILE IDENTIFIER CARD */}
        <div className="-mt-10 px-4 select-none block w-full">
          <div className="bg-card/95 border border-border/60 rounded-xl p-4 sm:p-5 shadow-xs block w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-background border border-border/60 grid place-items-center text-sm font-bold uppercase tracking-wide text-primary overflow-hidden shrink-0 pointer-events-none shadow-inner">
                {companyRecordState.logo_url ? (
                  <img src={companyRecordState.logo_url} alt="" className="h-full w-full object-cover block" />
                ) : (
                  companyRecordState.name.charAt(0)
                )}
              </div>

              <div className="flex-1 min-w-0 leading-none space-y-1 block w-full">
                <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground truncate block pt-0.5">
                  {companyRecordState.name}
                </h1>
                {companyRecordState.tagline && (
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block select-text">
                    {companyRecordState.tagline}
                  </p>
                )}

                <div className="mt-2.5 flex items-center gap-3.5 text-[10px] font-mono font-bold uppercase tracking-wide text-muted-foreground/40 flex-wrap leading-none pt-0.5">
                  {companyRecordState.country && (
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <MapPin className="h-3 w-3 stroke-[2.2]" /> {companyRecordState.country}
                    </span>
                  )}
                  {companyRecordState.website && (
                    <a
                      href={companyRecordState.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors cursor-pointer shrink-0 pointer-events-auto font-sans font-bold uppercase"
                    >
                      <Globe className="h-3 w-3 stroke-[2.2]" /> Website Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HUD LEVEL 3: DETAILED ABSTRACT DOCUMENT SECTION */}
        {companyRecordState.about && (
          <section className="px-4 mt-6 block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
              About Us
            </h2>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium block select-text whitespace-pre-wrap mt-3">
              {companyRecordState.about}
            </p>
          </section>
        )}

        {/* HUD LEVEL 4: SQUAD MEMBER MATRIX GRAPH GRID */}
        {activeMembersState.length > 0 && (
          <section className="px-4 mt-8 block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-3 border-b border-border/5">
              Team Members
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3.5 block w-full">
              {activeMembersState.map((memberItemNode, nodePositionIdx) => (
                <div
                  key={`squad-member-badge-node-${nodePositionIdx}`}
                  className="bg-card/40 border border-border/60 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-2 select-none shadow-2xs"
                >
                  <div className="h-10 w-10 rounded-full bg-background border border-border/40 grid place-items-center text-xs font-bold uppercase text-primary overflow-hidden shrink-0 pointer-events-none shadow-2xs">
                    {memberItemNode.profile_photo_url ? (
                      <img src={memberItemNode.profile_photo_url} alt="" className="h-full w-full object-cover block" />
                    ) : (
                      (memberItemNode.full_name ?? "?").charAt(0)
                    )}
                  </div>
                  <div className="leading-none space-y-0.5 w-full block">
                    <p className="text-xs font-bold text-foreground truncate block select-text">
                      {memberItemNode.full_name ?? "Team Member"}
                    </p>
                    {memberItemNode.custom_profession && (
                      <p className="text-[10px] font-semibold text-muted-foreground/50 truncate block uppercase select-text font-mono tracking-tight">
                        {memberItemNode.custom_profession}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HUD LEVEL 5: COMPOSITE VACANT TASK ASSIGNMENTS ROLES SECTOR */}
        {associatedJobsState.length > 0 && (
          <section className="px-4 mt-8 block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-3 border-b border-border/5 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Job Openings</span>
            </h2>
            <div className="space-y-2 mt-3.5 block w-full">
              {associatedJobsState.map((jobCapsuleItem) => (
                <Link
                  key={`job-vacancy-link-${jobCapsuleItem.id}`}
                  to={`/jobs/${jobCapsuleItem.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 block bg-card/40 border border-border/60 rounded-lg p-3 hover:bg-muted/30 hover:border-border-foreground/10 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-150 transform-gpu active:scale-[0.995]"
                >
                  <div className="min-w-0 flex-1 leading-none space-y-1 block">
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block uppercase tracking-wide">
                      {jobCapsuleItem.title}
                    </p>
                    <p className="text-[11px] font-mono font-bold text-muted-foreground/50 truncate block leading-none">
                      {jobCapsuleItem.location ?? "Remote"} ·{" "}
                      {jobCapsuleItem.job_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0 uppercase tracking-wider hidden sm:inline-block">
                    View Job →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HUD LEVEL 6: GLOBAL FOOTER DISCLOSURE MARKERS */}
        <p className="text-center font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 mt-12 select-none pointer-events-none leading-none">
          Powered by{" "}
          <Link
            to="/gro10x"
            className="text-primary hover:text-primary/80 pointer-events-auto cursor-pointer font-sans normal-case tracking-normal text-xs font-semibold"
          >
            GroUp Academy
          </Link>
        </p>
      </main>
    </div>
  );
}
