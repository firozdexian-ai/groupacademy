import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicTalentProfile } from "@/domains/profile/repo/profileRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  Award,
  Trophy,
  ExternalLink,
  Linkedin,
  Globe,
  Lock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Layers,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  foundational: { icon: BadgeCheck, label: "Foundational", tone: "text-primary bg-primary/5 border-primary/20" },
  proficient: { icon: Award, label: "Proficient", tone: "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" },
  expert: { icon: Trophy, label: "Expert", tone: "text-amber-500 bg-amber-500/5 border-amber-500/20" },
};

/**
 * Group Academy: Authoritative Public Talent Profile Mirror Node (PublicTalentProfile)
 * Hardened responsive identity page isolating OpenGraph context scripts and securing DOM nodes against side-effect memory leaks.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Locked
 */
export default function PublicTalentProfile() {
  const { handle: unverifiedRouteHandleStr } = useParams<{ handle: string }>();

  const [isPipelineResolving, setIsPipelineResolving] = React.useState<boolean>(true);
  const [profileDataPayload, setProfileDataPayload] = React.useState<any>(null);

  // =========================================================================
  // LIFECYCLE SECTOR 1: ISOLATED RPC NETWORK FETCH AND DATA INTEGRITY
  // =========================================================================
  React.useEffect(() => {
    if (!unverifiedRouteHandleStr) {
      setIsPipelineResolving(false);
      return;
    }

    let isThreadActiveAndValid = true;
    setIsPipelineResolving(true);

    const executeProfileRegistryLookup = async () => {
      try {
        const outputProfilePayload = await getPublicTalentProfile<any>(unverifiedRouteHandleStr);

        if (!isThreadActiveAndValid) return;

        setProfileDataPayload(outputProfilePayload ?? null);
      } catch (fatalExecutionException) {
        if (isThreadActiveAndValid) setProfileDataPayload(null);
      }
      {
        if (isThreadActiveAndValid) setIsPipelineResolving(false);
      }
    };

    executeProfileRegistryLookup();

    return () => {
      isThreadActiveAndValid = false;
    };
  }, [unverifiedRouteHandleStr]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: SYMMETRIC HEAD METADATA & SCHEMA DISCLOSURE SYNCHRONIZER
  // =========================================================================
  React.useEffect(() => {
    if (!profileDataPayload) return;

    const isolatedProfileNode = profileDataPayload;
    const computedPageTitleStr = `${isolatedProfileNode.full_name} — Group Academy Profile Portfolio`;
    const computedDescriptionStr =
      isolatedProfileNode.bio ??
      `${isolatedProfileNode.full_name} profile on Group Academy — verified development skills and curriculum mastery.`;

    // Step A: Stabilize standard window landmarks safely
    document.title = computedPageTitleStr;

    // Step B: Reconcile base description meta nodes defensively
    let primaryDescriptionMetaNode = document.head.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!primaryDescriptionMetaNode) {
      primaryDescriptionMetaNode = document.createElement("meta");
      primaryDescriptionMetaNode.name = "description";
      document.head.appendChild(primaryDescriptionMetaNode);
    }
    primaryDescriptionMetaNode.content = computedDescriptionStr;

    // Step C: Inject insulated social context graphs symmetrically to neutralize duplicate leaks
    const socialOpenGraphTagsMatrix = [
      ["og:title", computedPageTitleStr],
      ["og:description", computedDescriptionStr],
      ["og:type", "profile"],
      ["og:image", isolatedProfileNode.profile_photo_url ?? ""],
      ["twitter:card", "summary_large_image"],
    ];

    const structuralCreatedMetaNodesArray: HTMLMetaElement[] = [];

    socialOpenGraphTagsMatrix.forEach(([propertyKeyString, variableContentString]) => {
      // Clean up pre-existing duplicates ahead of appending actions
      const lingeringNode = document.head.querySelector(`meta[property="${propertyKeyString}"]`);
      if (lingeringNode) document.head.removeChild(lingeringNode);

      const dynamicMetaNodeElement = document.createElement("meta");
      dynamicMetaNodeElement.setAttribute("property", propertyKeyString);
      dynamicMetaNodeElement.setAttribute("content", variableContentString);
      document.head.appendChild(dynamicMetaNodeElement);
      structuralCreatedMetaNodesArray.push(dynamicMetaNodeElement);
    });

    // Step D: Construct schema organization entity profiles cleanly
    let targetStructuredScriptNode = document.getElementById("ld-talent-profile-graph") as HTMLScriptElement | null;
    if (!targetStructuredScriptNode) {
      targetStructuredScriptNode = document.createElement("script");
      targetStructuredScriptNode.id = "ld-talent-profile-graph";
      targetStructuredScriptNode.type = "application/ld+json";
      document.head.appendChild(targetStructuredScriptNode);
    }

    const structuredPersonJsonLdGraph = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: isolatedProfileNode.full_name,
      description: computedDescriptionStr,
      image: isolatedProfileNode.profile_photo_url || undefined,
      jobTitle: isolatedProfileNode.profession || undefined,
      address: isolatedProfileNode.country
        ? { "@type": "PostalAddress", addressCountry: isolatedProfileNode.country }
        : undefined,
      sameAs: [isolatedProfileNode.linkedin_url, isolatedProfileNode.portfolio_url].filter(Boolean),
      hasCredential: [
        ...(isolatedProfileNode.credentials ?? []).map((credentialNodeItem: any) => ({
          "@type": "EducationalOccupationalCredential",
          name: credentialNodeItem.topic_tag.replace(/_/g, " ").toUpperCase(),
          credentialCategory: credentialNodeItem.level,
          recognizedBy: { "@type": "Organization", name: "Group Academy" },
          url: `${window.location.origin}/verify/skill/${credentialNodeItem.verify_code}`,
        })),
        ...(isolatedProfileNode.tracks_completed ?? []).map((trackNodeItem: any) => ({
          "@type": "EducationalOccupationalCredential",
          name: trackNodeItem.track_title,
          credentialCategory: "track",
          recognizedBy: {
            "@type": "Organization",
            name: trackNodeItem.sponsor_company_name ?? "Group Academy",
          },
          url: trackNodeItem.certificate_code
            ? `${window.location.origin}/verify/${trackNodeItem.certificate_code}`
            : undefined,
        })),
      ],
    };

    targetStructuredScriptNode.text = JSON.stringify(structuredPersonJsonLdGraph);

    // Step E: Trigger explicit cleanups to keep the DOM isolated
    return () => {
      structuralCreatedMetaNodesArray.forEach((metaNodeItem) => {
        if (metaNodeItem.parentNode) document.head.removeChild(metaNodeItem);
      });
      if (targetStructuredScriptNode && targetStructuredScriptNode.parentNode) {
        document.head.removeChild(targetStructuredScriptNode);
      }
    };
  }, [profileDataPayload]);

  // =========================================================================
  // INTERCEPT CONTROLLERS: SCREEN LEVEL ROUTING GATES
  // =========================================================================
  if (isPipelineResolving) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4 text-left antialiased block w-full">
        <Skeleton className="h-32 w-full rounded-lg shrink-0" />
        <Skeleton className="h-44 w-full rounded-lg shrink-0" />
      </div>
    );
  }

  if (!profileDataPayload) {
    return (
      <div
        role="alert"
        className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Lock className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Profile Not Found</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              This profile is private or the link is incorrect.
            </p>
          </div>
          <Button
            type="button"
            asChild
            variant="outline"
            className="h-8 rounded-lg text-sm font-medium tracking-wider cursor-pointer"
          >
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const identityRecordNode = profileDataPayload;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-12 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: PROFILE PRIMARY IDENTITY SHIELD HERO */}
      <Card className="rounded-xl border border-border/60 bg-card/40 overflow-hidden shadow-none block w-full">
        {identityRecordNode.cover_image_url && (
          <div
            role="img"
            aria-label="Profile cover image"
            className="h-24 w-full bg-cover bg-center block pointer-events-none select-none border-b border-border/5"
            style={{ backgroundImage: `url(${identityRecordNode.cover_image_url})` }}
          />
        )}
        <CardContent
          className={cn("p-4 space-y-3 block w-full leading-none", identityRecordNode.cover_image_url ? "-mt-8" : "")}
        >
          <Avatar className="h-16 w-16 rounded-lg border border-border/40 bg-background text-base shrink-0 select-none pointer-events-none shadow-xs">
            <AvatarImage src={identityRecordNode.profile_photo_url ?? undefined} className="object-cover" />
            <AvatarFallback className="font-extrabold text-primary bg-muted rounded-none uppercase">
              {identityRecordNode.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1 block leading-none">
            <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
              {identityRecordNode.full_name}
            </h1>
            {identityRecordNode.profession && (
              <p className="text-xs font-semibold text-muted-foreground/70 leading-none block">
                {identityRecordNode.profession}
              </p>
            )}
            {identityRecordNode.country && (
              <p className="font-mono text-sm font-medium tracking-wide text-muted-foreground/40 inline-flex items-center gap-1 mt-0.5 select-text">
                <MapPin className="h-3 w-3 stroke-[2.2]" /> {identityRecordNode.country}
              </p>
            )}
          </div>

          {identityRecordNode.bio && (
            <p className="text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed select-text block pt-0.5">
              {identityRecordNode.bio}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1 flex-wrap w-full block">
            {identityRecordNode.linkedin_url && (
              <Button
                asChild
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-sm font-medium tracking-wider px-3 gap-1.5 cursor-pointer"
              >
                <a href={identityRecordNode.linkedin_url} target="_blank" rel="noreferrer">
                  <Linkedin className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground stroke-[1.8]" />{" "}
                  LinkedIn
                </a>
              </Button>
            )}
            {identityRecordNode.portfolio_url && (
              <Button
                asChild
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-sm font-medium tracking-wider px-3 gap-1.5 cursor-pointer"
              >
                <a href={identityRecordNode.portfolio_url} target="_blank" rel="noreferrer">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground stroke-[1.8]" />{" "}
                  Core Portfolio
                </a>
              </Button>
            )}
            <Button
              asChild
              type="button"
              size="sm"
              className="h-8 rounded-lg text-sm font-medium tracking-wider ml-auto px-3 gap-1 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
            >
              <Link to={`/app/talents/${identityRecordNode.id}`}>
                <span>Request Connection</span> <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
              </Link>
            </Button>
          </div>

          {Number(identityRecordNode.learning_recency_score ?? 0) >= 0.7 && (
            <div className="pt-1.5 block select-none pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 h-4.5 pt-1 leading-none shrink-0">
                <Activity className="h-2.5 w-2.5 stroke-[2.5]" /> Active Learner
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HUD LEVEL 2: COMPOSITE COMPLETED ACADEMIC TRACK CURRICULUMS */}
      {identityRecordNode.show_credentials && identityRecordNode.tracks_completed?.length > 0 && (
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden">
          <CardContent className="p-4 space-y-3 block w-full leading-none">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/10 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-500 stroke-[2.2]" />
              <span>Completed Courses ({identityRecordNode.tracks_completed.length})</span>
            </h2>
            <ul className="space-y-2 p-0 m-0 block w-full list-none">
              {identityRecordNode.tracks_completed.map((trackItemNode: any, structuralIdxNum: number) => (
                <li
                  key={`completed-track-node-row-${trackItemNode.track_title}-${structuralIdxNum}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 p-2 leading-none block w-full"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {trackItemNode.sponsor_company_logo ? (
                      <img
                        src={trackItemNode.sponsor_company_logo}
                        alt=""
                        className="h-7 w-7 rounded border border-border/40 object-cover shrink-0 block pointer-events-none select-none"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded border border-border/40 bg-muted/60 text-muted-foreground/40 flex items-center justify-center shrink-0 block pointer-events-none select-none">
                        <Layers className="h-4 w-4 stroke-[2.2]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 leading-none space-y-1 block">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate block select-text uppercase tracking-wide pt-0.5">
                        {trackItemNode.track_title}
                      </p>
                      {trackItemNode.sponsor_company_name && (
                        <p className="text-[10px] font-mono font-bold text-muted-foreground/50 truncate block select-text leading-none uppercase">
                          Sponsored by: {trackItemNode.sponsor_company_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {trackItemNode.certificate_code && (
                    <Link
                      to={`/verify/${trackItemNode.certificate_code}`}
                      className="font-mono text-sm font-medium tracking-wider text-primary hover:text-primary/80 inline-flex items-center gap-0.5 shrink-0 select-none"
                    >
                      <span>Verify</span> <ExternalLink className="h-3 w-3 stroke-[2.2]" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 3: SHIELD VERIFIED PROFICIENCY MASTERY CREDENTIALS */}
      {identityRecordNode.show_credentials && identityRecordNode.credentials?.length > 0 && (
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden">
          <CardContent className="p-4 space-y-3 block w-full leading-none">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/10 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[2.2]" />
              <span>Verified Skills ({identityRecordNode.credentials.length})</span>
            </h2>
            <div className="space-y-2 block w-full">
              {identityRecordNode.credentials.map((skillNodeItem: any) => {
                const targetLevelMetaMapObj = LEVEL_META[skillNodeItem.level] || LEVEL_META.foundational;
                const SkillProficiencyIconNode = targetLevelMetaMapObj.icon;

                return (
                  <div
                    key={`verified-skill-record-node-${skillNodeItem.id}`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-2 leading-none block w-full transform-gpu transition-colors duration-100",
                      targetLevelMetaMapObj.tone,
                    )}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="h-7 w-7 rounded bg-background/50 border border-current/10 flex items-center justify-center shrink-0 block select-none pointer-events-none shadow-2xs">
                        <SkillProficiencyIconNode className="h-4 w-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1 leading-none space-y-1 block">
                        <p className="text-xs sm:text-sm font-bold truncate uppercase tracking-wide text-foreground/90 pt-0.5 select-text">
                          {skillNodeItem.topic_tag.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-medium opacity-70 truncate block select-text max-w-xs leading-none">
                          {targetLevelMetaMapObj.label} · {skillNodeItem.course_title ?? "Cross-Course Framework"} ·{" "}
                          <span className="font-mono font-bold tabular-nums">
                            {Math.round(Number(skillNodeItem.mastery_at_issue) * 100)}% Mastery
                          </span>
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/verify/skill/${skillNodeItem.verify_code}`}
                      className="font-mono text-sm font-medium tracking-wider inline-flex items-center gap-0.5 shrink-0 select-none hover:opacity-80"
                    >
                      <span>Verify</span> <ExternalLink className="h-3 w-3 stroke-[2.2]" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 4: LEARNING MASTERY MATRIX HISTOGRAM CHARTS */}
      {identityRecordNode.show_mastery &&
        identityRecordNode.mastery &&
        identityRecordNode.mastery.tracked_topics > 0 && (
          <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden">
            <CardContent className="p-4 space-y-3 block w-full leading-none">
              <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/10">
                Skill Mastery
              </h2>
              <div className="grid grid-cols-2 gap-2 text-left select-none pointer-events-none block w-full font-sans shadow-2xs">
                <div className="rounded-lg bg-muted/40 border border-border/5 p-3 leading-none space-y-1 block">
                  <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block">
                    Topics Tracked
                  </p>
                  <p className="text-lg sm:text-xl font-black font-mono text-foreground tabular-nums pt-0.5">
                    {identityRecordNode.mastery.tracked_topics}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 border border-border/5 p-3 leading-none space-y-1 block">
                  <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block">
                    Avg Mastery Index
                  </p>
                  <p className="text-lg sm:text-xl font-black font-mono text-foreground tabular-nums pt-0.5">
                    {Math.round(Number(identityRecordNode.mastery.avg_mastery) * 100)}%
                  </p>
                </div>
              </div>

              {identityRecordNode.mastery.top_strengths?.length > 0 && (
                <div className="space-y-1.5 mt-2 block w-full">
                  <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block select-none pointer-events-none leading-none">
                    Top Strengths
                  </p>
                  <div className="flex flex-wrap gap-1.5 w-full block">
                    {identityRecordNode.mastery.top_strengths.map((strengthNodeItem: any) => (
                      <span
                        key={`strength-vector-pill-${strengthNodeItem.topic_tag}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 h-4.5 pt-1 leading-none shrink-0 select-text tabular-nums"
                      >
                        {strengthNodeItem.topic_tag.replace(/_/g, " ")} ·{" "}
                        {Math.round(Number(strengthNodeItem.mastery) * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* GLOBAL FOOTER DISCLOSURE MARKERS */}
      <p className="text-center font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 pt-2 select-none pointer-events-none leading-none">
        Powered by{" "}
        <Link
          to="/"
          className="font-sans font-semibold text-primary hover:text-primary/80 pointer-events-auto cursor-pointer normal-case tracking-normal text-xs"
        >
          GroUp Academy
        </Link>
      </p>
    </div>
  );
}
