import * as React from "react";
import { Link } from "react-router-dom";
import { getPublicProjects } from "@/domains/ugc/repo/ugcRepo";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectRow {
  id: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  title: string;
  summary: string | null;
  category: string | null;
  budget_credits: number;
  currency_display: string;
  company_name: string;
  company_slug: string;
  company_logo: string | null;
}

/**
 * Custom Internal Micro-Hook: Ingress Debounce Throttler
 * Defers dynamic state execution strings to shield RPC handlers against keystroke spam thrashing.
 */
function useDebounce<TValue>(inputValue: TValue, precisionDelayMs = 300): TValue {
  const [debouncedValueState, setDebouncedValueState] = React.useState<TValue>(inputValue);

  React.useEffect(() => {
    const schedulingTimerBlock = setTimeout(() => {
      setDebouncedValueState(inputValue);
    }, precisionDelayMs);

    return () => {
      clearTimeout(schedulingTimerBlock);
    };
  }, [inputValue, precisionDelayMs]);

  return debouncedValueState;
}

/**
 * GroUp Academy: Technical Project Showcase Register Matrix (PublicProjectsIndex)
 * Hardened responsive listing directory implementing query debouncing and neutralizing input race conditions.
 * Version: Launch Candidate · Phase Z0 Throttle & Lifecycle Hardened
 */
