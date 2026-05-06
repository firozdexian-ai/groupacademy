import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  gigId: string;
  submissionId?: string;
  verificationId?: string;
  role: "poster" | "talent";
  trigger?: React.ReactNode;
}

const REASONS = [
  { v: "unfair_rejection", label: "Unfair rejection" },
  { v: "scope_mismatch", label: "Scope mismatch" },
  { v: "quality_dispute", label: "Quality dispute" },
  { v: "non_payment", label: "Non-payment" },
  { v: "other", label: "Other" },
];

export function OpenDisputeButton({ gigId, submissionId, verificationId, role, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("unfair_rejection");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (text.trim().length < 20) { toast.error("Please describe the issue (≥20 chars)"); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("open_gig_dispute", {
      _gig_id: gigId,
      _submission_id: submissionId ?? null,
      _verification_id: verificationId ?? null,
      _opened_by_role: role,
      _reason_code: reason,
      _narrative: text,
      _evidence: [],
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dispute opened. A reviewer panel will adjudicate.");
    setOpen(false); setText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Open dispute</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Open dispute</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REASONS.map(r => <SelectItem key={r.v} value={r.v}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="Explain what happened, with specifics." value={text} onChange={e => setText(e.target.value)} rows={5} />
          <Button disabled={submitting} onClick={submit} className="w-full">Submit dispute</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
