import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, PlayCircle, Award, Lock, Clock, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";
import { WebinarEnrollPanel } from "@/domains/learning/components/talent/WebinarEnrollPanel";
import { JoinLivePanel } from "@/domains/learning/components/talent/JoinLivePanel";
import { useEnrollment } from "@/domains/learning";
import { useTalent } from "@/hooks/useTalent";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ProfessionTrackMetadata {
 id: string;
 name: string;
 slug: string;
}

interface CourseModule {
 id: string;
 title: string;
 description: string | null;
 display_order: number;
 estimated_time_minutes: number | null;
}

interface ContentPayload {
 id: string;
 title: string;
 slug: string;
 description: string | null;
 content_type: string | null;
 cover_image_url: string | null;
 price: number | null;
 credit_cost: number | null;
 is_active: boolean;
 profession_track: ProfessionTrackMetadata | null;
 modules: CourseModule[] | null;
}

interface AppCourseDetailProps {
 inlineSlug?: string;
 onBack?: () => void;
}

interface SubComponentProps {
 course: ContentPayload;
}

/**
 * GroUp Academy: Authoritative Curriculum Discovery Engine (AppCourseDetail)
 * Hardened course profile board securing asynchronous database queries and isolating module sorting tracks.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AppCourseDetail({ inlineSlug, onBack }: AppCourseDetailProps) {
 const { slug: urlSlugStr } = useParams<{ slug: string }>();
 const navigateHook = useNavigate();
 const activeSyllabusSlug = inlineSlug || urlSlugStr;

 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const {
 data: contentQueryResponse,
 isLoading: isSyllabusCacheResolving,
 error: queryHandshakeError,
 } = useQuery({
 queryKey: ["app-course-specification-detail", activeSyllabusSlug],
 queryFn: async (): Promise<ContentPayload> => {
 const { data: databaseOutputPayload, error: rpcHandshakeError } = await supabase
 .from("content")
 .select(
 `
 id, title, slug, description, content_type, cover_image_url, price, credit_cost, is_active,
 profession_track:profession_line_id (id, name, slug),
 modules:course_modules (id, title, description, display_order, estimated_time_minutes)
 `,
 )
 .eq("slug", activeSyllabusSlug!)
 .maybeSingle();

 if (rpcHandshakeError) throw rpcHandshakeError;
 if (!databaseOutputPayload) throw new Error("Target curriculum record map unassigned.");
 return databaseOutputPayload as unknown as ContentPayload;
 },
 enabled: !!activeSyllabusSlug,
 staleTime: 5 * 60 * 1000,
 });

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: SECURE RUNTIME SORTING STRUCTURES
 // =========================================================================
 const compiledSortedModulesList = React.useMemo<CourseModule[]>(() => {
 if (!contentQueryResponse?.modules || contentQueryResponse.modules.length === 0) return [];
 return [...contentQueryResponse.modules].sort(
 (firstNode, secondNode) => firstNode.display_order - secondNode.display_order,
 );
 }, [contentQueryResponse]);

 const handleReturnNavigationTrigger = React.useCallback(() => {
 if (onBack) {
 onBack();
 } else {
 navigateHook(-1);
 }
 }, [onBack, navigateHook]);

 const handleLaunchLearningEnvironmentRedirect = React.useCallback(() => {
 if (contentQueryResponse?.slug) {
 navigateHook(`/app/learn/${contentQueryResponse.slug}`);
 }
 }, [contentQueryResponse, navigateHook]);

 const handleReturnToCatalogTrigger = React.useCallback(() => {
 navigateHook("/app/learning");
 }, [navigateHook]);

 if (isSyllabusCacheResolving) {
 return (
 <div className={cn(PAGE_SHELL, "space-y-4 select-none pointer-events-none w-full block antialiased")}>
 <Skeleton className="h-8 w-32 rounded-lg block" />
 <Skeleton className="h-44 w-full rounded-xl block aspect-video sm:aspect-auto shadow-none border border-transparent" />
 <div className="space-y-2 block w-full">
 <Skeleton className="h-4 w-full rounded-xs block" />
 <Skeleton className="h-4 w-2/3 rounded-xs block" />
 </div>
 </div>
 );
 }

 if (queryHandshakeError || !contentQueryResponse) {
 return (
 <div className={cn(PAGE_SHELL, "w-full text-left block antialiased")}>
 <EmptyState
 icon={Lock}
 title="Curriculum Allocation Restrained"
 description="The requested learning pipeline parameters are currently unpublished or blocked under this credential node structure."
 action={{ label: "Return to Learning Index", onClick: handleReturnToCatalogTrigger }}
 />
 </div>
 );
 }

 const isLiveSessionContentType =
 contentQueryResponse.content_type === "live_webinar" || contentQueryResponse.content_type === "batch_class";

 return (
 <div className={cn(PAGE_SHELL, "text-left antialiased block transform-gpu w-full space-y-4")}>
 {/* HUD LEVEL 1: ADMINISTRATIVE HUB CONTROL BAR */}
 <header className="flex items-center gap-2 select-none leading-none w-full shrink-0">
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-8 w-8 rounded-lg cursor-pointer transition-transform active:scale-95 shrink-0"
 onClick={handleReturnNavigationTrigger}
 >
 <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
 </Button>
 <span
 className={cn(
 META_TEXT,
 "font-mono font-bold uppercase tracking-wider select-none pointer-events-none pt-0.5",
 )}
 >
 Return
 </span>
 </header>

 {/* HUD LEVEL 2: AUTHORITATIVE COVER MATRICES CANVAS */}
 {contentQueryResponse.cover_image_url && (
 <div className="aspect-video relative rounded-xl overflow-hidden bg-muted border border-border/40 w-full block select-none shadow-2xs shrink-0">
 <img
 src={contentQueryResponse.cover_image_url}
 alt=""
 className="w-full h-full object-cover block pointer-events-none"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
 <Button
 type="button"
 size="icon"
 className="h-12 w-12 rounded-lg bg-background text-foreground hover:bg-accent cursor-pointer transition-transform transform-gpu active:scale-95 shadow-md shrink-0 block"
 onClick={handleLaunchLearningEnvironmentRedirect}
 title="Launch dynamic streaming framework container"
 >
 <PlayCircle className="h-6 w-6 stroke-[2] mx-auto block" />
 </Button>
 </div>
 </div>
 )}

 {/* HUD LEVEL 3: SYLLABUS DISCLOSURE DATA METADATA BLOCK */}
 <div className="space-y-1.5 block w-full leading-none">
 <div className="flex items-center gap-2 flex-wrap select-none pointer-events-none leading-none">
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-black uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border border-border/5"
 >
 {contentQueryResponse.content_type?.replace(/_/g, " ").toUpperCase() || "ACADEMY BLOCK"}
 </Badge>

 <span
 className={cn(
 META_TEXT,
 "font-mono font-bold uppercase text-muted-foreground/50 inline-flex items-center gap-1 leading-none pt-0.5 tabular-nums",
 )}
 >
 <Clock className="h-3 w-3 stroke-[2] shrink-0" />
 <span>Volume Length: {(compiledSortedModulesList.length * 15).toLocaleString()} Min</span>
 </span>
 </div>

 <h1
 className={cn(
 PAGE_TITLE,
 "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-tight block select-text pt-0.5",
 )}
 >
 {contentQueryResponse.title}
 </h1>

 {contentQueryResponse.description && (
 <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium leading-relaxed block select-text">
 {contentQueryResponse.description}
 </p>
 )}
 </div>

 {/* HUD LEVEL 4: INTERACTIVE WEBINAR AND class CONSOLE TRIGGERS */}
 {isLiveSessionContentType && <LiveSessionPanels course={contentQueryResponse} />}

 {/* HUD LEVEL 5: CREDENTIAL CERTIFICATE DATA OVERVIEW MATRICES */}
 <Card
 className={cn(CARD, "rounded-lg bg-primary/[0.01] border-primary/20 shadow-none overflow-hidden block w-full")}
 >
 <CardContent className="p-3.5 space-y-3.5 block w-full leading-none">
 <div className="flex items-center gap-3.5 leading-none w-full block select-none pointer-events-none">
 <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
 <Award className="h-5 w-5 stroke-[2.2]" />
 </div>
 <div className="leading-none space-y-1 block flex-1 min-w-0">
 <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide block pt-0.5">
 Verified Completion Certificate Manifest
 </p>
 <p className="font-mono text-sm font-medium text-muted-foreground/40 leading-none block uppercase tracking-tight tabular-nums">
 Persistent Access Rights Mapped · {compiledSortedModulesList.length.toString()} Total Modules Tracking
 Rows
 </p>
 </div>
 </div>

 {!isLiveSessionContentType && <RecordedEnrollCta course={contentQueryResponse} />}
 </CardContent>
 </Card>

 {/* HUD LEVEL 6: COMPREHENSIVE RECONCILED CHAPTER DIRECTORIES */}
 <div className="space-y-2 block w-full">
 <div className="flex items-center justify-between select-none pointer-events-none leading-none w-full shrink-0">
 <h3
 className={cn(
 SECTION_TITLE,
 "text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 leading-none pb-0.5",
 )}
 >
 Curriculum Sequence Framework
 </h3>
 <span
 className={cn(
 META_TEXT,
 "font-mono font-bold text-muted-foreground/30 uppercase tracking-wider leading-none tabular-nums",
 )}
 >
 {compiledSortedModulesList.length.toString()} Syllabus Chapters Loaded
 </span>
 </div>

 {compiledSortedModulesList.length === 0 ? (
 <div className="w-full text-left block">
 <EmptyState
 icon={BookOpen}
 title="Syllabus Matrix Clear"
 description="Educational lecture segments and lesson maps are currently building for this node sequence."
 />
 </div>
 ) : (
 <div className="space-y-2 block w-full">
 {compiledSortedModulesList.map((moduleNodeItem, moduleIndexPosition) => (
 <button
 key={`curriculum-chapter-node-trigger-${moduleNodeItem.id}`}
 type="button"
 onClick={handleLaunchLearningEnvironmentRedirect}
 className="w-full text-left rounded-lg border border-border/60 bg-card/40 hover:border-border-foreground/10 transition-colors duration-100 p-3 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer shadow-none block transform-gpu active:scale-[0.995]"
 >
 <div className="flex items-center gap-3.5 leading-none w-full block">
 <div className="h-8 w-8 rounded bg-muted border border-border/5 flex items-center justify-center font-mono text-[10px] sm:text-xs font-black text-muted-foreground/60 select-none pointer-events-none shrink-0 pt-0.5">
 {(moduleIndexPosition + 1).toString().padStart(2, "0")}
 </div>

 <div className="flex-1 min-w-0 leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground truncate block uppercase tracking-wide pt-0.5">
 {moduleNodeItem.title}
 </p>
 <p
 className={cn(
 META_TEXT,
 "font-mono text-[9px] sm:text-xs font-medium text-muted-foreground/40 leading-none flex items-center gap-1.5 select-none pointer-events-none tracking-tight tabular-nums",
 )}
 >
 <Clock className="h-3 w-3 stroke-[2] shrink-0" />
 <span>Segment Allocation Runtime: {moduleNodeItem.estimated_time_minutes || 15} Min</span>
 </p>
 </div>

 <ChevronRight className="h-4 w-4 text-muted-foreground/30 stroke-[2.2] shrink-0 select-none pointer-events-none" />
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

// =========================================================================
// NESTED ELEMENT 1: TRANSACTION INGRESS ENROLLMENT CTA RIG
// =========================================================================
function RecordedEnrollCta({ course }: SubComponentProps) {
 const navigateHook = useNavigate();
 const { talent: talentProfileRecordNode } = useTalent();
 const {
 enrollment: studentEnrollmentRecord,
 enroll: triggerEnrollmentMutation,
 isEnrolling: isMutationInFlight,
 } = useEnrollment(course.id);

 const computedTotalCreditsCost = getCourseCredits(Number(course.price ?? 0), course.credit_cost ?? null);

 if (studentEnrollmentRecord) {
 return (
 <Button
 type="button"
 className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
 onClick={() => navigateHook(`/app/learn/${course.slug}`)}
 >
 <span>Resume Course Environment</span>
 </Button>
 );
 }

 const handleEnrollmentSequenceAuthorization = async () => {
 if (!talentProfileRecordNode?.id) {
 navigateHook(`/auth?redirect=/app/learning/courses/${course.slug}`);
 return;
 }

 try {
 const mutationResolutionPayload = await triggerEnrollmentMutation();
 if (mutationResolutionPayload.success) {
 navigateHook(`/app/learn/${course.slug}`);
 }
 } catch (suppressedMutationException) {
 // Shield input boundaries from floating exception rejections
 }
 };

 return (
 <Button
 type="button"
 onClick={handleEnrollmentSequenceAuthorization}
 disabled={isMutationInFlight}
 className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
 >
 {isMutationInFlight ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto block" />
 ) : (
 <span>
 {computedTotalCreditsCost > 0
 ? `Authorize Pipeline Access · ${computedTotalCreditsCost.toLocaleString()} Credits`
 : "Authorize Pipeline Access · Free Ingress Token"}
 </span>
 )}
 </Button>
 );
}

// =========================================================================
// NESTED ELEMENT 2: LIVE BROADCAST SESSION DISPLAY DISPATCHER
// =========================================================================
function LiveSessionPanels({ course }: SubComponentProps) {
 const { enrollment: liveSessionEnrollmentRecord } = useEnrollment(course.id);

 if (liveSessionEnrollmentRecord) {
 return <JoinLivePanel course={course as any} />;
 }
 return <WebinarEnrollPanel course={course as any} />;
}
