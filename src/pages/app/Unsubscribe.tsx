import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
      } catch {
        setStatus("error");
      }
    };

    validate();
  }, [token]);

  const handleConfirm = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-primary" />
              <p className="text-foreground">
                Are you sure you want to unsubscribe from GroUp Academy emails?
              </p>
              <Button onClick={handleConfirm} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-foreground font-medium">You've been unsubscribed.</p>
              <p className="text-sm text-muted-foreground">
                You will no longer receive emails from GroUp Academy. This may take a few minutes to take effect.
              </p>
            </>
          )}

          {status === "already_unsubscribed" && (
            <>
              <CheckCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-foreground font-medium">Already unsubscribed</p>
              <p className="text-sm text-muted-foreground">
                This email address has already been unsubscribed.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-foreground font-medium">Invalid or expired link</p>
              <p className="text-sm text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-foreground font-medium">Something went wrong</p>
              <p className="text-sm text-muted-foreground">
                Please try again later or contact support.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
