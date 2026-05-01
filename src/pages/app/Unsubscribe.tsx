import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX, ShieldCheck, ArrowLeft, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Preference Setup Node
 * High-fidelity orchestrator for secure email unsubscription protocols.
 * 2026 Standard: Executive Logic geometry with reinforced token telemetry.
 */

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validateProtocol = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        // Edge Function Connection
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } },
        );
        const data = await res.json();

        if (res.ok && data.valid === true) {
          setStatus("valid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else {
          setStatus("invalid");
        }
      } catch (err) {
        console.error("Validation error:", err);
        setStatus("error");
      }
    };

    validateProtocol();
  }, [token]);

  const handleConfirmSync = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });

      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 animate-in fade-in duration-700">
      <Card className="w-full max-w-md rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">List Update</CardTitle>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
            Communication Preference Node
          </p>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-8 text-center p-8 pt-0">
          {status === "loading" && (
            <div className="space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto stroke-[1.5px]" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                Validating Token Payload...
              </p>
            </div>
          )}

          {status === "valid" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className="p-6 rounded-[24px] bg-primary/5 border-2 border-dashed border-primary/20">
                <MailX className="h-10 w-10 text-primary mx-auto mb-4" />
                <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
                  Confirm de-synchronization from GroUp Academy automated logic sequences?
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleConfirmSync}
                  disabled={processing}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 mr-3" />
                  )}
                  Authorize Unsubscribe
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="w-full font-black uppercase text-[9px] tracking-widest opacity-60 hover:opacity-100"
                >
                  Cancel Protocol
                </Button>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border-2 border-emerald-500/20 rotate-3">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black uppercase tracking-tight italic">Node De-Synchronized</p>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                  Upload terminated. It may take several logic cycles for global registry propagation.
                </p>
              </div>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="rounded-xl border-2 font-black uppercase text-[10px] tracking-widest px-8"
              >
                Return to Hub
              </Button>
            </div>
          )}

          {status === "already_unsubscribed" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <CheckCircle className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-black uppercase tracking-tight opacity-60">Connection Redundant</p>
                <p className="text-[11px] font-medium text-muted-foreground italic">
                  This identifier has already been purged from the active mailing registry.
                </p>
              </div>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="font-black uppercase text-[10px] tracking-widest"
              >
                Return Home
              </Button>
            </div>
          )}

          {(status === "invalid" || status === "error") && (
            <div className="space-y-6 animate-in shake duration-500">
              <XCircle className="h-12 w-12 text-destructive/40 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-black uppercase tracking-tight text-destructive">Protocol Fault</p>
                <p className="text-[11px] font-medium text-muted-foreground italic">
                  The provided token payload is invalid, expired, or corrupted.
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="rounded-xl border-2 font-black uppercase text-[10px] tracking-widest px-8"
              >
                Retry Connection
              </Button>
            </div>
          )}
        </CardContent>

        <div className="p-4 bg-muted/20 border-t border-border/10 flex justify-center opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] italic">Privacy Ledger v2.6 Synchronized</p>
        </div>
      </Card>
    </div>
  );
};

export default Unsubscribe;
