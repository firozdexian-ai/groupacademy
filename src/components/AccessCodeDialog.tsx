import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { incrementAccessCodeUse, incrementContentEnrollment } from "@/domains/learning/repo/learningRepo";
import {
  getActiveAccessCode,
  findStudentIdByUserId,
  requireStudentIdByUserId,
  insertEnrollmentRow,
} from "@/domains/learning/repo/learningRepo";
import { createStudentProfile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { Loader2, Zap, ShieldCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessCodeDialogProps {
  open: boolean;
  onOpenChange: (openStateBool: boolean) => void;
  contentId: string;
  contentTitle: string;
  onSuccess: () => void;
}

/**
 * GroUp Academy: Authoritative Curriculum Ingress Enrollment Gateway (AccessCodeDialog)
 * An operational sandbox orchestrating multi-phase code token registry checks, temporal volume audits, and profile verification tasks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export const AccessCodeDialog = ({ open, onOpenChange, contentId, contentTitle, onSuccess }: AccessCodeDialogProps) => {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    if (open) {
      trackEvent("access_code_gateway_opened", { contentId });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [open, contentId]);

  const sanitizedCodeTokenStr = useMemo(() => {
    return code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "");
  }, [code]);

  const executeEnrollmentHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizedCodeTokenStr || isValidating) return;

    setIsValidating(true);
    trackEvent("access_code_validation_handshake_initiated", { contentId });
    const dynamicToastTrackerId = toast.loading(
      "Verifying network credentials parameter records with global index ledgers…",
    );

    try {
      // PHASE 1: Code Registry Validation Pass
      const accessCodePayloadData = (await withTimeout(
        getActiveAccessCode(sanitizedCodeTokenStr, contentId),
        TIMEOUTS.DEFAULT,
        "CODE_SYNC_TIMEOUT",
      )) as any;

      if (!accessCodePayloadData) {
        toast.error("This access code isn't valid or hasn't been assigned.", {
          id: dynamicToastTrackerId,
        });
        if (isMountedRef.current) setIsValidating(false);
        return;
      }

      // PHASE 2: Temporal & Volume Audits Checks
      if (accessCodePayloadData.expires_at && new Date(accessCodePayloadData.expires_at) < new Date()) {
        toast.error("This access code has expired.", {
          id: dynamicToastTrackerId,
        });
        if (isMountedRef.current) setIsValidating(false);
        return;
      }

      if (Number(accessCodePayloadData.current_uses) >= Number(accessCodePayloadData.max_uses)) {
        toast.error("This access code has reached its usage limit.", {
          id: dynamicToastTrackerId,
        });
        if (isMountedRef.current) setIsValidating(false);
        return;
      }

      // PHASE 3: Identity Artifact Verification & Sync
      const user = await withTimeout(getCurrentUser(), TIMEOUTS.AUTH, "IDENTITY_CHECK_TIMEOUT");

      if (!user) {
        toast.error("Please sign in to continue.", {
          id: dynamicToastTrackerId,
        });
        if (isMountedRef.current) setIsValidating(false);
        return;
      }

      let targetStudentContextNode: { id: string };
      const existingStudentId = await findStudentIdByUserId(user.id);

      if (existingStudentId) {
        targetStudentContextNode = { id: existingStudentId };
      } else {
        // Fallback profile creation pass if relational records live disconnected down database tables
        const profileInitializationCreatedBool = await createStudentProfile(
          user.id,
          user.email?.split("@")[0] || "Learner_Node",
          user.email || "",
          "",
          "free_learner",
        );

        if (!profileInitializationCreatedBool) {
          throw new Error("We couldn't set up your learner profile. Please try again.");
        }

        targetStudentContextNode = { id: await requireStudentIdByUserId(user.id) };
      }

      // PHASE 4: Transactional Enrollment Ingest Commit
      const { error: insertEnrollmentRegistryError } = await insertEnrollmentRow({
        student_id: targetStudentContextNode.id,
        content_id: contentId,
        status: "active",
        payment_amount: 0,
      });

      if (insertEnrollmentRegistryError) {
        if (insertEnrollmentRegistryError.code === "23505") {
          toast.error("Ecosystem Bypass: Relational indices mirror this enrollment track as already active.", {
            id: dynamicToastTrackerId,
          });
          if (isMountedRef.current) {
            setIsValidating(false);
            onOpenChange(false);
          }
          return;
        }
        throw insertEnrollmentRegistryError;
      }

      // PHASE 5: Concurrent Counter Incrementation RPC Passes
      await Promise.allSettled([
        incrementAccessCodeUse(accessCodePayloadData.id),
        incrementContentEnrollment(contentId),
      ]);

      // Automated Efficiency: Synchronize cache tracking layers to avoid state drift split viewports
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["student-courses"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        toast.success("Curriculum verification sync complete. Classroom trajectory authorized.", {
          id: dynamicToastTrackerId,
        });
        trackEvent("access_code_validation_handshake_success", { contentId });
        onSuccess();
        setCode("");
        onOpenChange(false);
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "AccessCodeDialog",
        action: "execute_enrollment_handshake",
        contentId,
      });
      toast.error(`Ingress gateway setup sync fault: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setIsValidating(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(vOpenState) => {
        if (!isValidating) {
          onOpenChange(vOpenState);
          if (!vOpenState) trackEvent("access_code_dialog_closed");
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-0 text-left antialiased overflow-hidden transform-gpu select-none sm:select-text flex flex-col justify-center">
        {/* HUD LEVEL 1: GATEWAY DIALOG HEADER SECTION CONTAINER */}
        <div className="p-5 sm:p-6 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
          <DialogHeader className="text-left leading-none">
            <div className="flex items-center gap-3 leading-none w-full">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="h-4 w-4 text-primary fill-primary/10 stroke-[2.2] animate-pulse" />
              </div>
              <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                  Syllabus Key Code Ingress Terminal
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                  Authorize structural user workspace synchronization handshake sequence
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* HUD LEVEL 2: COMPOSITE SECTOR TRACK TARGET CONTAINER BLOCK */}
        <div className="p-5 sm:p-6 space-y-4 w-full min-w-0 flex flex-col justify-center font-bold text-xs text-foreground/90">
          <div className="p-3.5 border border-border/40 bg-background/50 rounded-xl space-y-1 w-full min-w-0 flex flex-col justify-center leading-none text-left select-none">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/50 block leading-none">
              Target Classroom Node
            </span>
            <p className="text-xs sm:text-sm font-bold text-foreground/90 truncate text-ellipsis block pr-1 leading-none select-text pt-0.5">
              {contentTitle || "Unspecified Curriculum Track Address"}
            </p>
          </div>

          {/* HUD LEVEL 3: INPUT KEY SUBMISSION STRUCTURAL FORM PANEL */}
          <form
            onSubmit={executeEnrollmentHandshake}
            className="space-y-4 w-full text-left font-bold text-xs flex flex-col justify-center"
          >
            <div className="space-y-1.5 text-left w-full min-w-0">
              <Label
                htmlFor="code"
                className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
              >
                Registry Access Code Parameter Key
              </Label>
              <Input
                id="code"
                value={code}
                maxLength={14}
                disabled={isValidating}
                autoComplete="off"
                placeholder="XXXX-XXXX-XXXX"
                onChange={(e) => setCode(e.target.value)}
                className="h-12 rounded-xl border border-border/40 bg-background/50 text-center font-mono text-lg sm:text-xl font-black tracking-[0.25em] text-foreground p-3 shadow-inner w-full block uppercase focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />

              {/* HELP NOTICE RIBBON SLAT */}
              <div className="flex gap-2.5 items-start p-3 bg-primary/[0.01] border border-primary/10 rounded-xl select-none leading-none shadow-sm w-full shrink-0">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 stroke-[2.2]" />
                <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-relaxed tracking-wide pt-0.5">
                  Guidance: Connect with administrative faculty channels to request your non-colliding artifact key
                  variables on payment completion verification events.
                </p>
              </div>
            </div>

            {/* HUD LEVEL 4: INTERFACE ACTION DECISION COMMAND BUTTON SLOTS FOOTER */}
            <DialogFooter className="pt-3 gap-2.5 sm:gap-0 select-none border-t border-border/10 w-full shrink-0 flex items-center justify-end">
              <Button
                variant="ghost"
                type="button"
                disabled={isValidating}
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
              >
                Abort Handshake
              </Button>

              <Button
                type="submit"
                disabled={isValidating || !sanitizedCodeTokenStr}
                className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 min-w-[155px]"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                    <span>Syncing Key…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                    <span>Validate & Ingress</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
