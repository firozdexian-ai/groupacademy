import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createStudentProfile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Zap, ShieldCheck, MessageSquare } from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Enrollment Gateway
 * CTO Reference: Authoritative node for validating alphanumeric curriculum keys.
 * Note: Uses 'as any' on RPC calls to bypass stale local type definitions.
 */

interface AccessCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
  onSuccess: () => void;
}

export const AccessCodeDialog = ({ open, onOpenChange, contentId, contentTitle, onSuccess }: AccessCodeDialogProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const executeEnrollmentHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsValidating(true);
    try {
      // PHASE 1: Code Registry Validation
      const { data: accessCode, error: codeError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("access_codes")
            .select("*")
            .eq("code", code.trim().toUpperCase())
            .eq("content_id", contentId)
            .eq("is_active", true)
            .maybeSingle(),
        ),
        TIMEOUTS.DEFAULT,
        "CODE_SYNC_TIMEOUT",
      );

      if (codeError) throw codeError;
      if (!accessCode) {
        toast.error("INVALID_ACCESS_KEY: Verify code and try again.");
        return;
      }

      // PHASE 2: Temporal & Volume Audits
      if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
        toast.error("KEY_EXPIRED: Temporal validity window closed.");
        return;
      }
      if (accessCode.current_uses >= accessCode.max_uses) {
        toast.error("QUOTA_EXCEEDED: Key use limit reached.");
        return;
      }

      // PHASE 3: Identity Artifact Sync
      const {
        data: { user },
      } = await withTimeout(Promise.resolve(supabase.auth.getUser()), TIMEOUTS.AUTH, "IDENTITY_CHECK_TIMEOUT");
      if (!user) {
        toast.error("AUTH_REQUIRED: Initialize login session.");
        return;
      }

      let student;
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingStudent) {
        student = existingStudent;
      } else {
        const profileCreated = await createStudentProfile(
          user.id,
          user.email?.split("@")[0] || "Talent_Node",
          user.email || "",
          "",
          "free_learner",
        );

        if (!profileCreated) {
          toast.error("IDENTITY_FAULT: Failed to initialize student profile.");
          return;
        }

        const { data: newStudent } = await supabase.from("students").select("id").eq("user_id", user.id).single();

        student = newStudent;
      }

      // PHASE 4: Transactional Enrollment commit
      const { error: enrollError } = await supabase.from("enrollments").insert({
        student_id: student.id,
        content_id: contentId,
        status: "active",
        payment_amount: 0,
      });

      if (enrollError) {
        if (enrollError.code === "23505") {
          toast.error("ALREADY_SYNCED: Enrollment already active.");
        } else {
          throw enrollError;
        }
        return;
      }

      // PHASE 5: Counter Incrementation
      // CTO Audit: 'as any' used to bypass stale local database types
      await supabase.rpc("increment_access_code_use" as any, { row_id: accessCode.id });
      await supabase.rpc("increment_content_enrollment" as any, { row_id: contentId });

      toast.success("CURRICULUM_SYNC_COMPLETE");
      onSuccess();
      onOpenChange(false);
      setCode("");
    } catch (err: any) {
      console.error("GATEWAY_FAULT:", err);
      toast.error("ACCESS_SYNC_FAULT: Please retry or contact Faculty.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-2 border-border/40 bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden p-0 max-w-md">
        {/* HUD: HEADER_INGRESS */}
        <div className="p-8 border-b-2 border-border/10 bg-primary/5">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Key_Ingress</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  Initialize_Curriculum_Handshake
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-muted/10 p-5 rounded-2xl border-2 border-border/10 space-y-2">
            <p className="text-[11px] font-black uppercase italic text-foreground/80 leading-none">Target_Node</p>
            <p className="text-sm font-medium text-muted-foreground truncate">{contentTitle}</p>
          </div>

          <form onSubmit={executeEnrollmentHandshake} className="space-y-6 text-left">
            <div className="space-y-3">
              <Label
                htmlFor="code"
                className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground ml-1"
              >
                Registry_Access_Key
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={12}
                disabled={isValidating}
                className="h-14 rounded-2xl border-2 bg-muted/20 text-center font-mono text-xl font-black tracking-[0.3em] focus-visible:ring-primary/20 transition-all uppercase"
                autoFocus
              />
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-muted-foreground italic leading-relaxed">
                  Contact administrative faculty via encrypted WhatsApp channel to receive your unique artifact key
                  after payment verification.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                size="xl"
                disabled={isValidating || !code.trim()}
                className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95 gap-3"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> VALIDATING...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" /> VALIDATE_&_SYNC
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-14 px-6 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest"
              >
                ABORT
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
