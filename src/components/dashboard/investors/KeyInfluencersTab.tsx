import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star, ShieldCheck, Loader2, Users, Mail, Briefcase, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const sb = supabase as any;
    let q = sb.from("ir_influencers").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("tier", filter);

    try {
      const { data, error } = await q;
      if (error) throw error;
      setRows((data as Influencer[]) || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to sync registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const add = async () => {
    if (!form.name.trim()) {
      toast.error("Logic Fault: Influencer name required.");
      return;
    }
    setBusy(true);
    try {
      const sb = supabase as any;
      const { error } = await sb.from("ir_influencers").insert(form);
      if (error) throw error;

      toast.success("Entity Authenticated: Influencer added.");
      setForm({ name: "", role: "", organization: "", email: "", tier: "standard" });
      load();
    } catch (error: any) {
      toast.error(error.message || "Failed to inject entity.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Star className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Key Influencers</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Advisors · Press · Ecosystem Leaders
          </p>
        </div>
      </header>

      {/* Entity Injection Node */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
            <ShieldCheck className="h-4 w-4 text-amber-500" /> Entity Injection Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
              <Input
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-12 rounded-xl border-2 font-bold text-sm bg-background/50"
              />
              <Input
                placeholder="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="h-12 rounded-xl border-2 text-sm bg-background/50"
              />
              <Input
                placeholder="Organization"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="h-12 rounded-xl border-2 text-sm bg-background/50"
              />
              <Input
                placeholder="Email Endpoint"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 rounded-xl border-2 text-sm bg-background/50"
              />
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="vip" className="font-bold text-[10px] uppercase tracking-widest">
                    VIP Node
                  </SelectItem>
                  <SelectItem value="strategic" className="font-bold text-[10px] uppercase tracking-widest">
                    Strategic
                  </SelectItem>
                  <SelectItem value="standard" className="font-bold text-[10px] uppercase tracking-widest">
                    Standard
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={add}
              disabled={busy || !form.name.trim()}
              className="h-12 px-8 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Authorize
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registry Filters */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-muted/20 border-2 border-border/40 w-fit">
        {["all", "vip", "strategic", "standard"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-5 py-2 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest",
              filter === t
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Influencer Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <Activity className="h-12 w-12 text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest italic text-muted-foreground/60">
                Registry Empty
              </p>
              <p className="text-xs font-medium text-muted-foreground">No influencer entities matched this query.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((r) => (
            <Card
              key={r.id}
              className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm hover:border-primary/30 hover:shadow-md transition-all group overflow-hidden flex flex-col"
            >
              <div
                className={cn(
                  "h-1.5 w-full bg-gradient-to-r",
                  r.tier === "vip"
                    ? "from-amber-400 to-orange-500"
                    : r.tier === "strategic"
                      ? "from-purple-400 to-indigo-500"
                      : "from-blue-400 to-cyan-500",
                )}
              />
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="font-black text-lg uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors truncate">
                      {r.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {r.role || "NO_ROLE"} {r.organization ? `· ${r.organization}` : ""}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-none",
                      r.tier === "vip"
                        ? "bg-amber-500/10 text-amber-600"
                        : r.tier === "strategic"
                          ? "bg-purple-500/10 text-purple-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {r.tier}
                  </Badge>
                </div>

                {r.email && (
                  <div className="flex items-center gap-2 text-xs font-mono font-medium text-foreground/70 bg-background/50 p-2 rounded-xl border border-border/40">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="truncate">{r.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
