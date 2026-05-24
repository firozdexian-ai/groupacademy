import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Loader2, Calendar, Users, Inbox, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
 useCohorts,
 useCohortSessions,
 useSaveSession,
 useSaveCohort,
 useInstructorAttendance,
} from "@/domains/learning";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC CONTRACT INTERFACES
// =========================================================================
interface Cohort {
 id: string;
 name: string;
 starts_on: string | null;
 ends_on: string | null;
 capacity: number | null;
 timezone: string | null;
 status: string;
}

interface Session {
 id: string;
 title: string;
 scheduled_date: string;
 event_timezone: string | null;
 duration_minutes: number | null;
 kind: string;
 status: string;
 meeting_link?: string | null;
}

interface AttendanceRecord {
 user_id: string;
 display_name: string | null;
 status: "attended" | "partial" | "absent";
}

interface CohortSessionsProps {
 cohort: Cohort;
 onAddSession: () => void;
 onAttendance: (sessionId: string) => void;
}

interface CohortForm {
 name: string;
 starts_on: string;
 ends_on: string;
 capacity: string;
 timezone: string;
 status: string;
}

interface SessionForm {
 title: string;
 scheduled_date: string;
 duration_minutes: number;
 meeting_link: string;
 kind: string;
 is_mandatory: boolean;
}

/**
 * GroUp Academy: Technical Classroom Session Controller Hub (InstructorCourseSessions)
 * Hardened operational cockpit tracking relational lists and insulating data mutations with explicit type safety.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function InstructorCourseSessions() {
 const { contentId: unverifiedContentParamStr } = useParams<{ contentId: string }>();

 const { data: cohortsRegistryData = [], isLoading: isCohortsCacheResolving } = useCohorts(unverifiedContentParamStr);

 const [selectedCohortIdState, setSelectedCohortIdState] = React.useState<string | null>(null);
 const [isCohortSheetOpen, setIsCohortSheetOpen] = React.useState<boolean>(false);
 const [isSessionSheetOpen, setIsSessionSheetOpen] = React.useState<boolean>(false);
 const [activeAttendanceTargetSessionId, setActiveAttendanceTargetSessionId] = React.useState<string | null>(null);

 // Safely cast registry array contexts to shield hooks from shape modifications
 const typedCohortsArray = cohortsRegistryData as unknown as Cohort[];

 const resolvedActiveCohortNode = React.useMemo<Cohort | null>(() => {
 if (typedCohortsArray.length === 0) return null;
 return typedCohortsArray.find((cohortItem) => cohortItem.id === selectedCohortIdState) ?? typedCohortsArray[0];
 }, [typedCohortsArray, selectedCohortIdState]);

 if (isCohortsCacheResolving) {
 return (
 <div
 role="status"
 className="min-h-[50vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Loading sessions...</span>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto px-4 py-4 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: ADMINISTRATIVE HUB CONTROL BAR */}
 <header className="block w-full select-none pb-4 border-b border-border/10">
 <Link
 to="/app/instructor"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
 >
 <ChevronLeft className="h-3 w-3 stroke-[2.2]" /> <span>Return to Instructor Workspace</span>
 </Link>

 <div className="flex items-center justify-between mt-3 leading-none w-full">
 <div className="space-y-0.5 block">
 <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
 Cohorts & Instruction Sessions
 </h1>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block">
 Manage live seminar delivery rosters, tracking logs, and attendance manifests.
 </p>
 </div>
 <Button
 type="button"
 size="sm"
 onClick={() => setIsCohortSheetOpen(true)}
 className="h-8 rounded-lg font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1 cursor-pointer shrink-0 shadow-2xs transform-gpu active:scale-[0.985]"
 >
 <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
 <span>Add Cohort</span>
 </Button>
 </div>
 </header>

 {/* HUD LEVEL 2: RECONCILED FILTER BUTTON ROWS */}
 <main className="mt-4 space-y-4 block w-full">
 {typedCohortsArray.length === 0 ? (
 <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block">
 <Inbox className="h-6 w-6 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
 No active learning cohorts assigned under this specification. Instantiate a root group configuration block
 to start.
 </p>
 </div>
 ) : (
 <div className="flex gap-1.5 overflow-x-auto pb-1.5 w-full select-none scrollbar-none transform-gpu shrink-0 block">
 {typedCohortsArray.map((cohortItemNode) => (
 <button
 key={`cohort-filter-pill-${cohortItemNode.id}`}
 type="button"
 onClick={() => setSelectedCohortIdState(cohortItemNode.id)}
 className={cn(
 "shrink-0 h-7 px-3 rounded-full text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wide border transition-all cursor-pointer shadow-2xs outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
 resolvedActiveCohortNode?.id === cohortItemNode.id
 ? "bg-primary border-primary text-primary-foreground font-black"
 : "bg-card/40 border-border/60 text-muted-foreground/70 hover:bg-accent/60 hover:text-foreground",
 )}
 >
 {cohortItemNode.name}
 </button>
 ))}
 </div>
 )}

 {/* Dynamic Inner Cohort Roster Display Frame */}
 {resolvedActiveCohortNode && (
 <CohortSessions
 cohort={resolvedActiveCohortNode}
 onAddSession={() => setIsSessionSheetOpen(true)}
 onAttendance={(targetSessionId: string) => setActiveAttendanceTargetSessionId(targetSessionId)}
 />
 )}
 </main>

 {/* OVERLAY PANEL CONTEXT LAYERS */}
 <CohortSheet
 open={isCohortSheetOpen}
 onClose={() => setIsCohortSheetOpen(false)}
 contentId={unverifiedContentParamStr!}
 />
 <SessionSheet
 open={isSessionSheetOpen}
 onClose={() => setIsSessionSheetOpen(false)}
 cohort={resolvedActiveCohortNode}
 contentId={unverifiedContentParamStr!}
 />
 <AttendanceSheet
 sessionId={activeAttendanceTargetSessionId}
 onClose={() => setActiveAttendanceTargetSessionId(null)}
 />
 </div>
 );
}

