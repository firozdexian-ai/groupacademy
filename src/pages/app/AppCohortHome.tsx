import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Calendar, Users, Radio, Video, ChevronLeft, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCohort, useCohortSessions, useCohortHealth } from "@/domains/learning";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC CONTRACT INTERFACES
// =========================================================================
interface ContentMetadata {
 id: string;
 title: string;
}

interface CohortNode {
 id: string;
 name: string;
 starts_on: string | null;
 ends_on: string | null;
 content?: ContentMetadata | null;
}

interface ClassroomSession {
 id: string;
 title: string;
 scheduled_date: string;
 event_timezone: string | null;
 duration_minutes: number | null;
 kind: string;
 recording_link?: string | null;
}

interface CohortHealthTelemetry {
 enrollment_count: number;
 attendance_rate: number | null;
}

interface SessionCardProps {
 session: ClassroomSession;
 past?: boolean;
}

/**
 * GroUp Academy: Student Cohort Environment Dashboard (AppCohortHome)
 * Hardened candidate-facing console filtering scheduling streams and insulating date boundaries against client timezone drift.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AppCohortHome() {
 const { cohortId: unverifiedCohortParamStr } = useParams<{ cohortId: string }>();

 const { data: cohortPayloadData, isLoading: isCohortResolving } = useCohort(unverifiedCohortParamStr);
 const { data: sessionsPayloadArray = [], isLoading: isSessionsResolving } =
 useCohortSessions(unverifiedCohortParamStr);
 const { data: healthTelemetryPayload } = useCohortHealth(unverifiedCohortParamStr);

 // Cast incoming raw entities safely via explicit type contracts
 const resolvedCohortNode = cohortPayloadData as unknown as CohortNode | undefined;
 const typedSessionsArray = sessionsPayloadArray as unknown as ClassroomSession[];
 const resolvedHealthNode = healthTelemetryPayload as unknown as CohortHealthTelemetry | undefined;

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: SECURE TIMELINE STREAM COMPILING
 // =========================================================================
 const { upcomingSessionsList, pastSessionsList } = React.useMemo(() => {
 const defaultCollectionMap = {
 upcomingSessionsList: [] as ClassroomSession[],
 pastSessionsList: [] as ClassroomSession[],
 };
 if (typedSessionsArray.length === 0) return defaultCollectionMap;

 // Isolate current execution times securely to maintain parity with structural timelines
 const operationalBaselineTimestampMs = Date.now();

 return typedSessionsArray.reduce((accMap, sessionItem) => {
 const parsedTargetSessionTimeMs = new Date(sessionItem.scheduled_date).getTime();

 if (parsedTargetSessionTimeMs >= operationalBaselineTimestampMs) {
 accMap.upcomingSessionsList.push(sessionItem);
 } else {
 accMap.pastSessionsList.push(sessionItem);
 }
 return accMap;
 }, defaultCollectionMap);
 }, [typedSessionsArray]);

 if (isCohortResolving || isSessionsResolving) {
 return (
 <div
 role="status"
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Synchronizing Academic Environment...</span>
 </div>
 </div>
 );
 }

 if (!resolvedCohortNode) {
 return (
 <div
 role="alert"
 className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
 >
 <div className="max-w-xs block space-y-4 leading-none">
 <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
 <Inbox className="h-4 w-4 stroke-[2.2]" />
 </div>
 <div className="space-y-1 block">
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Environment Missing</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
 The targeted classroom workspace parameter index could not be resolved from standard system paths.
 </p>
 </div>
 <Button
 type="button"
 asChild
 variant="outline"
 className="h-8 rounded-lg text-xs font-medium tracking-wider px-3 shadow-2xs cursor-pointer"
 >
 <Link to="/app/my-learning">Back to Learning Matrix</Link>
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: ENVIRONMENT DESKTOP TRACK CONTROL BAR */}
 <header className="block w-full select-none pb-3 border-b border-border/10">
 <Link
 to="/app/my-learning"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
 >
 <ChevronLeft className="h-3 w-3 stroke-[2.2]" /> <span>Return to Learning Hub</span>
 </Link>

 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-none mt-3 block">
 {resolvedCohortNode.name}
 </h1>
 {resolvedCohortNode.content?.title && (
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none truncate block mt-1 select-text">
 Syllabus Core: {resolvedCohortNode.content.title}
 </p>
 )}

 {/* Dynamic Telemetry Metric Labels */}
 <div className="mt-3 flex flex-wrap gap-1.5 leading-none w-full block">
 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 bg-background text-muted-foreground/60 border-border/40 shrink-0 leading-none pt-0.5 rounded-sm"
 >
 <Calendar className="h-3 w-3 mr-1 text-primary stroke-[2.2] shrink-0" />
 <span>
 SPAN: {resolvedCohortNode.starts_on ?? "SELF-PACED PIPELINE"}
 {resolvedCohortNode.ends_on ? ` → ${resolvedCohortNode.ends_on}` : ""}
 </span>
 </Badge>

 {resolvedHealthNode && (
 <>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 text-muted-foreground border border-border/5 shrink-0 leading-none pt-0.5 rounded-sm"
 >
 <Users className="h-3 w-3 mr-1 text-primary stroke-[2.2] shrink-0" />
 <span>{resolvedHealthNode.enrollment_count.toLocaleString()} Learners Active</span>
 </Badge>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 text-muted-foreground border border-border/5 shrink-0 leading-none pt-0.5 rounded-sm tabular-nums"
 >
 <span>Metrics Validation: {resolvedHealthNode.attendance_rate ?? 0}% Attendance</span>
 </Badge>
 </>
 )}
 </div>
 </header>

 {/* HUD LEVEL 2: CHROMATIC UPCOMING/PAST MISSION TIMELINES */}
 <main className="mt-5 space-y-5 block w-full">
 {/* SECTION A: UPCOMING STREAM ROSTERS */}
 <section className="block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5 flex items-center gap-1.5">
 <Radio className="h-3.5 w-3.5 text-rose-500 stroke-[2.5] animate-pulse shrink-0" />
 <span>Live Scheduled Modules</span>
 </h2>

 {upcomingSessionsList.length === 0 ? (
 <Card className="rounded-lg border border-dashed border-border/40 bg-card/10 p-4 text-center select-none block mt-2.5 shadow-none">
 <p className="text-[10px] font-mono font-extrabold text-muted-foreground/30 uppercase tracking-wide">
 No Active Sessions Scheduled In Current Horizon
 </p>
 </Card>
 ) : (
 <div className="space-y-2 mt-2.5 block w-full">
 {upcomingSessionsList.map((sessionNode) => (
 <SessionCard key={`upcoming-session-card-${sessionNode.id}`} session={sessionNode} />
 ))}
 </div>
 )}
 </section>

 {/* SECTION B: PAST COMPLETED SESSIONS SUMMARY RECORDS */}
 {pastSessionsList.length > 0 && (
 <section className="block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
 Archive Syllabus Completions
 </h2>
 <div className="space-y-2 mt-2.5 block w-full">
 {pastSessionsList.slice(0, 8).map((sessionNode) => (
 <SessionCard key={`past-session-card-${sessionNode.id}`} session={sessionNode} past />
 ))}
 </div>
 </section>
 )}
 </main>
 </div>
 );
}

