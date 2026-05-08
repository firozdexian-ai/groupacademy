/**
 * ChatOps Top-Up — manual bKash → Telegram review flow.
 * Inserts a `manual_payment_requests` row scoped to the active company.
 * Admins are notified via the existing Telegram pipeline.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CREDIT_TO_BDT = 2; // 1 credit = 2 BDT (per platform memory)
const BKASH_NUMBER = "01889825025";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string | null;
  defaultCredits?: number;
}

export function TelegramTopUpModal({ open, onOpenChange, companyId, defaultCredits = 100 }: Props) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(defaultCredits);
  const [trxId, setTrxId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bdt = Math.max(0, Math.round(credits * CREDIT_TO_BDT));

  const submit = async () => {
    if (!companyId) return toast.error("No active company");
    if (!user?.id) return toast.error("Please sign in");
    if (!trxId.trim()) return toast.error("Enter the bKash transaction ID");
    if (credits < 10) return toast.error("Minimum 10 credits");

    setSubmitting(true);
    try {
      const { error } = await supabase.from("manual_payment_requests").insert({
        company_id: companyId,
        requester_user_id: user.id,
        amount_bdt: bdt,
        requested_credits: credits,
        trx_id: trxId.trim(),
        notes: notes.trim() || null,
      } as any);
      if (error) throw error;
      toast.success("Top-up request submitted — admin will confirm shortly.");
      setTrxId("");
      setNotes("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Top up company wallet</DialogTitle>
          <DialogDescription>
            Send bKash to <span className="font-semibold">{BKASH_NUMBER}</span>, then paste the transaction ID. An admin reviews and credits your shared balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Credits to add</Label>
            <Input
              type="number"
              min={10}
              step={10}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value) || 0)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              You will pay <span className="font-semibold text-foreground">{bdt} BDT</span> via bKash to {BKASH_NUMBER}.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 2000].map((c) => (
              <Button
                key={c}
                variant={credits === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCredits(c)}
              >
                {c}
              </Button>
            ))}
          </div>

          <div>
            <Label className="text-xs">bKash transaction ID</Label>
            <Input
              placeholder="e.g. 9F4G2H1XYZ"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              placeholder="Anything we should know?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
