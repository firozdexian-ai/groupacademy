import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApplicationOfferContext } from "@/domains/jobs/repo/jobsRepo";
import { useCreateOffer, useSendOffer } from "@/hooks/useOffers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Gro10xOfferComposer() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [talentId, setTalentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    start_date: "",
    currency: "USD",
    base_amount: 0,
    variable_amount: "" as string | number,
    equity_note: "",
    benefits: "",
    custom_note: "",
    expires_at: "",
  });

  useEffect(() => {
    (async () => {
      const { data: app } = await supabase
        .from("job_applications")
        .select("talent_id, jobs!inner(title, company_id)")
        .eq("id", applicationId!)
        .maybeSingle();
      const a: any = app;
      if (a) {
        setCompanyId(a.jobs.company_id);
        setTalentId(a.talent_id);
        setForm((f) => ({ ...f, title: a.jobs.title }));
      }
      setLoading(false);
    })();
  }, [applicationId]);

  const createOfferM = useCreateOffer();
  const sendOfferM = useSendOffer();

  const submit = async (sendNow: boolean) => {
    if (!companyId || !talentId) return;
    setSaving(true);
    try {
      const id = await createOfferM.mutateAsync({
        application_id: applicationId!,
        company_id: companyId,
        talent_id: talentId,
        title: form.title,
        start_date: form.start_date || null,
        currency: form.currency,
        base_amount: Number(form.base_amount) || 0,
        variable_amount: form.variable_amount === "" ? null : Number(form.variable_amount),
        equity_note: form.equity_note || null,
        benefits: form.benefits || null,
        custom_note: form.custom_note || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      } as any);
      if (id && sendNow) await sendOfferM.mutateAsync({ offerId: id, applicationId: applicationId! });
      if (id) nav(`/gro10x/work/applications`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => nav(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-semibold">Compose offer</h2>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD","EUR","GBP","BDT","INR","AED","SGD"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Base amount</Label><Input type="number" value={form.base_amount} onChange={(e) => setForm({ ...form, base_amount: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Variable / bonus</Label><Input type="number" value={form.variable_amount} onChange={(e) => setForm({ ...form, variable_amount: e.target.value })} /></div>
            <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          </div>
          <div><Label>Equity (optional)</Label><Input value={form.equity_note} onChange={(e) => setForm({ ...form, equity_note: e.target.value })} /></div>
          <div><Label>Benefits</Label><Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={3} /></div>
          <div><Label>Custom note</Label><Textarea value={form.custom_note} onChange={(e) => setForm({ ...form, custom_note: e.target.value })} rows={2} /></div>
          <div><Label>Expires at</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => submit(false)} disabled={saving}>Save draft</Button>
            <Button className="flex-1" onClick={() => submit(true)} disabled={saving || !form.title}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send offer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