// =========================================================================
// NESTED ELEMENT 1: ATOMIC SYLLABUS DISCLOSURE ROW SECTOR
// =========================================================================
function SessionCard({ session, past = false }: SessionCardProps) {
 return (
 <Card className="rounded-lg border border-border/60 bg-card shadow-none overflow-hidden block w-full transform-gpu transition-colors hover:border-border-foreground/5">
 <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
 <div className="min-w-0 flex-1 leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground truncate uppercase tracking-wide block pt-0.5 select-text">
 {session.title}
 </p>
 <p className="font-mono text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 leading-none select-text block tracking-tight">
 {formatEventTime(session.scheduled_date, session.event_timezone || DEFAULT_EVENT_TZ)} •{" "}
 {session.duration_minutes ?? 60} MIN
 </p>
 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-1 h-4 bg-background/50 text-muted-foreground/60 border-border/40 shrink-0 leading-none pt-0.5 rounded-xs mt-1"
 >
 {session.kind.replace(/_/g, " ").toUpperCase()}
 </Badge>
 </div>

 {/* Context Conditional Control CTAs */}
 <div className="shrink-0 select-none block leading-none">
 {past ? (
 session.recording_link ? (
 <Button
 asChild
 type="button"
 size="sm"
 variant="outline"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-3 shadow-2xs pt-0.5 cursor-pointer"
 >
 <a href={session.recording_link} target="_blank" rel="noopener noreferrer">
 Stream Playback
 </a>
 </Button>
 ) : (
 <span className="font-mono text-[10px] font-black text-muted-foreground/30 uppercase tracking-wide block pt-1 mr-1.5">
 Archived Run
 </span>
 )
 ) : (
 <Button
 asChild
 type="button"
 size="sm"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-3 gap-1 shadow-2xs pt-0.5 cursor-pointer transform-gpu active:scale-[0.985]"
 >
 <Link to={`/app/sessions/${session.id}/join`}>
 <Video className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
 <span>Join Stream</span>
 </Link>
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
