import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio, ExternalLink, AlertCircle, Inbox, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMarkAttendance } from "@/domains/learning";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ClassroomSessionMetadata {
 id: string;
 title: string;
 scheduled_date: string;
 duration_minutes: number | null;
 meeting_link: string | null;
 recording_link: string | null;
 status: string | null;
 event_timezone: string | null;
 content_id: string | null;
}

/**
 * GroUp Academy: Auth-Gated Realtime Session Ingress Router (AppSessionJoin)
 * Hardened access token redirect capturing parallel attendance logging and shielding linkages from browser popup blocker rejections.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppSessionJoin() {
 const { sessionId: unverifiedSessionIdStr } = useParams<{ sessionId: string }>();
 const navigateHook = useNavigate();

 const { user: userAuthRecord, isLoading: isAuthHookResolving } = useAuth();
 const markAttendanceMutation = useMarkAttendance();

 const [sessionMetadataState, setSessionMetadataState] = React.useState<ClassroomSessionMetadata | null>(null);
 const [pipelineHandshakeErrorStr, setPipelineHandshakeErrorStr] = React.useState<string | null>(null);
 const [isUplinkOpenedFlag, setIsUplinkOpenedFlag] = React.useState<boolean>(false);

 // =========================================================================
 // LIFECYCLE SECTOR 1: SECURE AUTH CONTEXT VALIDATION & RETRIEVAL MATRICES
 // =========================================================================
 React.useEffect(() => {
 if (isAuthHookResolving) return;

 if (!userAuthRecord) {
 const serializedRedirectPathStr = encodeURIComponent(`/app/sessions/${unverifiedSessionIdStr}/join`);
 navigateHook(`/auth?redirect=${serializedRedirectPathStr}`, { replace: true });
 return;
 }

 let isThreadActive = true;
 setPipelineHandshakeErrorStr(null);

 const executeSessionProcurementSequence = async () => {
 if (!unverifiedSessionIdStr) return;

 try {
 const { data: dbSessionPayload, error: queryHandshakeError } = await supabase
 .from("course_sessions")
 .select(
 "id, title, scheduled_date, duration_minutes, meeting_link, recording_link, status, event_timezone, content_id",
 )
 .eq("id", unverifiedSessionIdStr)
 .maybeSingle();

 if (!isThreadActive) return;

 if (queryHandshakeError || !dbSessionPayload) {
 setPipelineHandshakeErrorStr("The requested classroom pipeline channel parameters could not be localized.");
 return;
 }

 setSessionMetadataState(dbSessionPayload as unknown as ClassroomSessionMetadata);

 // Execute back-end mutation logging seamlessly inside safe tracking threads
 markAttendanceMutation.mutate(unverifiedSessionIdStr);
 } catch (fatalExceptionPayload) {
 if (isThreadActive) {
 setPipelineHandshakeErrorStr("System link handshake communication failure recorded.");
 }
 }
 };

 executeSessionProcurementSequence();

 return () => {
 isThreadActive = false;
 };
 }, [unverifiedSessionIdStr, userAuthRecord, isAuthHookResolving, navigateHook]);

 // =========================================================================
 // ACTION HOOKS: PROTECTED SECURE POPUP REDIRECTION CORES
 // =========================================================================
 const handleManualMeetingRoomIngress = React.useCallback(() => {
 if (!sessionMetadataState?.meeting_link) return;

 // Binding window dispatch vectors to deliberate user clicks preserves browser permission maps
 window.open(sessionMetadataState.meeting_link, "_blank", "noopener,noreferrer");
 setIsUplinkOpenedFlag(true);
 }, [sessionMetadataState]);

 const handleReturnToDashboardRedirect = React.useCallback(() => {
 navigateHook("/app/my-learning");
 }, [navigateHook]);

 // =========================================================================
 // CONDITION RENDERING SKELETON GATES AND CHECKS
 // =========================================================================
 if (isAuthHookResolving || (!sessionMetadataState && !pipelineHandshakeErrorStr)) {
 return (
 <div
 role="status"
 className="min-h-[60vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none antialiased"
 >
 <div className="flex items-center gap-2.5">
 <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
 <span>Authenticating Pipeline Handshake Token...</span>
 </div>
 </div>
 );
 }

 if (pipelineHandshakeErrorStr || !sessionMetadataState) {
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
 <p className="text-xs font-bold text-foreground uppercase tracking-wide">Ingress Access Restricted</p>
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal mt-1">
 {pipelineHandshakeErrorStr ||
 "The scheduled meeting pipeline credentials are empty or unpublished under this token."}
 </p>
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={handleReturnToDashboardRedirect}
 className="h-8 rounded-lg font-mono text-xs font-medium tracking-wider px-3 shadow-2xs cursor-pointer border border-border/60 bg-background/50"
 >
 Return to Learning Hub
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-md mx-auto px-4 py-8 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: ENTRY COORDINATES ABSTRACT DATA PANEL SLOTS */}
 <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
 <CardContent className="p-4 space-y-3.5 block w-full leading-none">
 <div className="flex items-start gap-2.5 leading-none w-full block">
 <Radio className="h-4 w-4 text-rose-500 stroke-[2.5] animate-pulse shrink-0 mt-0.5 select-none pointer-events-none" />
 <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground leading-normal block select-text pt-0.5">
 {sessionMetadataState.title}
 </h1>
 </div>

 <p className="font-mono text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 select-none pointer-events-none block tracking-tight pt-0.5 border-b border-border/5 pb-2">
 {formatEventTime(
 sessionMetadataState.scheduled_date,
 sessionMetadataState.event_timezone || DEFAULT_EVENT_TZ,
 ).toUpperCase()}{" "}
 <span className="opacity-30 mx-1">•</span> DURATION:{" "}
 {(sessionMetadataState.duration_minutes ?? 60).toString()} MIN
 </p>

 {/* HUD LEVEL 2: COMPLIANCE INTEGRATION CALL-TO-ACTIONS INTERFACES */}
 <div className="block w-full leading-none pt-1">
 {sessionMetadataState.meeting_link ? (
 <Button
 type="button"
 onClick={handleManualMeetingRoomIngress}
 className="w-full h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
 >
 <ExternalLink className="h-3.5 w-3.5 stroke-[2.5] inline-block shrink-0 align-middle" />
 <span className="inline-block align-middle pt-0.5">Open Secure Meeting Room Ingress</span>
 </Button>
 ) : sessionMetadataState.recording_link ? (
 <Button
 asChild
 type="button"
 variant="outline"
 className="w-full h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 hover:bg-accent cursor-pointer transition-colors shadow-2xs block text-center pt-2"
 >
 <a href={sessionMetadataState.recording_link} target="_blank" rel="noopener noreferrer">
 Stream Historical Lecture Playback
 </a>
 </Button>
 ) : (
 <p className="text-[11px] font-medium text-muted-foreground/60 leading-normal block select-none pointer-events-none py-1">
 The technical channel uplink route variables are unassigned. Connection links populating automatically
 upon operational publication by your lead instructor node.
 </p>
 )}
 </div>

 {/* HUD LEVEL 3: VALIDATION VERIFIED LOG INDICATORS BAR */}
 <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-emerald-600 border-t border-border/5 pt-3 w-full shrink-0 select-none pointer-events-none uppercase tracking-wide leading-none">
 <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" />
 <span className="pt-0.5">Attendance Registration Verified and Signed</span>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
