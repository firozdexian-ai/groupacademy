import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dataroom-track`;

interface ResolveResponse {
  document: { id: string; title: string; total_slides: number | null; doc_type: string };
  signedUrl: string | null;
  requireEmail: boolean;
  shareLinkId: string;
  error?: string;
}

export default function IRDocumentViewer() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const dwellRef = useRef<{ start: number; slide: number }>({ start: Date.now(), slide: 1 });

  useEffect(() => {
    if (!token) return;
    fetch(`${FN_URL}?action=resolve&token=${token}`)
      .then((r) => r.json())
      .then((d: ResolveResponse) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  const startView = async (viewerEmail?: string) => {
    const res = await fetch(`${FN_URL}?action=view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, viewerEmail }),
    });
    const json = await res.json();
    if (json.viewId) {
      setViewId(json.viewId);
      setEmailSubmitted(true);
      dwellRef.current = { start: Date.now(), slide: 1 };
    }
  };

  // flush slide dwell every 15s
  useEffect(() => {
    if (!viewId) return;
    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - dwellRef.current.start) / 1000);
      if (elapsed > 0) {
        fetch(`${FN_URL}?action=slide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewId,
            slideNumber: dwellRef.current.slide,
            dwellSeconds: elapsed,
          }),
        }).catch(() => {});
        dwellRef.current.start = Date.now();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [viewId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Cannot open document</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (data.requireEmail && !emailSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
        <Card className="p-8 max-w-md w-full">
          <FileText className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center mb-1">{data.document.title}</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your email to access this document
          </p>
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3"
          />
          <Button className="w-full" onClick={() => startView(email)} disabled={!email.includes("@")}>
            Open Document
          </Button>
        </Card>
      </div>
    );
  }

  if (!viewId && !data.requireEmail) {
    startView();
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{data.document.title}</span>
        <span className="text-xs text-muted-foreground">Confidential</span>
      </div>
      {data.signedUrl ? (
        <iframe
          src={data.signedUrl}
          title={data.document.title}
          className="w-full"
          style={{ height: "calc(100vh - 41px)" }}
        />
      ) : (
        <div className="p-8 text-center text-white">No file attached</div>
      )}
    </div>
  );
}
