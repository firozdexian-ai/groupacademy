import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAcceptOffer, useDeclineOffer } from "@/hooks/useOffers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, ArrowLeft, ShieldAlert, CheckCircle2, Ban } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface JobMetadata {
  title: string;
  company_name: string;
  company_logo_url: string | null;
}

interface OfferPayload {
  id: string;
  application_id: string;
  title: string;
  status: string;
  currency: string;
  base_amount: number;
  variable_amount: number | null;
  start_date: string | null;
  expires_at: string | null;
  benefits: string | null;
  equity_note: string | null;
  custom_note: string | null;
  signed_name: string | null;
  signed_at: string | null;
}

interface DecisionMutationPayload {
  offerId: string;
  signedName?: string;
  note?: string;
  applicationId: string;
}

/**
 * GroUp Academy: Executive Offer Decision Matrix (AppOfferDecision)
 * Hardened responsive decision cockpit evaluating compensation vectors, securing signature capture strings, and tracking lifecycle threads safely.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AppOfferDecision() {
  const { id: unverifiedApplicationIdStr, offerId: unverifiedOfferIdStr } = useParams<{
    id: string;
    offerId: string;
  }>();
  const navigateHook = useNavigate();

  const acceptOfferMutation = useAcceptOffer();
  const declineOfferMutation = useDeclineOffer();

  const [offerRecordState, setOfferRecordState] = React.useState<OfferPayload | null>(null);
  const [jobRecordState, setJobRecordState] = React.useState<JobMetadata | null>(null);

  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
  const [textSignatureInput, setTextSignatureInput] = React.useState<string>("");
  const [textDeclineNoteInput, setTextDeclineNoteInput] = React.useState<string>("");
  const [activeMutationContext, setActiveMutationContext] = React.useState<"accept" | "decline" | null>(null);

  // =========================================================================
  // LIFECYCLE SECTOR 1: INSULATED PARALLEL INTERFACE INVENTORY LOOKUP
  // =========================================================================
  const synchronizeOfferDossierState = React.useCallback(
    async (isThreadActiveFlag: { current: boolean }) => {
      if (!unverifiedOfferIdStr) return;

      setIsDataLayerLoading(true);
      try {
        const { data: offerQueryPayload, error: offerHandshakeError } = await supabase
          .from("offers")
          .select("*")
          .eq("id", unverifiedOfferIdStr)
          .maybeSingle();

        if (offerHandshakeError) throw offerHandshakeError;
        if (!offerQueryPayload) {
          if (isThreadActiveFlag.current) {
            setOfferRecordState(null);
            setIsDataLayerLoading(false);
          }
          return;
        }

        if (!isThreadActiveFlag.current) return;
        const verifiedOfferCast = offerQueryPayload as unknown as OfferPayload;
        setOfferRecordState(verifiedOfferCast);

        // Perform secondary relational application query step down-stream securely
        const { data: applicationQueryPayload } = await supabase
          .from("job_applications")
          .select("job_id")
          .eq("id", verifiedOfferCast.application_id)
          .maybeSingle();

        if (applicationQueryPayload?.job_id && isThreadActiveFlag.current) {
          const { data: jobQueryPayload } = await supabase
            .from("jobs")
            .select("title, company_name, company_logo_url")
            .eq("id", applicationQueryPayload.job_id)
            .maybeSingle();

          if (jobQueryPayload && isThreadActiveFlag.current) {
            setJobRecordState(jobQueryPayload as unknown as JobMetadata);
          }
        }
      } catch (fatalHandshakeException) {
        console.error("[offers] Failed to load offer:", fatalHandshakeException);
        toast.error("Couldn't load the offer.");
      } finally {
        if (isThreadActiveFlag.current) {
          setIsDataLayerLoading(false);
        }
      }
    },
    [unverifiedOfferIdStr],
  );

  React.useEffect(() => {
    const isThreadActiveFlag = { current: true };
    synchronizeOfferDossierState(isThreadActiveFlag);

    return () => {
      isThreadActiveFlag.current = false;
    };
  }, [unverifiedOfferIdStr, synchronizeOfferDossierState]);

  // =========================================================================
  // ACTION HOOKS: TRANSACTION AUTHORIZATION PIPELINE MUTATIONS
  // =========================================================================
  const handleAcceptOfferSequence = React.useCallback(async () => {
    if (!unverifiedOfferIdStr || !unverifiedApplicationIdStr) return;

    const sanitizedSignatureStr = textSignatureInput.trim();
    if (sanitizedSignatureStr.length < 2) {
      toast.error("Validation failed. You must input your full legal signature to commit package parameters.");
      return;
    }

    setActiveMutationContext("accept");
    const isThreadActiveFlag = { current: true };

    try {
      await acceptOfferMutation.mutateAsync({
        offerId: unverifiedOfferIdStr,
        signedName: sanitizedSignatureStr,
        applicationId: unverifiedApplicationIdStr,
      });

      toast.success("Dossier execution variables cryptographically signed.");
      await synchronizeOfferDossierState(isThreadActiveFlag);
    } catch (suppressedMutationException) {
      // System constraints tracked within parent validation frames
    } finally {
      if (isThreadActiveFlag.current) {
        setActiveMutationContext(null);
      }
      isThreadActiveFlag.current = false;
    }
  }, [
    textSignatureInput,
    unverifiedOfferIdStr,
    unverifiedApplicationIdStr,
    acceptOfferMutation,
    synchronizeOfferDossierState,
  ]);

  const handleDeclineOfferSequence = React.useCallback(async () => {
    if (!unverifiedOfferIdStr || !unverifiedApplicationIdStr) return;

    setActiveMutationContext("decline");
    const isThreadActiveFlag = { current: true };

    try {
      await declineOfferMutation.mutateAsync({
        offerId: unverifiedOfferIdStr,
        note: textDeclineNoteInput.trim(),
        applicationId: unverifiedApplicationIdStr,
      });

      toast.info("Offer parameters declined. Records successfully updated.");
      await synchronizeOfferDossierState(isThreadActiveFlag);
    } catch (suppressedMutationException) {
      // Safe fallback boundary channel
    } finally {
      if (isThreadActiveFlag.current) {
        setActiveMutationContext(null);
      }
      isThreadActiveFlag.current = false;
    }
  }, [
    textDeclineNoteInput,
    unverifiedOfferIdStr,
    unverifiedApplicationIdStr,
    declineOfferMutation,
    synchronizeOfferDossierState,
  ]);

  const handleReturnToDossierRedirect = React.useCallback(() => {
    if (unverifiedApplicationIdStr) {
      navigateHook(`/app/applications/${unverifiedApplicationIdStr}`);
    }
  }, [unverifiedApplicationIdStr, navigateHook]);

  // =========================================================================
  // CONDITION RENDERING LAYOUT CONTROL CHECKPOINTS
  // =========================================================================
  if (isDataLayerLoading) {
    return (
      <div
        role="status"
        className="w-full flex items-center justify-center py-16 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2.5"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        <span>Compiling Offer Documentation...</span>
      </div>
    );
  }

  if (!offerRecordState) {
    return (
      <div
        role="alert"
        className="min-h-[40vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Document Contract Absent</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The targeted placement offer parameters index could not be resolved from active database partitions.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReturnToDossierRedirect}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 shadow-2xs cursor-pointer"
          >
            Return to Dossier Overview
          </Button>
        </div>
      </div>
    );
  }

  const isDossierDecidedFlag = offerRecordState.status === "accepted" || offerRecordState.status === "declined";

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APPLICATION COCKPIT DIRECTION BACK Nav FRAME */}
      <div className="block select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReturnToDossierRedirect}
          className="h-8 px-2.5 rounded-md font-bold uppercase tracking-wide text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Dossier Index</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: DETAILED EMOLUMENTS COMPILATION VIEW */}
      <Card className="rounded-xl border border-border/60 bg-card/40 overflow-hidden block w-full shadow-none">
        <CardContent className="p-4 sm:p-5 space-y-4 block w-full leading-none">
          <div className="flex items-center gap-3.5 leading-none block w-full select-none">
            {jobRecordState?.company_logo_url && (
              <div className="h-10 w-10 rounded-lg bg-background border border-border/40 shadow-3xs shrink-0 overflow-hidden pointer-events-none">
                <img src={jobRecordState.company_logo_url} className="object-cover w-full h-full block" alt="" />
              </div>
            )}
            <div className="min-w-0 flex-1 leading-none space-y-0.5">
              <p className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wide block truncate select-text">
                {jobRecordState?.company_name || "CORPORATE ORIGIN UNLINKED"}
              </p>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5 truncate block pt-0.5 select-text">
                <FileText className="h-4 w-4 text-primary stroke-[2.2] shrink-0 pointer-events-none" />
                <span>Offer Run: {offerRecordState.title}</span>
              </h2>
            </div>
          </div>

          <div className="select-none pointer-events-none block leading-none w-full shrink-0 pt-0.5">
            <Badge
              variant={isDossierDecidedFlag ? "default" : "secondary"}
              className="font-mono text-[9px] font-black uppercase px-2 h-5 tracking-wide pt-0.5 leading-none shrink-0 border rounded-xs shadow-3xs"
            >
              STATE: {offerRecordState.status.toUpperCase()}
            </Badge>
          </div>

          {/* HUD LEVEL 3: TABULAR FINANCIAL VECTOR CONFIGS */}
          <dl className="grid grid-cols-2 gap-3.5 pt-2 border-t border-border/5 text-xs font-semibold block w-full select-text tracking-normal">
            <div className="space-y-0.5 block">
              <dt className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none">
                Base Emoluments Currency
              </dt>
              <dd className="text-foreground text-xs font-bold font-mono tabular-nums">
                {offerRecordState.currency} {Number(offerRecordState.base_amount).toLocaleString()}
              </dd>
            </div>
            {offerRecordState.variable_amount !== null && (
              <div className="space-y-0.5 block">
                <dt className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none">
                  Variable Quantum Margin
                </dt>
                <dd className="text-foreground text-xs font-bold font-mono tabular-nums">
                  {offerRecordState.currency} {Number(offerRecordState.variable_amount).toLocaleString()}
                </dd>
              </div>
            )}
            {offerRecordState.start_date && (
              <div className="space-y-0.5 block">
                <dt className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none">
                  Target Activation Onset
                </dt>
                <dd className="text-muted-foreground/80 font-mono uppercase text-[11px]">
                  {format(new Date(offerRecordState.start_date), "PP").toUpperCase()}
                </dd>
              </div>
            )}
            {offerRecordState.expires_at && (
              <div className="space-y-0.5 block">
                <dt className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none">
                  Horizon Constraint Horizon
                </dt>
                <dd className="text-muted-foreground/80 font-mono uppercase text-[11px] tabular-nums">
                  {format(new Date(offerRecordState.expires_at), "PPp").toUpperCase()}
                </dd>
              </div>
            )}
          </dl>

          {/* HUD LEVEL 4: SYSTEM BENEFITS COMPLIANCE ABSTRACT DESCRIPTIONS */}
          {offerRecordState.benefits && (
            <div className="space-y-1 block w-full pt-1">
              <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none leading-none">
                Corporate Welfare Perks Benefit Matrix
              </p>
              <p className="text-xs text-foreground/80 font-medium whitespace-pre-wrap leading-relaxed select-text p-2.5 bg-muted/20 border border-border/5 rounded-lg tracking-normal">
                {offerRecordState.benefits}
              </p>
            </div>
          )}
          {offerRecordState.equity_note && (
            <div className="space-y-1 block w-full pt-1">
              <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none leading-none">
                Capital Equity Vesting Coordinates
              </p>
              <p className="text-xs text-foreground/80 font-medium whitespace-pre-wrap leading-relaxed select-text p-2.5 bg-muted/20 border border-border/5 rounded-lg tracking-normal">
                {offerRecordState.equity_note}
              </p>
            </div>
          )}
          {offerRecordState.custom_note && (
            <div className="space-y-1 block w-full pt-1">
              <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none leading-none">
                Administrative Supplementary Directives
              </p>
              <p className="text-xs text-foreground/80 font-medium whitespace-pre-wrap leading-relaxed select-text p-2.5 bg-muted/20 border border-border/5 rounded-lg tracking-normal">
                {offerRecordState.custom_note}
              </p>
            </div>
          )}

          {/* HUD LEVEL 5: TRANSACTION LOGIC SIGNING DISPATCH CONTROLLERS */}
          {!isDossierDecidedFlag && offerRecordState.status === "sent" && (
            <div className="space-y-3 pt-3.5 border-t border-border/40 block w-full leading-none">
              <div className="space-y-1 block w-full leading-none">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
                  Digital Verification Signature (Type Full Legal Name)
                </Label>
                <Input
                  type="text"
                  disabled={activeMutationContext !== null}
                  value={textSignatureInput}
                  onChange={(e) => setTextSignatureInput(e.target.value)}
                  placeholder="Input legal nomenclature verification identity block string..."
                  className="h-9 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                />
              </div>

              <Button
                type="button"
                className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] select-none block text-center"
                onClick={handleAcceptOfferSequence}
                disabled={activeMutationContext !== null || textSignatureInput.trim().length < 2}
              >
                {activeMutationContext === "accept" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto block shrink-0" />
                ) : (
                  <span>Authorize Package Execution Affirmation</span>
                )}
              </Button>

              <details className="text-xs block w-full select-none pt-1">
                <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground/40 hover:text-destructive outline-none transition-colors">
                  Decline Package Options
                </summary>
                <div className="mt-3.5 space-y-2.5 block w-full leading-none animate-in fade-in duration-150">
                  <Textarea
                    disabled={activeMutationContext !== null}
                    value={textDeclineNoteInput}
                    onChange={(e) => setTextDeclineNoteInput(e.target.value)}
                    placeholder="Provide explicit separation justification mapping vectors (Optional)..."
                    rows={2}
                    className="bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none text-xs sm:text-sm font-sans leading-relaxed resize-none p-2.5"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-2xs transform-gpu active:scale-[0.985] block text-center"
                    onClick={handleDeclineOfferSequence}
                    disabled={activeMutationContext !== null}
                  >
                    {activeMutationContext === "decline" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto block shrink-0" />
                    ) : (
                      <span>Decline Emolument Allocation Bundle</span>
                    )}
                  </Button>
                </div>
              </details>
            </div>
          )}

          {/* HUD LEVEL 6: COMMITTED STATE TRACK ARCHIVE SIGNALS */}
          {offerRecordState.status === "accepted" && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.01] p-3 font-semibold text-xs sm:text-sm text-foreground flex items-start gap-2 select-text leading-tight block w-full">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5] shrink-0 mt-0.5 select-none pointer-events-none" />
              <div className="flex-1 min-w-0 block">
                <span>Dossier successfully signed via credential authorization string: </span>
                <strong className="text-primary uppercase tracking-wide block sm:inline-block sm:pl-0.5">
                  {offerRecordState.signed_name}
                </strong>{" "}
                {offerRecordState.signed_at && (
                  <span className="font-mono text-[10px] text-muted-foreground/50 block sm:inline-block sm:pl-1 select-none pointer-events-none tabular-nums">
                    [STAMP: {format(new Date(offerRecordState.signed_at), "PPp").toUpperCase()}]
                  </span>
                )}
              </div>
            </div>
          )}

          {offerRecordState.status === "declined" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/[0.01] p-3 font-mono text-[10px] font-black uppercase tracking-wide text-destructive flex items-center gap-2 select-none pointer-events-none leading-none block w-full animate-pulse">
              <Ban className="h-4 w-4 stroke-[2.2] shrink-0" />
              <span>Emoluments Allocation Package Declined and Released Back to Source Pools</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
