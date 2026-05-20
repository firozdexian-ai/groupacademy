import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, ShieldCheck, Settings2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

// Production Data Contracts[cite: 8]
type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  // Digital Workforce Anomaly Protocol[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await adminSupportAssistant({ type: "unsubscribe_error", event, context });
  };

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validateProtocol = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
          body: { token, action: "validate" },
        });

        if (error) throw error;
        if (data?.valid) setStatus("valid");
        else if (data?.reason === "already_unsubscribed") setStatus("already_unsubscribed");
        else setStatus("invalid");
      } catch (e) {
        await reportAnomaly("UnsubscribeValidationFailure", { token, error: e });
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
        body: { token, action: "confirm" },
      });

      if (error) throw error;
      if (data?.success) setStatus("success");
      else throw new Error("Sync failure");
    } catch (e) {
      await reportAnomaly("UnsubscribeSyncFailure", { token, error: e });
      toast.error("Protocol error. Workforce notified.");
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Card className={cn(CARD, "max-w-md mx-auto rounded-[32px] border-2 mt-20")}>
        <div className="h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className={PAGE_TITLE}>List Update</CardTitle>
          <p className={PAGE_SUBTITLE}>Communication Preference Node</p>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-8 text-center p-8 pt-0">
          {status === "loading" && (
            <div className="space-y-4 py-8 animate-pulse">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Validating Payload...</p>
            </div>
          )}

          {status === "valid" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className="p-6 rounded-[24px] bg-primary/5 border-2 border-dashed border-primary/20">
                <MailX className="h-10 w-10 text-primary mx-auto mb-4" />
                <p className="text-sm font-medium italic">
                  Confirm de-synchronization from GroUp Academy logic sequences?
                </p>
              </div>
              <Button
                onClick={handleConfirmSync}
                disabled={processing}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Authorize Unsubscribe
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-black uppercase italic">Node De-Synchronized</h3>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Hub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
