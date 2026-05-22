import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLatestIdentityDoc, insertIdentityDoc, uploadIdentityDoc } from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ShieldCheck, Upload, Loader2, CheckCircle2, Clock, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface IdDoc {
  id: string;
  doc_type: "nid" | "passport";
  front_url: string;
  back_url: string | null;
  status: "pending" | "verified" | "rejected";
  review_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Under review",
    icon: Clock,
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15",
  },
} as const;

/**
 * GroUp Academy: Identity Verification Document Ingress Terminal (IdentityDocsUpload)
 * An authoritative operational sandbox managing identity document storage commits, encryption locks, and validation states.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function IdentityDocsUpload() {
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const isMountedRef = useRef<boolean>(true);

  const [doc, setDoc] = useState<IdDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<"nid" | "passport">("nid");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const frontInput = useRef<HTMLInputElement>(null);
  const backInput = useRef<HTMLInputElement>(null);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("identity_docs_upload_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadActiveVerificationDocument = async () => {
    if (!talent?.id) return;

    // Prevent setting state on initial background mounts if unmounted early
    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const structuralRecord = (await getLatestIdentityDoc(talent.id)) as IdDoc | null;

      if (isMountedRef.current) {
        setDoc(structuralRecord);
        setLoading(false);
        trackEvent("identity_docs_record_loaded", { status: structuralRecord?.status });
      }
    } catch (err) {
      trackError(err, { component: "IdentityDocsUpload", action: "load_active_verification_document" });
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadActiveVerificationDocument();
  }, [talent?.id]);

  const uploadOne = async (uid: string, file: File, label: string): Promise<string> => {
    const fileExtensionString = file.name.split(".").pop() || "jpg";
    const fullTargetStoragePathStr = `${uid}/${Date.now()}-${label}.${fileExtensionString}`;

    await uploadIdentityDoc(fullTargetStoragePathStr, file, { upsert: false });
    return fullTargetStoragePathStr;
  };

  const submit = async () => {
    if (!talent?.id) return;
    if (!frontFile) return toast.error("Front side verification image is required.");
    if (docType === "nid" && !backFile) return toast.error("Reverse side of National ID is required.");

    setBusy(true);
    trackEvent("identity_docs_submission_initiated", { docType });
    const dynamicToastTrackerId = toast.loading("Encrypting identity resources over secure bucket nodes...");

    try {
      const { data: sessionPayload, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const uid = sessionPayload.session?.user.id;
      if (!uid) throw new Error("Authentication index token lost. Please log in.");

      const front_url = await uploadOne(uid, frontFile, "front");
      const back_url = backFile ? await uploadOne(uid, backFile, "back") : null;

      await insertIdentityDoc({
        talentId: talent.id,
        userId: uid,
        docType,
        frontUrl: front_url,
        backUrl: back_url,
      });

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-id-docs"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        toast.success("Identity tokens submitted. Verification process resolves within 24 hours.", {
          id: dynamicToastTrackerId,
        });
        setFrontFile(null);
        setBackFile(null);
        if (frontInput.current) frontInput.current.value = "";
        if (backInput.current) backInput.current.value = "";

        trackEvent("identity_docs_submission_success");
        await loadActiveVerificationDocument();
      }
    } catch (e: any) {
      const parsedExceptionMsg = e instanceof Error ? e.message : String(e);
      trackError(parsedExceptionMsg, { component: "IdentityDocsUpload", action: "commit_identity_docs_pipeline" });
      toast.error(`Ingress Handshake Failed: ${parsedExceptionMsg}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setBusy(false);
      }
    }
  };

  const metaActiveConfig = useMemo(() => (doc ? STATUS_CONFIG[doc.status] : null), [doc]);
  const StatusIconComponent = useMemo(() => metaActiveConfig?.icon || Clock, [metaActiveConfig]);

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden transition-colors hover:border-border/60">
      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
        <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none shrink-0 h-8">
          <div className="flex items-center gap-2 min-w-0 flex-1 h-full">
            <ShieldCheck className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide truncate block pt-0.5 leading-none">
              Identity Verification
            </h3>
          </div>
        </div>

        <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal select-none pr-1">
          Upload either your National Identification Smart Card (both sides) or valid international Passport photo page.
          Identity validation is strictly required to authorize balance withdrawals.
        </p>

        {/* LOADING PROCESSING INDICATOR SCREEN */}
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground select-none leading-none w-full">
            <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider pl-0.5 animate-pulse">
              Hydrating Verification Node Ledger…
            </span>
          </div>
        ) : doc ? (
          /* ACTIVE COMPLIANCE STATUS RADAR STRIP */
          <div className="p-3.5 rounded-xl border border-border/40 bg-background/50 flex items-start justify-between gap-4 w-full min-w-0 leading-none shadow-xs font-bold text-xs">
            <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-foreground/90 uppercase tracking-wide leading-none select-text">
                {doc.doc_type === "nid" ? "National Identification Card" : "International Passport"}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-tight leading-none pt-0.5 tabular-nums select-none">
                Transmission committed on {new Date(doc.created_at).toLocaleDateString()}
              </p>
              {doc.review_notes && doc.status === "rejected" && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 select-text bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg leading-normal mt-1 w-full pr-1">
                  Exception Reason: {doc.review_notes.trim()}
                </p>
              )}
            </div>
            {metaActiveConfig && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded px-2 h-5.5 text-[9px] font-extrabold tracking-wider uppercase border flex items-center leading-none shadow-xs shrink-0 select-none",
                  metaActiveConfig.cls,
                )}
              >
                <StatusIconComponent className="h-3 w-3 mr-1 stroke-[2.5]" />
                <span className="pt-0.5 block">{metaActiveConfig.label}</span>
              </Badge>
            )}
          </div>
        ) : null}

        {/* HUD LEVEL 2: REGISTRY ACTIONS ENTRY INPUT FIELDS FORM */}
        {(!doc || doc.status === "rejected") && (
          <div className="space-y-3.5 p-3.5 border border-border/40 bg-background/50 rounded-xl w-full min-w-0 flex flex-col justify-center animate-in slide-in-from-bottom-1 duration-200">
            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 select-none leading-none">
                Document type
              </Label>
              <Select
                value={docType}
                disabled={busy}
                onValueChange={(v) => {
                  trackEvent("identity_docs_type_altered", { type: v });
                  setDocType(v as any);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs">
                  <SelectItem value="nid" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    National ID (both sides)
                  </SelectItem>
                  <SelectItem value="passport" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    Passport (photo page)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                {docType === "nid" ? "Front of National ID smart card *" : "Passport main photo page *"}
              </Label>
              <input
                ref={frontInput}
                type="file"
                disabled={busy}
                accept="image/*,application/pdf"
                onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                className="w-full text-xs font-medium cursor-pointer text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border/60 file:text-[10px] file:font-bold file:uppercase file:tracking-wide file:bg-background file:text-foreground file:cursor-pointer hover:file:bg-accent outline-none"
              />
            </div>

            {docType === "nid" && (
              <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
                <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                  Reverse Back of National ID smart card *
                </Label>
                <input
                  ref={backInput}
                  type="file"
                  disabled={busy}
                  accept="image/*,application/pdf"
                  onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-medium cursor-pointer text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border/60 file:text-[10px] file:font-bold file:uppercase file:tracking-wide file:bg-background file:text-foreground file:cursor-pointer hover:file:bg-accent outline-none"
                />
              </div>
            )}

            <Button
              onClick={submit}
              disabled={busy}
              type="button"
              className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 mt-2 select-none"
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                  <span>Processing Secure Ledger Ingress…</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>Commit Document for Audit Review</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="mt-4 flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Identity core cryptographic compliance verification tracking indices v1.0 complete</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default IdentityDocsUpload;
