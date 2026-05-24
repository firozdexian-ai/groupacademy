import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getCompanyPublicProjects } from "@/domains/ugc/repo/ugcRepo";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payload {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    tagline: string | null;
  } | null;
  projects: Array<{
    slug: string;
    title: string;
    summary: string | null;
    category: string | null;
    og_image_url: string | null;
    budget_credits: number;
    currency_display: string;
  }>;
}

/**
 * GroUp Academy: Authoritative Public Portfolio Directory (CompanyPublicProjects)
 * Hardened responsive view module isolating layout-dependent side-effects and securing async metadata synchronization loops.
 * Version: Launch Candidate · Phase Z0 Lifecycle Insulation Locked
 */
export default function CompanyPublicProjects() {
  const { slug: rawRouteSlugParameterStr } = useParams<{ slug: string }>();

  const [payloadStateData, setPayloadStateData] = React.useState<Payload | null>(null);
  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);

  // =========================================================================
  // LIFECYCLE SECTOR 1: ISOLATED ASYNC NETWORK FETCH AND CONTEXT INTEGRITY
  // =========================================================================
  React.useEffect(() => {
    if (!rawRouteSlugParameterStr) {
      setPayloadStateData(null);
      setIsDataLayerLoading(false);
      return;
    }

    let isRequestThreadActive = true;
    setIsDataLayerLoading(true);

    const resolveCompanyPortfolioPayload = async () => {
      try {
        const fetchOutputPayload = await getCompanyPublicProjects<Payload>(rawRouteSlugParameterStr);

        if (!isRequestThreadActive) return;

        setPayloadStateData(fetchOutputPayload ?? null);
      } catch (unhandledExceptionPayload) {
        if (isRequestThreadActive) setPayloadStateData(null);
      } finally {
        if (isRequestThreadActive) setIsDataLayerLoading(false);
      }
    };

    resolveCompanyPortfolioPayload();

    return () => {
      isRequestThreadActive = false;
    };
  }, [rawRouteSlugParameterStr]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: SYMMETRIC METADATA DISCLOSURE SYNCHRONIZATION
  // =========================================================================
  React.useEffect(() => {
    if (!payloadStateData?.company) return;

    const isolatedCompanyNode = payloadStateData.company;

    // Insulate metadata generation hooks to protect layout consistency from runtime shifts
    setHead({
      title: `${isolatedCompanyNode.name} · Projects`,
      description:
        isolatedCompanyNode.tagline ?? `Public project portfolio workspace for ${isolatedCompanyNode.name} on Gro10x.`,
      canonical: `https://groupacademy.online/c/${rawRouteSlugParameterStr}/projects`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${isolatedCompanyNode.name} projects portfolio`,
      },
      key: "company-projects",
    });
  }, [payloadStateData, rawRouteSlugParameterStr]);

  // =========================================================================
  // RENDERING CONTROLLERS: BOUNDARY INTERCEPT BLOCKS
  // =========================================================================
  if (isDataLayerLoading) {
    return (
      <div
        role="status"
        className="min-h-screen grid place-items-center bg-background font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-primary animate-spin shrink-0" />
          <span>Loading projects.../span>
        </div>
      </div>
    );
  }

  if (!payloadStateData?.company) {
    return (
      <div
        role="alert"
        className="min-h-screen grid place-items-center bg-background text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Building2 className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Error</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The portfolio workspace container configuration could not be resolved from standard system nodes.
            </p>
          </div>
          <Link
            to="/"
            className="h-8 px-3 rounded-lg inline-flex items-center justify-center text-sm font-medium tracking-wider bg-accent text-accent-foreground border border-border/40 transition-colors hover:bg-muted"
          >
            Return to Core Matrix
          </Link>
        </div>
      </div>
    );
  }

  const companyProfileRecord = payloadStateData.company;
  const isProjectRegistryEmpty = !payloadStateData.projects || payloadStateData.projects.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 block text-left transform-gpu w-full">
      {/* HUD LEVEL 1: CORPORATE IDENTITY STRUT HEADER */}
      <header className="border-b border-border/40 bg-card/10 block w-full select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5 sm:py-6 flex items-center gap-3.5 sm:gap-4 leading-none w-full">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-card border border-border/80 shadow-2xs overflow-hidden grid place-items-center shrink-0 pointer-events-none">
            {companyProfileRecord.logo_url ? (
              <img
                src={companyProfileRecord.logo_url}
                alt={`${companyProfileRecord.name} corporate logo`}
                className="h-full w-full object-cover block"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground/40 stroke-[2.2]" />
            )}
          </div>
          <div className="min-w-0 flex-1 leading-none space-y-1 block">
            <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground truncate block pt-0.5">
              {companyProfileRecord.name}
            </h1>
            {companyProfileRecord.tagline && (
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 truncate block select-text leading-tight">
                {companyProfileRecord.tagline}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* HUD LEVEL 2: METADATA DRIVEN PORTFOLIO ARCHIVE */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 md:py-10 block w-full">
        <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-3 sm:pb-4 border-b border-border/10">
          Public Workspace Allocations
        </h2>

        {isProjectRegistryEmpty ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-8 text-center select-none mt-4 block">
            <Briefcase className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
            <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
              No public dynamic development sequences or target projects have been logged under this node.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mt-4 block w-full">
            {payloadStateData.projects.map((projectNodeItem) => (
              <Link
                to={`/projects/${projectNodeItem.slug}`}
                key={`portfolio-project-card-${projectNodeItem.slug}`}
                className="group outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring block h-full rounded-lg transition-transform"
              >
                <Card className="hover:border-border-foreground/20 transition-all duration-150 rounded-lg overflow-hidden flex flex-col h-full bg-card/40 border-border/60 shadow-none">
                  {projectNodeItem.og_image_url && (
                    <div className="relative w-full overflow-hidden h-28 sm:h-32 shrink-0 pointer-events-none select-none border-b border-border/5 bg-muted/20">
                      <img
                        src={projectNodeItem.og_image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-101"
                      />
                    </div>
                  )}

                  <CardContent className="p-4 flex flex-col flex-1 leading-none justify-between gap-3">
                    <div className="space-y-1 block leading-none">
                      <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug uppercase tracking-wide block">
                        {projectNodeItem.title}
                      </h3>
                      {projectNodeItem.summary && (
                        <p className="text-[11px] text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-0.5 font-medium">
                          {projectNodeItem.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-primary border-t border-border/5 pt-2.5 w-full shrink-0 select-none pointer-events-none leading-none tabular-nums">
                      {projectNodeItem.category && (
                        <span className="text-[10px] tracking-wide text-muted-foreground/40 font-mono uppercase bg-muted/50 border border-border/40 px-1 py-0.5 rounded-sm">
                          {projectNodeItem.category}
                        </span>
                      )}
                      <span className="ml-auto block pt-0.5 font-semibold text-right">
                        {projectNodeItem.budget_credits.toLocaleString()} {projectNodeItem.currency_display}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