export default function PublicProjectsIndex() {
  const [rawSearchQueryInput, setRawSearchQueryInput] = React.useState<string>("");
  const consolidatedDebouncedSearchQuery = useDebounce<string>(rawSearchQueryInput, 300);

  const [projectRowsRegistry, setProjectRowsRegistry] = React.useState<ProjectRow[]>([]);
  const [isDataLayerResolving, setIsDataLayerResolving] = React.useState<boolean>(true);

  // =========================================================================
  // UNIFIED LIFECYCLE SECTOR: LOGIC MATRIXfetch DATA RESOLUTION AND METADATA SYNC
  // =========================================================================
  React.useEffect(() => {
    let isPipelineActiveAndValid = true;
    setIsDataLayerResolving(true);

    const executeIndexRegistrySynchronization = async () => {
      try {
        const outputHandshakePayload = await getPublicProjects<{ results?: ProjectRow[] }>({
          filters: { q: consolidatedDebouncedSearchQuery },
          page: 0,
          pageSize: 24,
        });

        if (!isPipelineActiveAndValid) return;

        const processedPayloadArray = outputHandshakePayload?.results ?? [];
        setProjectRowsRegistry(processedPayloadArray);

        // Apply synchronized metadata metrics inside the data pipeline resolution thread to prevent shifts
        setHead({
          title: "Projects · GroUp Academy",
          description:
            "Browse projects and case studies from teams on GroUp Academy.",
          canonical: "https://groupacademy.online/projects",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "GroUp Academy Projects",
          },
          key: `projects-showcase-index-query-${consolidatedDebouncedSearchQuery}`,
        });
      } catch (fatalExecutionException) {
        if (isPipelineActiveAndValid) setProjectRowsRegistry([]);
      } finally {
        if (isPipelineActiveAndValid) setIsDataLayerResolving(false);
      }
    };

    executeIndexRegistrySynchronization();

    return () => {
      isPipelineActiveAndValid = false;
    };
  }, [consolidatedDebouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 block text-left transform-gpu w-full">
      {/* HUD LEVEL 1: APP SHELL TOP BAR DIRECTORY */}
      <header className="border-b border-border/40 bg-card/10 block w-full select-none">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between leading-none w-full">
          <Link
            to="/"
            className="font-bold uppercase text-xs sm:text-sm text-foreground flex items-center gap-2 tracking-wide pointer-events-auto leading-none"
          >
            <Briefcase className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
            <span className="pt-0.5">Projects Hub</span>
          </Link>

          <nav
            className="flex items-center gap-3.5 sm:gap-4 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wide text-muted-foreground/60 leading-none shrink-0"
            aria-label="Auxiliary directory index routes"
          >
            <Link to="/leaderboards/talents" className="hover:text-foreground transition-colors">
              Talents
            </Link>
            <Link to="/leaderboards/companies" className="hover:text-foreground transition-colors">
              Companies
            </Link>
            <Link to="/leaderboards/reviewers" className="hover:text-foreground transition-colors">
              Reviewers
            </Link>
          </nav>
        </div>
      </header>

      {/* HUD LEVEL 2: REGISTRY ENTRY CONTROL SECTOR */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 block w-full">
        <div className="space-y-1 block leading-none select-none pointer-events-none border-b border-border/10 pb-4 w-full shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
            Featured Projects
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-normal block">
            View projects and case studies built by our community and companies.
          </p>
        </div>

        {/* Input Throttled Search Module Frame */}
        <div className="relative max-w-md w-full block mt-5 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
          <Input
            type="search"
            placeholder="Search projects..."
            value={rawSearchQueryInput}
            onChange={(eventObject) => setRawSearchQueryInput(eventObject.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-background/50 border border-border/40 text-xs sm:text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* HUD LEVEL 3: GRID RESOLUTION SWITCH VIEWPORTS */}
        {isDataLayerResolving ? (
          <div
            role="status"
            className="w-full flex items-center justify-center py-16 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none pointer-events-none gap-2.5"
          >
            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-primary animate-spin shrink-0" />
            <span>Loading projects...</span>
          </div>
        ) : projectRowsRegistry.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none mt-6 block">
            <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
            <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
              {rawSearchQueryInput
                ? "No matching projects found."
                : "No projects have been published yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mt-6 block w-full">
            {projectRowsRegistry.map((projectRowItem) => (
              <Link
                to={`/projects/${projectRowItem.slug}`}
                key={`showcase-directory-card-index-${projectRowItem.id}`}
                className="group outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring block h-full rounded-lg transition-transform"
              >
                <Card className="rounded-lg border border-border/60 bg-card hover:border-border-foreground/10 transition-colors duration-100 flex flex-col h-full shadow-none overflow-hidden">
                  {/* Dynamic Project Imagery Banner */}
                  {projectRowItem.og_image_url && (
                    <div className="relative w-full overflow-hidden h-28 sm:h-32 shrink-0 pointer-events-none select-none border-b border-border/5 bg-muted/20">
                      <img
                        src={projectRowItem.og_image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-101"
                      />
                    </div>
                  )}

                  <CardContent className="p-4 flex flex-col flex-1 leading-none justify-between gap-3">
                    <div className="space-y-1.5 block leading-none">
                      {/* Corporate Identity Branding Subtext Element */}
                      <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60 select-none pointer-events-none leading-none block">
                        {projectRowItem.company_logo && (
                          <img
                            src={projectRowItem.company_logo}
                            alt=""
                            className="h-3.5 w-3.5 rounded border border-border/40 object-cover shrink-0 block"
                          />
                        )}
                        <span className="truncate block max-w-[180px] pt-0.5">{projectRowItem.company_name}</span>
                      </div>

                      <h2 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug uppercase tracking-wide block">
                        {projectRowItem.title}
                      </h2>

                      {(projectRowItem.summary || projectRowItem.seo_description) && (
                        <p className="text-[11px] text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-0.5 font-medium">
                          {projectRowItem.summary ?? projectRowItem.seo_description}
                        </p>
                      )}
                    </div>

                    {/* Foot Metric Capsule Details Selection Track */}
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-primary border-t border-border/5 pt-2.5 w-full shrink-0 select-none pointer-events-none leading-none tabular-nums">
                      {projectRowItem.category && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-[9px] font-extrabold uppercase tracking-wide rounded border border-border/40 select-none shrink-0 pointer-events-none h-4.5 px-1 bg-muted/50 text-muted-foreground/60 leading-none pt-0.5"
                        >
                          {projectRowItem.category}
                        </Badge>
                      )}
                      <span className="ml-auto block pt-0.5 font-semibold text-right">
                        {projectRowItem.budget_credits.toLocaleString()} {projectRowItem.currency_display}
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
