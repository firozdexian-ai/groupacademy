import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicProjectDetail, recordDiscoverySignal } from "@/domains/ugc/repo/ugcRepo";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, ArrowLeft, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Detail {
  project: {
    id: string;
    slug: string;
    seo_title: string | null;
    seo_description: string | null;
    og_image_url: string | null;
    case_study_md: string | null;
    featured_deliverables: unknown[];
    title: string;
    summary: string | null;
    category: string | null;
    budget_credits: number;
    currency_display: string;
    status: string;
    starts_at: string | null;
    due_at: string | null;
    view_count: number;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    tagline: string | null;
  };
  milestones: Array<{
    seq: number;
    title: string;
    status: string;
    due_at: string | null;
  }>;
  team: Array<{
    handle: string;
    name: string;
    photo: string | null;
  }>;
}

/**
 * GroUp Academy: Technical Project Specification Ledger (PublicProjectDetail)
 * Hardened responsive dashboard view isolating telemetry handshakes and safeguarding date transformations against hydration drift.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Analytics Sync Hardened
 */
export default function PublicProjectDetail() {
  const { slug: rawRouteSlugParameterStr } = useParams<{ slug: string }>();

  const [projectSpecificationData, setProjectSpecificationData] = React.useState<Detail | null>(null);
  const [isDataResolutionProcessing, setIsDataResolutionProcessing] = React.useState<boolean>(true);

  // =========================================================================
  // LIFECYCLE SECTOR 1: CORE DATA EXTRACTION WITH PIPELINE GATING
  // =========================================================================
  React.useEffect(() => {
    if (!rawRouteSlugParameterStr) {
      setIsDataResolutionProcessing(false);
      return;
    }

    let isThreadActiveAndValid = true;
    setIsDataResolutionProcessing(true);

    const executeProjectSpecificationHandshake = async () => {
      try {
        const outputHandshakePayload = await getPublicProjectDetail<Detail>(rawRouteSlugParameterStr);

        if (!isThreadActiveAndValid) return;

        setProjectSpecificationData(outputHandshakePayload ?? null);
      } catch (fatalPipelineException) {
        if (isThreadActiveAndValid) setProjectSpecificationData(null);
      } finally {
        if (isThreadActiveAndValid) setIsDataResolutionProcessing(false);
      }
    };

    executeProjectSpecificationHandshake();

    return () => {
      isThreadActiveAndValid = false;
    };
  }, [rawRouteSlugParameterStr]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: SYMMETRIC SEO HEAD METADATA & TELEMETRY DISPATCH
  // =========================================================================
  React.useEffect(() => {
    if (!projectSpecificationData?.project) return;

    const targetProjectRecord = projectSpecificationData.project;
    const associatedCompanyRecord = projectSpecificationData.company;

    const baseTitleString = `${targetProjectRecord.seo_title || targetProjectRecord.title} · ${associatedCompanyRecord.name}`;
    const baseDescriptionString =
      targetProjectRecord.seo_description || targetProjectRecord.summary || targetProjectRecord.title;

    setHead({
      title: baseTitleString,
      description: baseDescriptionString,
      image: targetProjectRecord.og_image_url ?? undefined,
      canonical: `https://groupacademy.online/projects/${rawRouteSlugParameterStr}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: targetProjectRecord.title,
        description: targetProjectRecord.summary ?? undefined,
        creator: {
          "@type": "Organization",
          name: associatedCompanyRecord.name,
        },
      },
      key: `project-detail-specification-${targetProjectRecord.id}`,
    });

    // Insulate reporting discovery tracks securely inside clean, synchronous event steps
    const dispatchDiscoveryTelemetrySignal = async () => {
      try {
        await recordDiscoverySignal({ kind: "project", id: targetProjectRecord.id, signal: "view" });
      } catch (suppressedException) {
        // Suppresses runtime logging noise cleanly to avoid bleeding into rendering thread
      }
    };

    dispatchDiscoveryTelemetrySignal();
  }, [projectSpecificationData, rawRouteSlugParameterStr]);

  // =========================================================================
  // CONDITION FLAGS: SCREEN LOADING AND INTERCEPT HOOK BLOCKS
  // =========================================================================
  if (isDataResolutionProcessing) {
    return (
      <div
        role="status"
        className="min-h-screen grid place-items-center bg-background font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 border-t-primary animate-spin shrink-0" />
          <span>Loading Project Details...</span>
        </div>
      </div>
    );
  }

  if (!projectSpecificationData?.project) {
    return (
      <div
        role="alert"
        className="min-h-screen grid place-items-center bg-background text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Inbox className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Project Not Found</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The requested project details could not be loaded.
            </p>
          </div>
          <Link
            to="/projects"
            className="h-8 px-3 rounded-lg inline-flex items-center justify-center text-sm font-medium tracking-wider bg-accent text-accent-foreground border border-border/40 transition-colors hover:bg-muted"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const { project, company, milestones, team } = projectSpecificationData;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 block text-left transform-gpu w-full">
      {/* HUD LEVEL 1: CONTROL GRID TRACK HEADER BAR */}
      <header className="border-b border-border/40 bg-card/10 block w-full select-none">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-12 flex items-center justify-between leading-none w-full">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
          >
            <ArrowLeft className="h-3 w-3 stroke-[2.2]" /> <span>All Projects</span>
          </Link>

          <Link
            to={`/c/${company.slug}/projects`}
            className="flex items-center gap-2 text-xs font-bold uppercase text-foreground/80 hover:text-primary transition-colors pointer-events-auto leading-none shrink-0"
          >
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt=""
                className="h-4.5 w-4.5 rounded border border-border/40 object-cover shrink-0 block pointer-events-none"
              />
            )}
            <span className="pt-0.5 block truncate max-w-[140px] sm:max-w-xs">{company.name}</span>
          </Link>
        </div>
      </header>

      {/* HUD LEVEL 2: DETAILED SPECIFICATION VIEWPORT CONTROLLER */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 block w-full">
        {/* Dynamic Display Cover Placement */}
        {project.og_image_url && (
          <div className="relative w-full overflow-hidden rounded-xl border border-border/60 select-none pointer-events-none shrink-0 block aspect-[21/9] bg-muted/20">
            <img
              src={project.og_image_url}
              alt={`${project.title} cover graphics`}
              className="w-full h-full object-cover block"
            />
          </div>
        )}

        {/* Compound Metadata Label Badges */}
        <div className="space-y-2 block leading-none w-full">
          <div className="flex items-center gap-2 flex-wrap select-none leading-none">
            {project.category && (
              <Badge
                variant="secondary"
                className="font-mono text-[9px] font-extrabold uppercase tracking-wide rounded px-1.5 h-5 pt-0.5 bg-muted/40 text-muted-foreground/80 border border-border/40 shrink-0 pointer-events-none"
              >
                {project.category}
              </Badge>
            )}
            <Badge className="font-mono text-[9px] font-extrabold uppercase tracking-wide rounded px-1.5 h-5 pt-0.5 shrink-0 pointer-events-none">
              {project.status.replace(/_/g, " ")}
            </Badge>
            <span className="font-mono text-xs font-bold text-primary tabular-nums shrink-0 pt-0.5">
              {project.budget_credits.toLocaleString()} {project.currency_display}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide text-foreground leading-tight select-text block pt-1">
            {project.title}
          </h1>
          {project.summary && (
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground/70 leading-relaxed max-w-2xl select-text block pt-0.5">
              {project.summary}
            </p>
          )}
        </div>

        {/* Narrative Case Abstract Document */}
        {project.case_study_md && (
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
            <CardContent className="p-4 sm:p-5 text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed select-text whitespace-pre-wrap block w-full tracking-normal">
              {project.case_study_md}
            </CardContent>
          </Card>
        )}

        {/* Sequential Milestone Pipeline Row Blocks */}
        {milestones.length > 0 && (
          <section className="block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/10">
              Milestones
            </h2>
            <div className="space-y-2 mt-3 block w-full">
              {milestones
                .sort((firstItem, secondItem) => firstItem.seq - secondItem.seq)
                .map((milestoneItemNode) => (
                  <Card
                    key={`milestone-row-index-${milestoneItemNode.seq}`}
                    className="rounded-lg border border-border/60 bg-card/20 shadow-none block w-full"
                  >
                    <CardContent className="p-3 flex items-center justify-between gap-3 text-xs leading-none w-full">
                      <span className="font-bold text-foreground/90 select-text truncate block pt-0.5">
                        <span className="font-mono font-extrabold text-[10px] text-muted-foreground/40 mr-2 select-none tabular-nums">
                          #{milestoneItemNode.seq.toString().padStart(2, "0")}
                        </span>
                        {milestoneItemNode.title}
                      </span>

                      <div className="flex items-center gap-3 font-mono font-bold text-[10px] sm:text-xs text-muted-foreground/40 shrink-0 select-none pointer-events-none leading-none">
                        {milestoneItemNode.due_at && (
                          <div className="flex items-center gap-1 shrink-0 tabular-nums uppercase">
                            <Calendar className="h-3 w-3 stroke-[2.2]" />
                            {/* Force lock static en-US formatting masks to suppress client hydration mismatch crashes */}
                            <span className="pt-0.5">
                              {new Date(milestoneItemNode.due_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                            </span>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[9px] font-extrabold px-1.5 h-4.5 rounded border border-border/40 select-none shrink-0 pointer-events-none bg-background/50 text-muted-foreground/60 leading-none"
                        >
                          {milestoneItemNode.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Assigned Squad Member Matrix Graph Grid */}
        {team.length > 0 && (
          <section className="block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/10">
              Assigned Team
            </h2>
            <div className="flex flex-wrap gap-2 mt-3 block w-full">
              {team.map(
                (memberRecordNode) =>
                  memberRecordNode.handle && (
                    <Link
                      to={`/t/${memberRecordNode.handle}`}
                      key={`assigned-member-badge-${memberRecordNode.handle}`}
                      className="inline-flex items-center gap-2 h-8 pl-2 pr-3 rounded-md border border-border/60 bg-card/40 text-xs font-bold text-foreground/80 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none cursor-pointer transition-colors hover:bg-accent hover:text-foreground shrink-0 leading-none transform-gpu active:scale-[0.985]"
                    >
                      {memberRecordNode.photo ? (
                        <img
                          src={memberRecordNode.photo}
                          alt=""
                          className="h-5 w-5 rounded border border-border/20 object-cover shrink-0 block pointer-events-none shadow-2xs"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded bg-muted border border-border/40 font-mono text-[9px] font-black text-primary grid place-items-center uppercase shrink-0">
                          {memberRecordNode.name.charAt(0)}
                        </div>
                      )}
                      <span className="pt-0.5 block">{memberRecordNode.name}</span>
                    </Link>
                  ),
              )}
            </div>
          </section>
        )}

        {/* Ingress Sector CTA Lead Router Container */}
        <Card className="rounded-xl border border-border/60 bg-linear-to-r from-card via-card/50 to-background shadow-none block w-full mt-8">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full text-left leading-none">
            <div className="leading-none space-y-1 block select-none pointer-events-none">
              <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                Need a team for your project?
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block">
                Publish your project roadmap and hire talent on GroUp Academy.
              </p>
            </div>

            <Button
              type="button"
              asChild
              className="h-9 px-4 rounded-lg font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transform-gpu active:scale-[0.985] self-start sm:self-center shrink-0 cursor-pointer"
            >
              <Link to="/gro10x">
                <span>Get Started</span>
                <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