// =========================================================================
// NESTED ELEMENT 1: COHORT SESSIONS LIST CONTROLLER
// =========================================================================
function CohortSessions({ cohort, onAddSession, onAttendance }: CohortSessionsProps) {
 const { data: activeSessionsPayloadArray = [], isLoading: isSessionsLoading } = useCohortSessions(cohort.id);
 const typedSessionsArray = activeSessionsPayloadArray as unknown as Session[];

 return (
 <div className="space-y-3 block w-full">
 <div className="flex items-center justify-between select-none pointer-events-none leading-none w-full shrink-0">
 <p className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/40 inline-flex items-center gap-1 pt-1 leading-none">
 <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
 <span>
 SPAN: {cohort.starts_on ?? "SELF-PACED PIPELINE"}
 {cohort.ends_on ? ` → ${cohort.ends_on}` : ""}
 </span>
 </p>
 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={onAddSession}
 className="h-7 rounded-md font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1 cursor-pointer shrink-0 pointer-events-auto shadow-2xs"
 >
 <Plus className="h-3 w-3 stroke-[2.5]" />
 <span>Add Session</span>
 </Button>
 </div>

 {isSessionsLoading ? (
 <div className="w-full flex items-center justify-center py-8 font-mono text-xs font-medium tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2">
 <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
 <span>Compiling Session Syllabus...</span>
 </div>
 ) : typedSessionsArray.length === 0 ? (
 <Card className="rounded-xl border border-dashed border-border/60 bg-card/20 p-6 text-center select-none block">
 <p className="text-xs font-semibold text-muted-foreground/50 leading-normal max-w-xs mx-auto">
 No dynamic technical syllabus items or lecture segments have been scheduled under this block.
 </p>
 </Card>
 ) : (
 <div className="space-y-2 block w-full">
 {typedSessionsArray.map((sessionNodeItem) => (
 <Card
 key={`cohort-session-item-card-${sessionNodeItem.id}`}
 className="rounded-lg border border-border/60 bg-card shadow-none overflow-hidden block w-full transform-gpu transition-colors hover:border-border-foreground/5"
 >
 <CardContent className="p-3 flex items-start justify-between gap-4 leading-none w-full">
 <div className="min-w-0 flex-1 leading-none space-y-1 block">
 <h3 className="text-xs sm:text-sm font-bold text-foreground truncate uppercase tracking-wide block pt-0.5">
 {sessionNodeItem.title}
 </h3>
 <p className="font-mono text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 leading-none select-text block tracking-tight">
 {formatEventTime(
 sessionNodeItem.scheduled_date,
 sessionNodeItem.event_timezone || DEFAULT_EVENT_TZ,
 )}{" "}
 • {sessionNodeItem.duration_minutes ?? 60} MIN
 </p>
 <div className="mt-1.5 flex items-center gap-1.5 select-none pointer-events-none flex-wrap leading-none">
 <Badge
 variant="outline"
 className="font-mono text-[9px] font-extrabold uppercase px-1 h-4 bg-background/50 text-muted-foreground/60 border-border/40 shrink-0 leading-none pt-0.5 rounded-xs"
 >
 {sessionNodeItem.kind.replace(/_/g, " ")}
 </Badge>
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-extrabold uppercase px-1 h-4 text-muted-foreground border border-border/5 shrink-0 leading-none pt-0.5 rounded-xs"
 >
 {sessionNodeItem.status}
 </Badge>
 </div>
 </div>

 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={() => onAttendance(sessionNodeItem.id)}
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shrink-0 shadow-2xs pt-0.5"
 >
 <Users className="h-3.5 w-3.5 text-muted-foreground/60 stroke-[2.2]" />
 <span>Attendance</span>
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}

// =========================================================================
// NESTED ELEMENT 2: NEW COHORT CREATION SHEET OVERLAY
// =========================================================================
interface CohortSheetProps {
 open: boolean;
 onClose: () => void;
 contentId: string;
}

function CohortSheet({ open, onClose, contentId }: CohortSheetProps) {
 const saveCohortMutation = useSaveCohort();
 const { toast } = useToast();

 const [cohortFormState, setCohortFormState] = React.useState<CohortForm>({
 name: "",
 starts_on: "",
 ends_on: "",
 capacity: "",
 timezone: "Asia/Dhaka",
 status: "open",
 });

 const handleInputChange = React.useCallback((fieldKey: keyof CohortForm, valueString: string) => {
 setCohortFormState((prev) => ({ ...prev, [fieldKey]: valueString }));
 }, []);

 const handleCohortSubmissionSequence = React.useCallback(async () => {
 if (!cohortFormState.name.trim()) {
 toast({
 title: "Validation Error",
 description: "A unique cohort target moniker must be supplied.",
 variant: "destructive",
 });
 return;
 }

 try {
 await saveCohortMutation.mutateAsync({
 ...cohortFormState,
 capacity: cohortFormState.capacity ? Number(cohortFormState.capacity) : null,
 content_id: contentId,
 });
 toast({
 title: "Configuration Confirmed",
 description: "The learning group matrix has been initialized successfully.",
 });
 setCohortFormState({
 name: "",
 starts_on: "",
 ends_on: "",
 capacity: "",
 timezone: "Asia/Dhaka",
 status: "open",
 });
 onClose();
 } catch (mutationExceptionPayload: any) {
 toast({
 title: "Execution Refused",
 description: mutationExceptionPayload.message || "Failed to commit record maps.",
 variant: "destructive",
 });
 }
 }, [cohortFormState, contentId, onClose, saveCohortMutation, toast]);

 return (
 <Sheet open={open} onOpenChange={onClose}>
 <SheetContent
 side="right"
 className="rounded-l-xl w-full max-w-sm overflow-y-auto block select-none border-l border-border/60 bg-popover/95 "
 >
 <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
 <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
 Initialize New Cohort
 </SheetTitle>
 <SheetDescription className="text-[11px] font-semibold text-muted-foreground/50">
 Deploy an independent structural student tracking row.
 </SheetDescription>
 </SheetHeader>

 <div className="space-y-3.5 mt-4 block w-full leading-none">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Cohort Name Designation
 </Label>
 <Input
 type="text"
 disabled={saveCohortMutation.isPending}
 placeholder="e.g., Phase Alpha 2026"
 value={cohortFormState.name}
 onChange={(e) => handleInputChange("name", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
 />
 </div>

 <div className="grid grid-cols-2 gap-2 w-full block">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Starts On Date
 </Label>
 <Input
 type="date"
 disabled={saveCohortMutation.isPending}
 value={cohortFormState.starts_on}
 onChange={(e) => handleInputChange("starts_on", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
 />
 </div>
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Ends On Date
 </Label>
 <Input
 type="date"
 disabled={saveCohortMutation.isPending}
 value={cohortFormState.ends_on}
 onChange={(e) => handleInputChange("ends_on", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 w-full block">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Capacity Limit
 </Label>
 <Input
 type="number"
 disabled={saveCohortMutation.isPending}
 placeholder="Unlimited"
 value={cohortFormState.capacity}
 onChange={(e) => handleInputChange("capacity", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none tabular-nums font-mono"
 />
 </div>
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Operation Timezone
 </Label>
 <Input
 type="text"
 disabled={saveCohortMutation.isPending}
 value={cohortFormState.timezone}
 onChange={(e) => handleInputChange("timezone", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
 />
 </div>
 </div>

 <Button
 type="button"
 onClick={handleCohortSubmissionSequence}
 disabled={saveCohortMutation.isPending}
 className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 mt-2 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
 >
 {saveCohortMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <CheckCircle className="h-3.5 w-3.5 stroke-[2.2]" />
 )}
 <span>Commit Cohort Configuration</span>
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 );
}

// =========================================================================
// NESTED ELEMENT 3: SYLLABUS LECTURE SCHEDULING INTERACTION PANEL
// =========================================================================
interface SessionSheetProps {
 open: boolean;
 onClose: () => void;
 cohort: Cohort | null;
 contentId: string;
}

function SessionSheet({ open, onClose, cohort, contentId }: SessionSheetProps) {
 const saveSessionMutation = useSaveSession();
 const { toast } = useToast();

 const [sessionFormState, setSessionFormState] = React.useState<SessionForm>({
 title: "",
 scheduled_date: "",
 duration_minutes: 60,
 meeting_link: "",
 kind: "lecture",
 is_mandatory: false,
 });

 React.useEffect(() => {
 if (open) {
 setSessionFormState({
 title: "",
 scheduled_date: "",
 duration_minutes: 60,
 meeting_link: "",
 kind: "lecture",
 is_mandatory: false,
 });
 }
 }, [open]);

 const handleInputChange = React.useCallback((fieldKey: keyof SessionForm, val: any) => {
 setSessionFormState((prev) => ({ ...prev, [fieldKey]: val }));
 }, []);

 if (!cohort) return null;

 const handleSessionSubmissionSequence = async () => {
 if (!sessionFormState.title.trim() || !sessionFormState.scheduled_date) {
 toast({
 title: "Validation Error",
 description: "Designated lecture titles and timestamp parameters are required elements.",
 variant: "destructive",
 });
 return;
 }

 try {
 const targetUtcNormalizedDateString = new Date(sessionFormState.scheduled_date).toISOString();

 await saveSessionMutation.mutateAsync({
 ...sessionFormState,
 cohort_id: cohort.id,
 content_id: contentId,
 scheduled_date: targetUtcNormalizedDateString,
 event_timezone: cohort.timezone || "Asia/Dhaka",
 });

 toast({
 title: "Session Dispatched",
 description: "The instructional module has been synced onto the student calendar timeline.",
 });
 onClose();
 } catch (mutationExceptionPayload: any) {
 toast({
 title: "Execution Refused",
 description: mutationExceptionPayload.message || "Failed to parse system calendar bounds.",
 variant: "destructive",
 });
 }
 };

 return (
 <Sheet open={open} onOpenChange={onClose}>
 <SheetContent
 side="right"
 className="rounded-l-xl w-full max-w-sm overflow-y-auto block select-none border-l border-l-border/60 bg-popover/95 "
 >
 <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
 <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground truncate">
 Schedule Session Node
 </SheetTitle>
 <SheetDescription className="text-[11px] font-semibold text-muted-foreground/50">
 Append allocation block to child target: {cohort.name}
 </SheetDescription>
 </SheetHeader>

 <div className="space-y-3.5 mt-4 block w-full leading-none">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Lecture Module Title
 </Label>
 <Input
 type="text"
 disabled={saveSessionMutation.isPending}
 placeholder="e.g., Cryptographic Ledger Sync"
 value={sessionFormState.title}
 onChange={(e) => handleInputChange("title", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
 />
 </div>

 <div className="grid grid-cols-2 gap-2 w-full block">
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Target Execution Time
 </Label>
 <Input
 type="datetime-local"
 disabled={saveSessionMutation.isPending}
 value={sessionFormState.scheduled_date}
 onChange={(e) => handleInputChange("scheduled_date", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
 />
 </div>
 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Duration (Minutes)
 </Label>
 <Input
 type="number"
 disabled={saveSessionMutation.isPending}
 value={sessionFormState.duration_minutes}
 onChange={(e) => handleInputChange("duration_minutes", Number(e.target.value))}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono tabular-nums"
 />
 </div>
 </div>

 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Interactive Meeting Link Endpoint
 </Label>
 <Input
 type="url"
 disabled={saveSessionMutation.isPending}
 placeholder="https://meet.google.com/..."
 value={sessionFormState.meeting_link}
 onChange={(e) => handleInputChange("meeting_link", e.target.value)}
 className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
 />
 </div>

 <div className="space-y-1 block leading-none">
 <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
 Instructional Sequence Variant
 </Label>
 <select
 disabled={saveSessionMutation.isPending}
 className="w-full h-9 rounded-lg border border-border/40 bg-background/50 px-3 font-sans text-xs sm:text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
 value={sessionFormState.kind}
 onChange={(e) => handleInputChange("kind", e.target.value)}
 >
 <option value="lecture">Lecture Sequence</option>
 <option value="office_hours">Office Hours Briefing</option>
 <option value="review">Syllabus Evaluation Review</option>
 <option value="exam">Terminal Examination Gate</option>
 <option value="orientation">Onboarding Orientation</option>
 <option value="workshop">Applied Core Workshop</option>
 </select>
 </div>

 <Button
 type="button"
 onClick={handleSessionSubmissionSequence}
 disabled={saveSessionMutation.isPending}
 className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 mt-2 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
 >
 {saveSessionMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Clock className="h-3.5 w-3.5 stroke-[2.2]" />
 )}
 <span>Schedule Instruction Node</span>
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 );
}

// =========================================================================
// NESTED ELEMENT 4: OPERATOR ATTENDANCE SHEET REGISTER
// =========================================================================
interface AttendanceSheetProps {
 sessionId: string | null;
 onClose: () => void;
}

function AttendanceSheet({ sessionId, onClose }: AttendanceSheetProps) {
 const { data: attendanceRegistryRows = [], isLoading: isAttendanceResolving } = useInstructorAttendance(
 sessionId ?? undefined,
 );
 const typedAttendanceArray = attendanceRegistryRows as unknown as AttendanceRecord[];

 return (
 <Sheet open={!!sessionId} onOpenChange={onClose}>
 <SheetContent
 side="right"
 className="rounded-l-xl w-full max-w-sm overflow-y-auto block select-none border-l border-border/60 bg-popover/95 "
 >
 <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
 <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
 Attendance Manifest
 </SheetTitle>
 <SheetDescription className="text-[11px] font-semibold text-muted-foreground/50">
 Audit log validation overview parameters.
 </SheetDescription>
 </SheetHeader>

 {isAttendanceResolving ? (
 <div className="w-full flex items-center justify-center py-12 font-mono text-xs font-medium tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2">
 <Loader2 className="h-3 w-3 animate-spin text-primary" />
 <span>Resolving Enrolled Records...</span>
 </div>
 ) : (
 <div className="mt-4 block w-full divide-y divide-border/5">
 {typedAttendanceArray.length === 0 ? (
 <p className="text-xs font-semibold text-muted-foreground/50 text-center select-none py-6">
 No verified user footprints or learner links recorded under this node sequence.
 </p>
 ) : (
 typedAttendanceArray.map((userRecordItem) => (
 <div
 key={`attendance-record-mapping-row-${userRecordItem.user_id}`}
 className="flex items-center justify-between py-2.5 text-xs sm:text-sm font-medium border-b border-border/5 leading-none w-full block"
 >
 <span className="truncate pr-4 select-text font-bold text-foreground/80 uppercase tracking-wide">
 {userRecordItem.display_name || `OP_REF_NODE:${userRecordItem.user_id.slice(0, 8).toUpperCase()}`}
 </span>

 <Badge
 variant={
 userRecordItem.status === "attended"
 ? "default"
 : userRecordItem.status === "partial"
 ? "secondary"
 : "outline"
 }
 className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 shrink-0 select-none pointer-events-none leading-none pt-0.5 rounded-sm"
 >
 {userRecordItem.status}
 </Badge>
 </div>
 ))
 )}
 </div>
 )}
 </SheetContent>
 </Sheet>
 );
}
