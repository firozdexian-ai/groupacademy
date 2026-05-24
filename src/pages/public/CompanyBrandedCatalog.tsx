import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getCompanyBrandedCatalog } from "@/domains/ugc/repo/ugcRepo";
import { Building2, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandedCatalog {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    banner_url: string | null;
    tagline: string | null;
  };
  tracks: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    cover_url: string | null;
    enrollment_credits: number;
    item_count: number;
  }>;
}

/**
 * GroUp Academy: Authoritative Enterprise Branded Catalog Explorer (CompanyBrandedCatalog)
 * Hardened responsive page node isolating metadata updates and securing network endpoints against uninsulated routing inputs.
 * Version: Launch Candidate · Phase Z0 Execution Stability Locked
 */
export default function CompanyBrandedCatalog() {
  const { slug: unverifiedRouteSlugString } = useParams<{ slug: string }>();

  const [catalogPayloadState, setCatalogPayloadState] = React.useState<BrandedCatalog | null>(null);
  const [isProcessingNetworkRequest, setIsProcessingNetworkRequest] = React.useState<boolean>(true);

  // =========================================================================
  // LIFECYCLE SECTOR 1: DATA LAYER FETCH HANDSHAKE WITH CLEANUP ANCHORS
  // =========================================================================
  React.useEffect(() => {
    if (!unverifiedRouteSlugString) {
      setCatalogPayloadState(null);
      setIsProcessingNetworkRequest(false);
      return;
    }

    let isExecutionTrackActive = true;
    setIsProcessingNetworkRequest(true);

    const executeAsynchronousHandshakeLookup = async () => {
      try {
        const outputPayload = await getCompanyBrandedCatalog<BrandedCatalog>(unverifiedRouteSlugString);

        if (!isExecutionTrackActive) return;

        setCatalogPayloadState(outputPayload ?? null);
      } catch (unhandledTerminalException) {
        if (isExecutionTrackActive) setCatalogPayloadState(null);
      } finally {
        if (isExecutionTrackActive) setIsProcessingNetworkRequest(false);
      }
    };

    executeAsynchronousHandshakeLookup();

    return () => {
      isExecutionTrackActive = false;
    };
  }, [unverifiedRouteSlugString]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: DETACHED METADATA & STRUCTURED JSON-LD UPDATE MATRIX
  // =========================================================================
  React.useEffect(() => {
    if (!catalogPayloadState?.company) return;

    const validatedCompanyNode = catalogPayloadState.company;
    const computedDocumentTitleString = `${validatedCompanyNode.name} · Learning Catalog`;
    const computedMetaDescriptionString =
      validatedCompanyNode.tagline ??
      `Explore verified enterprise academic learning tracks authored by ${validatedCompanyNode.name}.`;

    // Step A: Stabilize document page root elements
    document.title = computedDocumentTitleString;

    // Step B: Reconcile description tracking configurations defensively
    let descriptionMetaTagNode = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descriptionMetaTagNode) {
      descriptionMetaTagNode = document.createElement("meta");
      descriptionMetaTagNode.name = "description";
      document.head.appendChild(descriptionMetaTagNode);
    }
    descriptionMetaTagNode.content = computedMetaDescriptionString;

    // Step C: Inject schema graphs safely to reinforce semantic optimization profiles
    let embeddedStructuredScriptElement = document.getElementById("ld-branded-catalog") as HTMLScriptElement | null;
    if (!embeddedStructuredScriptElement) {
      embeddedStructuredScriptElement = document.createElement("script");
      embeddedStructuredScriptElement.id = "ld-branded-catalog";
      embeddedStructuredScriptElement.type = "application/ld+json";
      document.head.appendChild(embeddedStructuredScriptElement);
    }

    const structuredGraphPayloadPayload = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: computedDocumentTitleString,
      description: computedMetaDescriptionString,
      itemListElement: (catalogPayloadState.tracks || []).map((trackItemNode, arrayIndexPosition) => ({
        "@type": "Course",
        position: arrayIndexPosition + 1,
        name: trackItemNode.title,
        description: trackItemNode.summary ?? "No abstract provided for this academic syllabus entry segment.",
        provider: {
          "@type": "Organization",
          name: validatedCompanyNode.name,
        },
      })),
    };

    embeddedStructuredScriptElement.text = JSON.stringify(structuredGraphPayloadPayload);
  }, [catalogPayloadState]);

  // =========================================================================
  // CONDITION FLAGS: RENDER INTERCEPT HOOK BLOCKS
  // =========================================================================
  if (isProcessingNetworkRequest) {
    return (
      <div
        role="status"
        className="min-h-screen grid place-items-center bg-background font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
      >
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-muted-foreground/80 animate-spin shrink-0" />
          <span>Loading catalog...</span>
        </div>
      </div>
    );
  }

  if (!catalogPayloadState?.company) {
    return (
      <div
        role="alert"
        className="min-h-screen grid place-items-center bg-background text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-10 w-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/60 mx-auto pointer-events-none">
            <Building2 className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Handshake Refused</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The targeted company node could not be resolved within the global schema register lookup parameters.
            </p>
          </div>
          <Link
            to="/"
            className="h-8 px-4 rounded-lg inline-flex items-center justify-center text-sm font-medium tracking-wider bg-accent text-accent-foreground border border-border/40 transition-colors hover:bg-muted"
          >
            Return to Core Index Grid
          </Link>
        </div>
      </div>
    );
  }

  const activeCompanyRecord = catalogPayloadState.company;
  const isSyllabusTrackRegistryEmpty = !catalogPayloadState.tracks || catalogPayloadState.tracks.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 antialiased block transform-gpu text-left w-full">
      {/* HUD LEVEL 1: BRANDED HERO BANNER SECTOR */}
      <header className="relative w-full block border-b border-border/40 overflow-hidden select-none">
        {activeCompanyRecord.banner_url ? (
          <img
            src={activeCompanyRecord.banner_url}
            alt=""
            aria-hidden="true"
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover block pointer-events-none"
          />
        ) : (
          <div className="w-full h-24 sm:h-32 md:h-40 bg-linear-to-br from-muted/50 via-muted/20 to-background block pointer-events-none" />
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 md:-mt-12 relative block z-10">
          <div className="flex items-end gap-3.5 sm:gap-4 w-full">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl sm:rounded-2xl bg-card border border-border/80 shadow-md overflow-hidden grid place-items-center shrink-0 pointer-events-none">
              {activeCompanyRecord.logo_url ? (
                <img
                  src={activeCompanyRecord.logo_url}
                  alt={`${activeCompanyRecord.name} corporate badge`}
                  className="h-full w-full object-cover block"
                />
              ) : (
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40 stroke-[2.2]" />
              )}
            </div>

            <div className="pb-1 sm:pb-2 min-w-0 leading-none space-y-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground uppercase tracking-wide truncate block">
                {activeCompanyRecord.name}
              </h1>
              {activeCompanyRecord.tagline && (
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block select-text">
                  {activeCompanyRecord.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HUD LEVEL 2: COMPOSITE SYLLABUS DIRECTORY GRID */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10 block w-full">
        <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-3 sm:pb-4 border-b border-border/10">
          Published Learning Tracks
        </h2>

        {isSyllabusTrackRegistryEmpty ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none mt-4 block">
            <BookOpen className="h-6 w-6 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
            <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
              No academic course programs or instruction syllabi have been distributed under this node yet.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4 mt-4 block w-full">
            {catalogPayloadState.tracks.map((trackNodeItem) => (
              <Link
                key={`syllabus-track-card-${trackNodeItem.id}`}
                to={`/auth?returnTo=/gro10x/learn/tracks/${trackNodeItem.slug}`}
                className="group rounded-xl border border-border/60 bg-card/40 overflow-hidden block transition-all duration-150 hover:border-border-foreground/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring flex flex-col h-full shadow-xs"
              >
                <div className="relative w-full overflow-hidden select-none h-28 sm:h-32 shrink-0 pointer-events-none">
                  {trackNodeItem.cover_url ? (
                    <img
                      src={trackNodeItem.cover_url}
                      alt=""
                      className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-101"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-muted/30 to-background block" />
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1 leading-none justify-between gap-3">
                  <div className="space-y-1 block leading-none">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug uppercase tracking-wide block">
                      {trackNodeItem.title}
                    </h3>
                    {trackNodeItem.summary && (
                      <p className="text-[11px] text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-1 font-medium">
                        {trackNodeItem.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-muted-foreground/50 border-t border-border/5 pt-2 w-full shrink-0 select-none pointer-events-none leading-none">
                    <span className="tabular-nums">
                      {trackNodeItem.item_count} {trackNodeItem.item_count === 1 ? "COURSE CAPSULE" : "COURSE CAPSULES"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary font-sans font-bold uppercase tracking-wider text-[10px] group-hover:gap-1.5 transition-all">
                      <span>Enroll</span>
                      <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* HUD LEVEL 3: FOOTER ENDPOINT COMPLIANCE DISCLOSURE SLOTS */}
        <footer className="mt-12 sm:mt-16 pt-4 border-t border-border/10 select-none pointer-events-none block w-full text-center leading-none">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
            Sponsored by {activeCompanyRecord.name} · Powered by GroUp Academy Infrastructure Pipeline
          </p>
        </footer>
      </main>
    </div>
  );
}
