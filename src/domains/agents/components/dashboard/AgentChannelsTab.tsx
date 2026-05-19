import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Network, Activity, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AgentChannelsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agent_channels")
      .select("*")
      .order("channel_key")
      .then(({ data }) => {
        setRows(data ?? []);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Channels & Triggers</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Where agents fire · Chat surfaces · Webhooks · Cron jobs
          </p>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
            <Network className="h-4 w-4 text-amber-500" /> Authorized Execution Nodes
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex-1 bg-background/30">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[24px] border-2 border-border/20 bg-muted/20" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px]">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                No active channels detected.
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] border-2 border-border/20 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all group"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none truncate">
                        {r.label}
                      </h3>
                      <span className="font-mono text-[9px] font-bold bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground shrink-0">
                        {r.channel_key}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground italic truncate">{r.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {r.direction && (
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
                      >
                        {r.direction}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "rounded-lg font-black text-[8px] uppercase tracking-widest px-3 py-1 border-none",
                        r.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      {r.is_active ? "ACTIVE_NODE" : "OFFLINE"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Trace Footer */}
      <footer className="mt-12 pt-8 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Agent OS: Channel Routing</p>
        </div>
        <div className="flex gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
