import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUnitEconomics } from "@/hooks/useUnitEconomics";

export function MetricEntrySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
 const { upsertSnapshot } = useUnitEconomics();
 const [form, setForm] = useState<Record<string, string>>({
 snapshot_date: new Date().toISOString().slice(0, 10),
 });

 const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
 const num = (v: string) => (v === "" ? null : Number(v));

 const submit = async () => {
 await upsertSnapshot.mutateAsync({
 snapshot_date: form.snapshot_date,
 mrr_usd: num(form.mrr_usd ?? ""),
 arr_usd: num(form.arr_usd ?? ""),
 paying_users: num(form.paying_users ?? "") as any,
 total_users: num(form.total_users ?? "") as any,
 active_users_dau: num(form.active_users_dau ?? "") as any,
 active_users_wau: num(form.active_users_wau ?? "") as any,
 active_users_mau: num(form.active_users_mau ?? "") as any,
 gross_revenue_retention_pct: num(form.gross_revenue_retention_pct ?? ""),
 net_revenue_retention_pct: num(form.net_revenue_retention_pct ?? ""),
 usage_retention_pct: num(form.usage_retention_pct ?? ""),
 ai_inference_cogs_usd: num(form.ai_inference_cogs_usd ?? ""),
 hitl_labor_cogs_usd: num(form.hitl_labor_cogs_usd ?? ""),
 automated_actions_count: num(form.automated_actions_count ?? "") as any,
 hitl_actions_count: num(form.hitl_actions_count ?? "") as any,
 headcount_fte: num(form.headcount_fte ?? ""),
 contractor_fte: num(form.contractor_fte ?? ""),
 revenue_per_employee_usd: num(form.revenue_per_employee_usd ?? ""),
 });
 onOpenChange(false);
 };

 const F = ({ k, label, type = "number" }: { k: string; label: string; type?: string }) => (
 <div>
 <Label className="text-xs">{label}</Label>
 <Input type={type} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
 </div>
 );

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent className="sm:max-w-xl overflow-y-auto">
 <SheetHeader>
 <SheetTitle>Log Metrics Snapshot</SheetTitle>
 <SheetDescription>One row per snapshot date · upserts existing</SheetDescription>
 </SheetHeader>

 <div className="space-y-4 my-6">
 <F k="snapshot_date" label="Snapshot Date" type="date" />

 <div className="grid grid-cols-2 gap-3">
 <F k="mrr_usd" label="MRR (USD)" />
 <F k="arr_usd" label="ARR (USD)" />
 <F k="paying_users" label="Paying users" />
 <F k="total_users" label="Total users" />
 </div>

 <h4 className="text-xs font-bold uppercase pt-2">Active Usage</h4>
 <div className="grid grid-cols-3 gap-3">
 <F k="active_users_dau" label="DAU" />
 <F k="active_users_wau" label="WAU" />
 <F k="active_users_mau" label="MAU" />
 </div>

 <h4 className="text-xs font-bold uppercase pt-2">Retention</h4>
 <div className="grid grid-cols-3 gap-3">
 <F k="gross_revenue_retention_pct" label="GRR %" />
 <F k="net_revenue_retention_pct" label="NRR %" />
 <F k="usage_retention_pct" label="Usage Ret %" />
 </div>

 <h4 className="text-xs font-bold uppercase pt-2">AI / HitL COGS</h4>
 <div className="grid grid-cols-2 gap-3">
 <F k="ai_inference_cogs_usd" label="AI Inference $" />
 <F k="hitl_labor_cogs_usd" label="HitL Labor $" />
 <F k="automated_actions_count" label="Automated actions" />
 <F k="hitl_actions_count" label="HitL actions" />
 </div>

 <h4 className="text-xs font-bold uppercase pt-2">Capital Efficiency</h4>
 <div className="grid grid-cols-3 gap-3">
 <F k="headcount_fte" label="Headcount FTE" />
 <F k="contractor_fte" label="Contractor FTE" />
 <F k="revenue_per_employee_usd" label="Rev / FTE $" />
 </div>

 <Button className="w-full" onClick={submit} disabled={upsertSnapshot.isPending}>
 {upsertSnapshot.isPending ? "Saving…" : "Save snapshot"}
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 );
}
