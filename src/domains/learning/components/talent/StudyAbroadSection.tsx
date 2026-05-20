import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Globe, GraduationCap, BookOpen, Map, MessageCircle, FileText, Coins, ArrowRight } from "lucide-react";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

const POPULAR_DESTINATIONS = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code),
);

/**
 * GroUp Academy: Study Abroad Trajectory Portal (StudyAbroadSection)
 * An authoritative sub-view integrated into Arena channels filtering global university access and IELTS calibration lines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function StudyAbroadSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roadmapCost = useMemo(() => {
    return CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100;
  }, []);

  // Monitor international trajectory section impressions safely via telemetry logs
  useEffect(() => {
    trackEvent("study_abroad_arena_section_mounted", { optionsCount: POPULAR_DESTINATIONS.length });
  }, []);

  const handleGlobalNavigationTrigger = async (destinationPath: string, actionLabelId: string) => {
    if (!destinationPath) return;
    trackEvent("study_abroad_navigation_executed", { actionLabel: actionLabelId, targetUrl: destinationPath });

    try {
      // Automated Efficiency: Synchronize cache indices globally to avoid state drift across shared loops
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(destinationPath);
    } catch (err) {
      trackError(err, {
        component: "StudyAbroadSection",
        action: "execute_global_navigation_callback",
        targetUrl: destinationPath,
      });
    }
  };

  return (
    <div className="space-y-4 text-left antialiased max-w-full w-full select-none sm:select-text transform-gpu">
      {/* HUD HEADER: PORTAL SECTION INDEX INDICATOR */}
      <div className="flex items-center gap-2.5 px-0.5 select-none w-full leading-none">
        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm">
          <Globe className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide">
            Global Study Abroad Ingress
          </h2>
          <p className="text-[11px] font-semibold text-muted-foreground/80 mt-1 leading-none">
            Ecosystem Universities Catalog, IELTS Mock Calibration & 12-Month Roadmaps
          </p>
        </div>
      </div>

      {/* COMPONENT VECTOR A: AI SPECIALIST CHANNELS DISPATCH INTERCEPT CARD */}
      <Card

        className="group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring w-full overflow-hidden transition-all duration-300 hover:border-primary/20 hover:bg-card/80"
        onClick={() => handleGlobalNavigationTrigger("/app/agents?category=abroad", "country_specialist_agent")}
      >
        <CardContent className="p-3.5 flex items-center gap-3.5 w-full min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-102 transition-transform">
            <MessageCircle className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5text-left flex flex-col justify-center leading-none">
            <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none group-hover:text-primary transition-colors">
              Consult an AI Country Specialist Advisor
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight pr-1 italic mt-1 select-text">
              USA, UK, Canada, Australia, Germany, Singapore, Sweden and matching bounds
            </p>
          </div>

          <Badge
            variant="outline"
            className="text-[9px] font-extrabold px-1.5 h-4.5 bg-primary/5 text-primary border-primary/20 tracking-wider uppercase select-none rounded shrink-0 leading-none"
          >
            AI Core
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5] shrink-0" />
        </CardContent>
      </Card>

      {/* COMPONENT VECTOR B: UNIVERSITIES VS IELTS TWO-COLUMN ACADEMIC BLOCK */}
      <div className="grid grid-cols-2 gap-3 w-full min-w-0 select-none">
        {/* SUB-BLOCK B1: UNIVERSITIES DIRECTORY INDEX */}
        <Card

          className="group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden transition-all duration-300 hover:border-primary/20 hover:bg-card/80 w-full"
          onClick={() => handleGlobalNavigationTrigger("/app/abroad/study", "universities_catalog_hub")}
        >
          <CardContent className="p-3.5 space-y-3 w-full flex flex-col justify-center">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-2 transition-transform">
              <GraduationCap className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
            </div>
            <div className="space-y-0.5 flex flex-col justify-center leading-none w-full min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none group-hover:text-primary transition-colors">
                Institutions
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight italic mt-1 block">
                Browse profiles & scholarship metrics
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SUB-BLOCK B2: IELTS PREPARATION TRACK ENVIRONMENT */}
        <Card

          className="group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden transition-all duration-300 hover:border-primary/20 hover:bg-card/80 w-full"
          onClick={() => handleGlobalNavigationTrigger("/app/abroad/ielts", "ielts_preparation_hub")}
        >
          <CardContent className="p-3.5 space-y-3 w-full flex flex-col justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-2 transition-transform">
              <BookOpen className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5 flex flex-col justify-center leading-none w-full min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none group-hover:text-primary transition-colors">
                IELTS Matrix
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight italic mt-1 block">
                Calibration reviews & simulated tests
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COMPONENT VECTOR C: DESTINATION REGIONAL SELECTOR STREAM BOX */}
      <section className="space-y-2 w-full min-w-0">
        <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none">
          Browse Mapped Destined Regions
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full select-none">
          {POPULAR_DESTINATIONS.map((countryNodeItem) => {
            if (!countryNodeItem || !countryNodeItem.code) return null;
            return (
              <Card
                key={countryNodeItem.code}

                className="group relative cursor-pointer rounded-xl border border-border/40 bg-background/40 hover:bg-background backdrop-blur-sm transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring transform-gpu flex flex-col items-center justify-center p-2 text-center"
                onClick={() =>
                  handleGlobalNavigationTrigger(
                    `/app/abroad/study?country=${countryNodeItem.code}`,
                    `country_flag_node_${countryNodeItem.code}`,
                  )
                }
              >
                <CardContent className="p-1 flex flex-col items-center justify-center text-center gap-1.5 w-full min-w-0 leading-none">
                  <span
                    className="text-xl leading-none drop-shadow-sm transition-transform group-hover:scale-105 select-none"
                    role="img"
                    aria-label={`National flag emblem indicator for ${countryNodeItem.name}`}
                  >
                    {getCountryFlag(countryNodeItem.code)}
                  </span>
                  <span className="text-[10px] font-bold text-foreground/80 tracking-tight text-center line-clamp-1 truncate w-full block pr-0.5 leading-none select-text selection:bg-primary/10">
                    {countryNodeItem.name}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* COMPONENT VECTOR D: 12-MONTH STRATEGIC ROADMAP FORMS BOARD */}
      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent shadow-sm overflow-hidden text-left w-full">
        <CardContent className="p-4 space-y-4 w-full min-w-0">
          <div className="flex items-start gap-3.5 w-full min-w-0 select-none">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/10">
              <Map className="h-5 w-5 text-primary-foreground stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
              <h3 className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight uppercase tracking-wide leading-none">
                Synthesize Mapped 12-Month Roadmap
              </h3>
              <p className="text-[11px] font-semibold text-muted-foreground/80 mt-1.5 leading-normal tracking-tight italic">
                Custom structured timeline matrix: institution shortlisting thresholds, targeted IELTS curves, budgetary
                allocation nodes, and visa ingress guidance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full select-none font-bold text-xs">
            <Button
              variant="outline"
              size="sm"

              className="h-9 rounded-xl font-bold text-xs border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors gap-1.5 shadow-sm cursor-pointer"
              onClick={() => handleGlobalNavigationTrigger("/app/agents/study-abroad-advisor", "roadmap_chat_advisor")}
            >
              <MessageCircle className="h-4 w-4 text-primary shrink-0 stroke-[2.2]" />
              <span>Consult Advisor</span>
            </Button>

            <Button
              size="sm"

              className="h-9 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-transform gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleGlobalNavigationTrigger("/app/abroad/roadmap", "roadmap_intake_form")}
            >
              <FileText className="h-4 w-4 text-primary-foreground shrink-0 stroke-[2.5]" />
              <span>Initialize Ledger Ingress</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/60 select-none leading-none tabular-nums pl-0.5">
            <Coins className="h-3.5 w-3.5 text-amber-500 stroke-[2.2] shrink-0" />
            <span>
              Processing ledger invokes transactional check debit of{" "}
              <span className="text-primary font-black">{roadmapCost.toLocaleString()} credits</span> from account index
              bounds
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
