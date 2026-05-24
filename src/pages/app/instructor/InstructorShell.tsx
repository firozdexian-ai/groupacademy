import * as React from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import {
 GraduationCap,
 BookOpen,
 Wallet,
 Sparkles,
 ListChecks,
 BarChart3,
 Loader2,
 Inbox,
 ArrowRight,
 Settings,
} from "lucide-react";
import { useInstructorSummary } from "@/domains/learning";
import InstructorEarnings from "./InstructorEarnings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface Engagement {
 id: string;
 content_id: string;
 title: string | null;
 role: string;
 author_status: string | null;
 revenue_share_pct: number;
}

interface CreditBalance {
 content_id: string;
 balance: number;
 monthly_grant: number;
}

interface InstructorSummary {
 engagements: Engagement[];
 credits: CreditBalance[];
}

interface PanelProps {
 engagements: Engagement[];
}

interface CreditsProps {
 credits: CreditBalance[];
}

const TABS = [
 { key: "courses", label: "My Courses", icon: BookOpen },
 { key: "credits", label: "AI Credits", icon: Sparkles },
 { key: "earnings", label: "Earnings", icon: Wallet },
 { key: "review", label: "Review Queue", icon: ListChecks },
 { key: "insights", label: "Insights", icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * GroUp Academy: Authoritative Instructor Cockpit Shell (InstructorShell)
 * Hardened workspace orchestrator establishing compile-time data types and protecting view configurations from layout shifts.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function InstructorShell() {
 const { data: rawSummaryPayload, isLoading: isSummaryResolving } = useInstructorSummary();
 const [urlSearchParamsMap, setUrlSearchParamsMap] = useSearchParams();

 // Safely map incoming structure down into strongly typed layouts
 const typedSummaryData = rawSummaryPayload as unknown as InstructorSummary | undefined;

 const activeTabKey = React.useMemo<TabKey>(() => {
 const URLTabParameter = urlSearchParamsMap.get("tab") as TabKey | null;
 if (URLTabParameter && TABS.some((tabItem) => tabItem.key === URLTabParameter)) {
 return URLTabParameter;
 }
 return "courses";
 }, [urlSearchParamsMap]);

 const handleTabSelectionAction = React.useCallback(
 (targetTabKeyStr: TabKey) => {
 setUrlSearchParamsMap({ tab: targetTabKeyStr });
 },
 [setUrlSearchParamsMap],
 );

 if (isSummaryResolving) {
 return (
 <div
 role="status"
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Synchronizing Workspace Matrix...</span>
 </div>
 </div>
 );
 }

 const activeEngagementsRegistry = typedSummaryData?.engagements ?? [];

 if (activeEngagementsRegistry.length === 0) {
 return (
 <div
 role="alert"
 className="min-h-[60vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
 >
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-10 w-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <GraduationCap className="h-5 w-5 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Workspace Vault Locked</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
 No active instructional course engagements or authoring track parameters are mapped onto this profile.
 </p>
 </div>
 <Button
 type="button"
 asChild
 size="sm"
 className="h-8 rounded-lg text-xs font-medium tracking-wider px-4 cursor-pointer shadow-2xs"
 >
 <Link to="/app/jobs?kind=instructor">Browse Open Instructor Briefs</Link>
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto px-4 py-4 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: WORKSPACE DESKTOP SUMMARY RUNWAY */}
 <header className="block w-full select-none pb-3 border-b border-border/10">
 <div className="flex items-center gap-2 leading-none w-full shrink-0">
 <GraduationCap className="h-5 w-5 text-primary stroke-[2.2]" />
 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5">
 Instructor Workspace Shell
 </h1>
 </div>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-1">
 Coordinate syllabus authoring sequences, track revenue metrics, and allocate AI computational credits.
 </p>
 </header>

 {/* HUD LEVEL 2: COMPOSITE SEGMENT TRIGGER SCROLL ROW */}
 <div className="flex gap-1.5 overflow-x-auto pb-1.5 mt-3.5 w-full select-none scrollbar-none transform-gpu shrink-0 block">
 {TABS.map((tabNodeItem) => {
 const TabIconComponent = tabNodeItem.icon;
 const isTabActive = activeTabKey === tabNodeItem.key;

 return (
 <button
 key={`workspace-panel-trigger-${tabNodeItem.key}`}
 type="button"
 onClick={() => handleTabSelectionAction(tabNodeItem.key)}
 className={cn(
 "shrink-0 h-8 px-3 rounded-full text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wide border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring pt-0.5",
 isTabActive
 ? "bg-primary border-primary text-primary-foreground font-black"
 : "bg-card/40 border-border/60 text-muted-foreground/70 hover:bg-accent/60 hover:text-foreground",
 )}
 >
 <TabIconComponent className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
 <span>{tabNodeItem.label}</span>
 </button>
 );
 })}
 </div>

 {/* HUD LEVEL 3: DYNAMIC PANEL ROUTER EXPANSION VIEWPORT */}
 <main className="mt-4 block w-full">
 {activeTabKey === "courses" && <CoursesPanel engagements={activeEngagementsRegistry} />}
 {activeTabKey === "credits" && <CreditsPanel credits={typedSummaryData?.credits ?? []} />}
 {activeTabKey === "earnings" && <InstructorEarnings />}

 {activeTabKey === "review" && (
 <Card className="rounded-xl border border-border/60 bg-card shadow-none block w-full transform-gpu transition-colors hover:border-border-foreground/5">
 <CardContent className="p-4 flex items-center justify-between gap-4 leading-none w-full">
 <div className="leading-none space-y-1 block pointer-events-none select-none">
 <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
 Syllabus Evaluation Manifest
 </p>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/50">
 Audit submitted student curriculum execution milestones.
 </p>
 </div>
 <Button
 asChild
 type="button"
 size="sm"
 variant="outline"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shrink-0 shadow-2xs pt-0.5"
 >
 <Link to="/app/instructor/review-queue">
 <span>Launch Queue</span> <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
 </Link>
 </Button>
 </CardContent>
 </Card>
 )}

 {activeTabKey === "insights" && (
 <Card className="rounded-xl border border-border/60 bg-card shadow-none block w-full transform-gpu transition-colors hover:border-border-foreground/5">
 <CardContent className="p-4 flex items-center justify-between gap-4 leading-none w-full">
 <div className="leading-none space-y-1 block pointer-events-none select-none">
 <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
 Authoring Insights Stream
 </p>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/50">
 Assess student engagement indexes and conversion rates.
 </p>
 </div>
 <Button
 asChild
 type="button"
 size="sm"
 variant="outline"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shrink-0 shadow-2xs pt-0.5"
 >
 <Link to="/app/instructor/insights">
 <span>Inspect Data</span> <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
 </Link>
 </Button>
 </CardContent>
 </Card>
 )}
 </main>
 </div>
 );
}

// =========================================================================
// SUB-PANEL 1: ENROLLED COURSE CURRICULUM DIRECTORY LISTING
// =========================================================================
function CoursesPanel({ engagements }: PanelProps) {
 return (
 <div className="space-y-2 block w-full">
 {engagements.map((engagementNodeItem) => (
 <Card
 key={`instructor-engagement-card-${engagementNodeItem.id}`}
 className="rounded-lg border border-border/60 bg-card shadow-none overflow-hidden block w-full transform-gpu transition-colors hover:border-border-foreground/5"
 >
 <CardContent className="p-3.5 flex items-start justify-between gap-4 leading-none w-full">
 <div className="min-w-0 flex-1 leading-none space-y-2 block">
 <p className="text-xs sm:text-sm font-bold text-foreground truncate uppercase tracking-wide block pt-0.5 select-text">
 {engagementNodeItem.title ?? "Unassigned Instructional Node Specification"}
 </p>
 <div className="flex items-center gap-1.5 select-none pointer-events-none flex-wrap leading-none">
 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 bg-background/50 text-muted-foreground/60 border-border/40 shrink-0 leading-none pt-0.5 rounded-sm"
 >
 ROLE: {engagementNodeItem.role}
 </Badge>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 text-muted-foreground border border-border/5 shrink-0 leading-none pt-0.5 rounded-sm"
 >
 STATUS: {engagementNodeItem.author_status ?? "DRAFT"}
 </Badge>
 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 border-primary/20 bg-primary/5 text-primary tracking-wide shrink-0 leading-none pt-0.5 rounded-sm tabular-nums"
 >
 SHARE: {Number(engagementNodeItem.revenue_share_pct).toFixed(0)}%
 </Badge>
 </div>
 </div>

 <div className="flex flex-col gap-1.5 shrink-0 select-none leading-none">
 <Button
 asChild
 type="button"
 size="sm"
 variant="outline"
 className="h-7 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider px-2.5 cursor-pointer shadow-2xs pt-0.5"
 >
 <Link to={`/app/instructor/course/${engagementNodeItem.content_id}`}>Open Core</Link>
 </Button>
 <Button
 asChild
 type="button"
 size="sm"
 variant="ghost"
 className="h-7 rounded-md font-mono text-xs font-medium tracking-wider px-2.5 cursor-pointer text-muted-foreground/60 hover:text-foreground pt-0.5"
 >
 <Link to={`/app/instructor/course/${engagementNodeItem.content_id}/sessions`}>Sessions</Link>
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 );
}

// =========================================================================
// SUB-PANEL 2: AI COMPUTATIONAL CREDIT VOLUME TRACKING RECORD
// =========================================================================
function CreditsPanel({ credits }: CreditsProps) {
 if (credits.length === 0) {
 return (
 <Card className="rounded-xl border border-dashed border-border/60 bg-card/20 p-6 text-center select-none block">
 <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold text-muted-foreground/40 leading-normal mt-2 max-w-xs mx-auto">
 No automated credit balance statements generated under this instruction node sequence.
 </p>
 </Card>
 );
 }

 return (
 <div className="space-y-2 block w-full">
 {credits.map((creditNodeItem) => (
 <Card
 key={`credit-allocation-row-${creditNodeItem.content_id}`}
 className="rounded-lg border border-border/60 bg-card shadow-none block w-full overflow-hidden"
 >
 <CardContent className="p-3 flex items-center justify-between gap-4 leading-none w-full">
 <div className="leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide block pt-0.5 select-text tabular-nums">
 {Number(creditNodeItem.balance).toFixed(1)} Active AI Credits
 </p>
 <p className="font-mono text-sm font-medium text-muted-foreground/40 leading-none select-text uppercase tracking-tight tabular-nums">
 System Allocation Monthly Grant Strategy: {Number(creditNodeItem.monthly_grant).toFixed(0)} Credits ·
 Allocated Per Syllabus Node
 </p>
 </div>
 <Sparkles className="h-4 w-4 text-amber-500 stroke-[1.8] shrink-0 select-none pointer-events-none" />
 </CardContent>
 </Card>
 ))}

 <footer className="px-1 select-none pointer-events-none block leading-none w-full shrink-0 pt-1">
 <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/30 leading-normal tabular-nums">
 AI execution telemetry metrics weight parameters: Prompt Instantiation Strategy (0.3 cr/MCQ Node • 0.5
 cr/Complex Narrative Scenario Vector) • Synthetic Text Regeneration (0.2 cr/Pass) • Multilingual Translation
 Matrix Engine (0.1 cr/Evaluation Pass).
 </p>
 </footer>
 </div>
 );
}
