import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Influencer {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  country?: string;
  tier?: string;
  email?: string;
  tags?: string[];
}

export default function KeyInfluencersTab() {
  const [rows, setRows] = useState<Influencer[]>([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name: "", role: "", organization: "", email: "", tier: "standard" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const sb = supabase as any;
    let q = sb.from("ir_influencers").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("tier", filter);
    const { data } = await q;
    setRows((data as Influencer[]) || []);
  };

  useEffect(() => { load(); }, [filter]);

  const add = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    const sb = supabase as any;
    const { error } = await sb.from("ir_influencers").insert(form);
    setBusy(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Influencer added" });
    setForm({ name: "", role: "", organization: "", email: "", tier: "standard" });
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Star className="h-8 w-8 text-primary" />
          Key Influencers
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
          Advisors • Press • Ecosystem Leaders
        </p>
      </header>

      <Card className="p-5 rounded-3xl border-2 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="border rounded-md px-3 bg-background" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
            <option value="vip">VIP</option>
            <option value="strategic">Strategic</option>
            <option value="standard">Standard</option>
          </select>
        </div>
        <Button onClick={add} disabled={busy}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </Card>

      <div className="flex gap-2">
        {["all", "vip", "strategic", "standard"].map((t) => (
          <Button key={t} size="sm" variant={filter === t ? "default" : "outline"} onClick={() => setFilter(t)}>
            {t.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-4 rounded-2xl border-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.role}{r.organization ? ` • ${r.organization}` : ""}</div>
              </div>
              <Badge variant={r.tier === "vip" ? "default" : "outline"}>{r.tier}</Badge>
            </div>
            {r.email && <div className="text-xs mt-2 text-muted-foreground">{r.email}</div>}
          </Card>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted-foreground col-span-full">No influencers yet.</div>}
      </div>
    </div>
  );
}
