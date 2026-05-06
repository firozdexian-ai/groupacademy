import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { acceptOffer, declineOffer } from "@/hooks/useOffers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AppOfferDecision() {
  const { id: applicationId, offerId } = useParams<{ id: string; offerId: string }>();
  const nav = useNavigate();
  const [offer, setOffer] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signedName, setSignedName] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: o } = await supabase.from("offers").select("*").eq("id", offerId!).maybeSingle();
    setOffer(o);
    if (o) {
      const { data: app } = await supabase.from("job_applications").select("job_id").eq("id", o.application_id).maybeSingle();
      if (app?.job_id) {
        const { data: j } = await supabase.from("jobs").select("title, company_name, company_logo_url").eq("id", app.job_id).maybeSingle();
        setJob(j);
      }
    }
    setLoading(false);
  };

  useEffect(() => { if (offerId) void load(); }, [offerId]);

  const onAccept = async () => {
    if (signedName.trim().length < 2) { toast.error("Please type your full name to sign"); return; }
    setBusy("accept");
    const ok = await acceptOffer(offerId!, signedName.trim());
    setBusy(null);
    if (ok) { toast.success("Offer accepted! Welcome aboard."); void load(); }
    else toast.error("Could not accept");
  };

  const onDecline = async () => {
    setBusy("decline");
    const ok = await declineOffer(offerId!, declineNote);
    setBusy(null);
    if (ok) { toast.success("Offer declined"); void load(); }
    else toast.error("Could not decline");
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!offer) return <div className="p-8 text-center text-muted-foreground">Offer not found.</div>;

  const decided = offer.status === "accepted" || offer.status === "declined";

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => nav(`/app/applications/${applicationId}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            {job?.company_logo_url && <img src={job.company_logo_url} className="h-10 w-10 rounded-md" alt="" />}
            <div>
              <p className="text-xs text-muted-foreground">{job?.company_name}</p>
              <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Offer for {offer.title}</h2>
            </div>
          </div>
          <Badge variant={decided ? "default" : "secondary"}>{offer.status}</Badge>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground text-xs">Base compensation</dt><dd className="font-semibold">{offer.currency} {Number(offer.base_amount).toLocaleString()}</dd></div>
            {offer.variable_amount != null && <div><dt className="text-muted-foreground text-xs">Variable</dt><dd>{offer.currency} {Number(offer.variable_amount).toLocaleString()}</dd></div>}
            {offer.start_date && <div><dt className="text-muted-foreground text-xs">Start date</dt><dd>{format(new Date(offer.start_date), "PP")}</dd></div>}
            {offer.expires_at && <div><dt className="text-muted-foreground text-xs">Expires</dt><dd>{format(new Date(offer.expires_at), "PPp")}</dd></div>}
          </dl>

          {offer.benefits && <div><p className="text-xs text-muted-foreground">Benefits</p><p className="text-sm whitespace-pre-wrap">{offer.benefits}</p></div>}
          {offer.equity_note && <div><p className="text-xs text-muted-foreground">Equity</p><p className="text-sm whitespace-pre-wrap">{offer.equity_note}</p></div>}
          {offer.custom_note && <div><p className="text-xs text-muted-foreground">Note</p><p className="text-sm whitespace-pre-wrap">{offer.custom_note}</p></div>}

          {!decided && offer.status === "sent" && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label>Type your full legal name to accept</Label>
                <Input value={signedName} onChange={(e) => setSignedName(e.target.value)} placeholder="Full name" />
              </div>
              <Button className="w-full" onClick={onAccept} disabled={busy !== null}>
                {busy === "accept" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Accept Offer
              </Button>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">Decline this offer</summary>
                <div className="mt-2 space-y-2">
                  <Textarea value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Optional reason..." rows={2} />
                  <Button variant="destructive" className="w-full" onClick={onDecline} disabled={busy !== null}>
                    {busy === "decline" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Decline
                  </Button>
                </div>
              </details>
            </div>
          )}

          {offer.status === "accepted" && (
            <div className="rounded-md bg-success/10 p-3 text-sm">
              ✓ Accepted by <strong>{offer.signed_name}</strong>{" "}
              {offer.signed_at && <>on {format(new Date(offer.signed_at), "PPp")}</>}
            </div>
          )}
          {offer.status === "declined" && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm">Declined.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
