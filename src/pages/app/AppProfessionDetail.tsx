import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProfessionTrackBySlug,
  getActiveInstructorForProfession,
  listPublishedContentForProfession,
} from "@/domains/talent/repo/talentRepo";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  Coins,
  Zap,
  ChevronRight,
  Clock,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface SchoolRelation {
  name: string;
  academies: { name: string } | null;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_audience: string;
  career_outcome: string;
  credit_cost: number | null;
  schools: SchoolRelation | null;
}

interface AIInstructor {
  id: string;
  name: string;
  persona: string;
  expertise_areas: string[];
}

interface CourseLevelRelation {
  name: string;
  slug: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  estimated_hours: number;
  modules_count: number;
  credit_cost: number | null;
  profession_levels: CourseLevelRelation | null;
}

/**
 * GroUp Academy: Specialist Profession Career Track Cockpit (AppProfessionDetail)
 * Hardened track hub managing concurrent instructor chats, compiling segmented course arrays, and anchoring credit allocation HUD metrics.
 * Version: Launch Candidate · Phase Z1 Architecture Matrix Sealed
 */
export default function AppProfessionDetail() {
  const { slug: unverifiedTrackSlugStr } = useParams<{ slug: string }>();
  const navigateHook = useNavigate();

  const [professionRecordState, setProfessionRecordState] = React.useState<ProfessionLine | null>(null);
  const [aiInstructorState, setAIInstructorState] = React.useState<AIInstructor | null>(null);
  const [coursesRegistryPayload, setCoursesRegistryPayload] = React.useState<Course[]>([]);

  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
  const [isInstructorChatOpen, setIsInstructorChatOpen] = React.useState<boolean>(false);
  const [synchronizationErrorStr, setSynchronizationErrorStr] = React.useState<string | null>(null);

  // =========================================================================
  // LIFECYCLE SECTOR 1: RELATIONAL HANDSHAKE WATERFALL CONTEXT CLEANUP HOOKS
  // =========================================================================
  const synchronizeProfessionTrackInventory = React.useCallback(
    async (isThreadActiveFlag: { current: boolean }) => {
      if (!unverifiedTrackSlugStr) return;

      setSynchronizationErrorStr(null);
      setIsDataLayerLoading(true);

      try {
        const professionQueryPayload = await getProfessionTrackBySlug(unverifiedTrackSlugStr);

        if (!professionQueryPayload) {
          if (isThreadActiveFlag.current) {
            setProfessionRecordState(null);
            setIsDataLayerLoading(false);
          }
          return;
        }

        if (!isThreadActiveFlag.current) return;
        const castProfessionNode = professionQueryPayload as unknown as ProfessionLine;
        setProfessionRecordState(castProfessionNode);

        // Perform downstream secondary entity lookups simultaneously to prevent execution blocking
        const [instructorData, coursesData] = await Promise.all([
          getActiveInstructorForProfession(castProfessionNode.id),
          listPublishedContentForProfession(castProfessionNode.id),
        ]);

        if (!isThreadActiveFlag.current) return;

        if (instructorData) {
          setAIInstructorState(instructorData as unknown as AIInstructor);
        } else {
          setAIInstructorState(null);
        }

        setCoursesRegistryPayload((coursesData as unknown as Course[]) || []);
      } catch (fatalHandshakeException) {
        if (isThreadActiveFlag.current) {
          setSynchronizationErrorStr("Couldn't load this career track.");
        }
      } finally {
        if (isThreadActiveFlag.current) {
          setIsDataLayerLoading(false);
        }
      }
    },
    [unverifiedTrackSlugStr],
  );

  React.useEffect(() => {
    const isThreadActiveFlag = { current: true };
    synchronizeProfessionTrackInventory(isThreadActiveFlag);

    return () => {
      isThreadActiveFlag.current = false;
    };
  }, [unverifiedTrackSlugStr, synchronizeProfessionTrackInventory]);

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: SECURE CURRICULUM CLASSIFICATION MATRIX
  // =========================================================================
  const coursesCategorizedByLevelMap = React.useMemo<Record<string, Course[]>>(() => {
    const internalAccumulatorMap: Record<string, Course[]> = { foundation: [], intermediate: [], executive: [] };
    if (coursesRegistryPayload.length === 0) return internalAccumulatorMap;

    return coursesRegistryPayload.reduce((accMap, courseNodeItem) => {
      const compiledLevelSlugKeyStr = courseNodeItem.profession_levels?.slug || "foundation";
      if (!accMap[compiledLevelSlugKeyStr]) {
        accMap[compiledLevelSlugKeyStr] = [];
      }
      accMap[compiledLevelSlugKeyStr].push(courseNodeItem);
      return accMap;
    }, internalAccumulatorMap);
  }, [coursesRegistryPayload]);

  const financialInvestmentMetricsHUD = React.useMemo(() => {
    const baseEntryCostFeeInt = professionRecordState?.credit_cost || 0;
    const modularUnitsCostSumInt = coursesRegistryPayload.reduce(
      (accumulatedSum, courseNode) => accumulatedSum + (courseNode.credit_cost || 0),
      0,
    );
    return {
      entryCost: baseEntryCostFeeInt,
      unitCost: modularUnitsCostSumInt,
      totalInvestment: baseEntryCostFeeInt + modularUnitsCostSumInt,
    };
  }, [professionRecordState, coursesRegistryPayload]);

  const handleReturnToCatalogTrigger = React.useCallback(() => {
    navigateHook("/app/learning/tracks");
  }, [navigateHook]);

  const handleInitializeAssessmentRedirect = React.useCallback(() => {
    if (professionRecordState?.id) {
      navigateHook(`/career-assessment?profession=${professionRecordState.id}`);
    }
  }, [professionRecordState, navigateHook]);

  const handleToggleInstructorChatPanel = React.useCallback(() => {
    setIsInstructorChatOpen((prev) => !prev);
  }, []);

  // =========================================================================
  // CONDITION RENDERING SKELETON GATES AND CHECKS
  // =========================================================================
  if (isDataLayerLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-left antialiased block w-full select-none pointer-events-none animate-pulse">
        <Skeleton className="h-9 w-36 rounded-lg block" />
        <Skeleton className="h-64 w-full rounded-xl bg-card/20 block shadow-none" />
        <Skeleton className="h-24 w-full rounded-xl block" />
      </div>
    );
  }

  if (synchronizationErrorStr || !professionRecordState) {
    return (
      <div
        role="alert"
        className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <AlertCircle className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block leading-none">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Track Synchronization Failure</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal mt-1">
              {synchronizationErrorStr ||
                "The targeted specialized curriculum tracking configuration parameters could not be parsed."}
            </p>
          </div>
          <div className="flex gap-2 w-full block shrink-0 select-none pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => synchronizeProfessionTrackInventory({ current: true })}
              className="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 stroke-[2.5]" /> <span>Re-Sync</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleReturnToCatalogTrigger}
              className="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-border/60 bg-background/50"
            >
              Catalog Index
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32 space-y-8 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APPLICATION HEADER SUB-TRACK NAVIGATION CONTROL GRID */}
      <header className="block w-full select-none pb-2 border-b border-border/10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReturnToCatalogTrigger}
          className="group rounded-lg h-9 px-3 font-mono text-[10px] font-extrabold uppercase tracking-wide border border-border/5 bg-background hover:bg-muted cursor-pointer"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Catalog Runway</span>
        </Button>
      </header>

      {/* HUD LEVEL 2: COMPOSITE PATH HERO DESCRIPTION SHELL */}
      <section className="space-y-2 block w-full leading-none">
        <div className="flex items-center gap-2 select-none pointer-events-none leading-none w-full block">
          {professionRecordState.schools?.name && (
            <Badge className="font-mono text-[8px] font-black uppercase px-2 h-4.5 rounded border border-primary/20 bg-primary/5 text-primary tracking-wide pt-0.5 shrink-0 leading-none">
              {professionRecordState.schools.name}
            </Badge>
          )}
          <span className="h-1 w-1 rounded-full bg-border/80 shrink-0" />
          <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block pt-0.5">
            Track Blueprint Allocation Matrix: v2.6
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-tight block select-text">
          {professionRecordState.name}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-relaxed max-w-3xl block select-text pt-1">
          {professionRecordState.description}
        </p>
      </section>

      {/* HUD LEVEL 3: MODULAR RESOURCE COMMITMENT AND DIAGNOSTIC HUD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 block w-full">
        {/* INVESTMENT BALANCE OVERVIEW CARD */}
        <Card className="md:col-span-2 rounded-xl border border-border/60 bg-card/30 shadow-none overflow-hidden block w-full select-none pointer-events-none">
          <CardContent className="p-4 sm:p-5 space-y-4 block w-full leading-none">
            <div className="flex items-center justify-between gap-4 leading-none block w-full shrink-0">
              <div className="flex items-center gap-2 max-w-[200px] sm:max-w-xs truncate leading-none block">
                <div className="p-2 bg-primary/5 border border-primary/10 rounded text-primary shrink-0 block shadow-3xs">
                  <Coins className="h-4 w-4 stroke-[2.2]" />
                </div>
                <h4 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-primary pt-0.5 truncate block">
                  Computational Resource Ledger
                </h4>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight px-1.5 h-4.5 rounded-sm bg-background border-border/40 tabular-nums shrink-0 pt-0.5 leading-none"
              >
                CUMULATIVE_DRAW: {financialInvestmentMetricsHUD.totalInvestment.toLocaleString()} UNITS
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/5 text-center sm:text-left block w-full tracking-tight font-mono uppercase text-[9px] font-bold text-muted-foreground/40 leading-none">
              <div className="space-y-1 block">
                <p className="text-foreground text-sm sm:text-base md:text-lg font-black tracking-tight tabular-nums leading-none">
                  {financialInvestmentMetricsHUD.entryCost.toLocaleString()}
                </p>
                <p className="italic block leading-none">Pipeline Ingress Fee</p>
              </div>
              <div className="space-y-1 block">
                <p className="text-foreground text-sm sm:text-base md:text-lg font-black tracking-tight tabular-nums leading-none">
                  {financialInvestmentMetricsHUD.unitCost.toLocaleString()}
                </p>
                <p className="italic block leading-none">Segment Course Units</p>
              </div>
              <div className="space-y-1 block">
                <p className="text-primary text-sm sm:text-base md:text-lg font-black tracking-tight tabular-nums leading-none">
                  {financialInvestmentMetricsHUD.totalInvestment.toLocaleString()}
                </p>
                <p className="text-primary font-extrabold block leading-none">Net Track Matrix Charge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEURAL DIAGNOSTIC SELECTION ENTRY CONTROL POINT CARD */}
        <Card
          onClick={handleInitializeAssessmentRedirect}
          className="rounded-xl border border-border/60 bg-card/40 hover:border-border-foreground/10 transition-colors duration-100 group cursor-pointer shadow-none overflow-hidden block w-full flex flex-col justify-between"
        >
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4 block w-full leading-none">
            <div className="space-y-2 block leading-none w-full select-none pointer-events-none">
              <div className="p-2 bg-muted/60 border border-border/40 rounded group-hover:bg-primary/5 transition-colors w-fit block shadow-3xs text-muted-foreground group-hover:text-primary">
                <ClipboardCheck className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5 block leading-none">
                <h4 className="text-xs font-bold uppercase tracking-wide text-foreground block">
                  Neural Fit Alignment Diagnostic
                </h4>
                <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight block leading-none italic">
                  Verify specialized baseline capabilities
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="w-full h-8 px-4 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1 shadow-2xs group-hover:bg-primary/90 transition-transform transform-gpu group-hover:scale-[1.01] active:scale-95 block text-center"
            >
              <span>Initialize Assessment</span>{" "}
              <Zap className="h-3 w-3 stroke-[2] fill-current text-primary-foreground inline-block shrink-0" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HUD LEVEL 4: INSTRUCTOR INTERFACE MATRIX WITH PATH UNITS LISTING */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6 items-start block w-full">
        {/* INSTRUCTOR ASIDE CONTROL CONSOLE PROFILE CORES */}
        <aside className="space-y-4 lg:sticky lg:top-4 block w-full shrink-0">
          {aiInstructorState && (
            <Card className="rounded-xl border border-border/60 bg-card/30 shadow-none overflow-hidden block w-full">
              <CardHeader className="p-4 border-b border-border/5 bg-muted/20 select-none pointer-events-none leading-none block w-full">
                <div className="flex items-center gap-3 leading-none w-full block">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary stroke-[2] shadow-3xs shrink-0 select-none pointer-events-none">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="leading-none space-y-1 block flex-1 min-w-0">
                    <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground truncate block pt-0.5">
                      {aiInstructorState.name}
                    </CardTitle>
                    <CardDescription className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight block leading-none">
                      Lead AI Instructor Core Node
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 block w-full leading-none">
                <p className="text-xs font-semibold text-muted-foreground/80 leading-relaxed italic block select-text pr-1 pt-0.5">
                  &ldquo;{aiInstructorState.persona}&rdquo;
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleInstructorChatPanel}
                  className="w-full h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 hover:bg-accent cursor-pointer transition-colors shadow-2xs gap-1.5 pt-0.5 flex items-center justify-center block text-center"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60 stroke-[2.2] shrink-0" />
                  <span>{isInstructorChatOpen ? "Close chat" : "Message instructor"}</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {isInstructorChatOpen && aiInstructorState && (
            <div className="block w-full animate-in fade-in duration-200">
              <AIChatPanel
                professionLineId={professionRecordState.id}
                instructorName={aiInstructorState.name}
                placeholder={`Query ${aiInstructorState.name} regarding curriculum matrices or tracking parameters...`}
                className="rounded-xl h-[380px] border border-border/60 shadow-none overflow-hidden block w-full bg-background"
              />
            </div>
          )}
        </aside>

        {/* INTEGRATED CHAPTER UNITS SYLLABUS DIRECTORY GRID CORES */}
        <div className="space-y-4 block flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between border-b border-border/5 pb-2 select-none pointer-events-none leading-none w-full block shrink-0">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 leading-none pb-0.5">
              Curriculum Architectural Roadmaps
            </h2>
            <Badge
              variant="secondary"
              className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded border border-border/5 text-muted-foreground/60 leading-none tracking-wide tabular-nums shrink-0 rounded-xs"
            >
              {coursesRegistryPayload.length.toString()} Syllabus Units Resolved
            </Badge>
          </div>

          <Tabs defaultValue="foundation" className="w-full block">
            <TabsList className="grid w-full grid-cols-3 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none mb-6">
              {["foundation", "intermediate", "executive"].map((levelKeyItem, levelIdxNum) => (
                <TabsTrigger
                  key={`curriculum-tab-trigger-item-${levelKeyItem}`}
                  value={levelKeyItem}
                  className="rounded-md font-mono text-[9px] font-extrabold uppercase tracking-wider h-8 border border-transparent data-[state=active]:bg-background data-[state=active]:border-border/10 data-[state=active]:text-foreground data-[state=active]:shadow-2xs transition-all cursor-pointer outline-none pt-0.5"
                >
                  Phase {(levelIdxNum + 1).toString().padStart(2, "0")}
                </TabsTrigger>
              ))}
            </TabsList>

            {["foundation", "intermediate", "executive"].map((levelScopeStr) => (
              <TabsContent
                key={`tab-panel-viewport-scope-${levelScopeStr}`}
                value={levelScopeStr}
                className="space-y-2 outline-none focus:outline-none block w-full mt-2"
              >
                {coursesCategorizedByLevelMap[levelScopeStr]?.length ? (
                  <div className="space-y-2 block w-full align-top">
                    {coursesCategorizedByLevelMap[levelScopeStr].map((courseRecordNode, arrayIdx) => (
                      <Card
                        key={`curriculum-course-node-card-row-${courseRecordNode.id}`}
                        onClick={() => navigateHook(`/app/learning/courses/${courseRecordNode.slug}`)}
                        className="group rounded-lg border border-border/60 bg-card/40 hover:border-border-foreground/10 transition-colors duration-100 cursor-pointer overflow-hidden shadow-none block w-full"
                      >
                        <CardContent className="p-4 flex items-center gap-4 block w-full leading-none">
                          <div className="h-10 w-10 rounded bg-muted border border-border/5 flex items-center justify-center font-mono text-[10px] sm:text-xs font-black text-muted-foreground/60 select-none pointer-events-none shrink-0 pt-0.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-2 transition-all duration-150 shadow-3xs">
                            {(arrayIdx + 1).toString().padStart(2, "0")}
                          </div>

                          <div className="flex-1 min-w-0 leading-none space-y-1 block pr-2">
                            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground leading-tight truncate block pt-0.5 transition-colors group-hover:text-primary">
                              {courseRecordNode.title}
                            </h4>
                            <div className="flex items-center gap-3 font-mono text-[9px] sm:text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight leading-none select-none pointer-events-none tabular-nums block truncate">
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3 stroke-[2.2]" />{" "}
                                <span>{courseRecordNode.estimated_hours.toString()} Hours</span>
                              </span>
                              <span className="opacity-30 block shrink-0 select-none">•</span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Coins className="h-3 w-3 stroke-[2.2]" />{" "}
                                <span>{(courseRecordNode.credit_cost || 0).toLocaleString()} Unit Cost</span>
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 stroke-[2.5] group-hover:text-primary group-hover:translate-x-0.5 transition-all select-none pointer-events-none shrink-0" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-card/20 p-12 text-center select-none block mt-1">
                    <p className="font-mono text-[10px] font-black uppercase tracking-wide text-muted-foreground/30">
                      Phase Unit Protocol Configuration Pending Sync
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
