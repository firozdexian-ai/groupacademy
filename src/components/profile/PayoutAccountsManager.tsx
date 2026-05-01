import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Star, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PayoutAccount {
  id: string;
  method: "bkash" | "bank" | "paypal" | "wise";
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
}

const METHOD_LABEL = { bkash: "bKash", bank: "Bank transfer", paypal: "PayPal", wise: "Wise" } as const;

export function PayoutAccountsManager() {
  const { talent } = useTalent();
  const [rows, setRows] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayoutAccount["method"]>("bkash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const load = async () => {
    if (!talent?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("talent_payout_accounts" as any)
      .select("*")
      .eq("talent_id", talent.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    setRows(((data as any) || []) as PayoutAccount[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [talent?.id]);

  const add = async () => {
    if (!talent?.id) return;
    if (!accountName.trim() || !accountNumber.trim()) {
      toast.error("Account name and number are required.");
      return;
    }
    setBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { setBusy(false); return; }
    const isFirst = rows.length === 0;
    const { error } = await supabase.from("talent_payout_accounts" as any).insert({
      talent_id: talent.id,
      user_id: uid,
      method,
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      bank_name: method === "bank" ? bankName.trim() || null : null,
      is_primary: isFirst,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account added.");
    setAccountName(""); setAccountNumber(""); setBankName(""); setAdding(false);
    load();
  };

  const setPrimary = async (id: string) => {
    setBusy(true);
    const { error } = await supabase
      .from("talent_payout_accounts" as any)
      .update({ is_primary: true } as any)
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Primary updated.");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this disbursement account?")) return;
    setBusy(true);
    const { error } = await supabase.from("talent_payout_accounts" as any).delete().eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Disbursement accounts</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Set one primary account for fast withdrawals. Add a secondary as backup.
        </p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No accounts yet.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{r.account_name}</p>
                    {r.is_primary && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-none text-[10px]">
                        <Star className="h-3 w-3 mr-1" /> Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {METHOD_LABEL[r.method]}{r.bank_name ? ` · ${r.bank_name}` : ""} · {r.account_number}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!r.is_primary && (
                    <Button size="sm" variant="ghost" onClick={() => setPrimary(r.id)} disabled={busy}>
                      Set primary
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)} disabled={busy}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div className="space-y-3 p-3 border rounded-xl bg-background">
            <div className="grid gap-2">
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="wise">Wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {method === "bank" && (
              <div className="grid gap-2">
                <Label className="text-xs">Bank name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. BRAC Bank" />
              </div>
            )}
            <div className="grid gap-2">
              <Label className="text-xs">Account holder name</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">{method === "paypal" ? "PayPal email" : method === "bkash" ? "bKash number" : "Account / IBAN"}</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={add} disabled={busy} className="flex-1">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save account"}
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)} className="w-full rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Add disbursement account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default PayoutAccountsManager;
