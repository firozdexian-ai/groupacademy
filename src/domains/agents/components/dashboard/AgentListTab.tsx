import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listAiAgentsForListTab } from "@/domains/agents/repo/agentsRepo";
import { Search, Activity, Cpu, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  agentTypeFilter?: string | string[];
  audienceFilter?: string;
  emptyHint?: string;
}

export function AgentListTab({ title, description, icon: Icon, agentTypeFilter, audienceFilter, emptyHint }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listAiAgentsForListTab({ agentTypeFilter, audienceFilter })
      .then((data) => {
        setRows(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [agentTypeFilter, audienceFilter]);

  const filtered = rows.filter(
    (r) => !search || (r.name + " " + r.agent_key).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {description}
          </p>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <CardHeader className="p-6 border-b border-border/10 bg-muted/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70 shrink-0">
            <Cpu className="h-4 w-4 text-primary" /> Agent Matrix
          </CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Query agents by identity or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-xl border-2 bg-background/50 font-medium text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 bg-background/30">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-[24px] border-2 border-border/20 bg-muted/20" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px]">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                {emptyHint ?? "No active agents match this filter."}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-[24px] border-2 border-border/20 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all group"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-black uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none truncate">
                        {a.name}
                      </h3>
                      <span className="font-mono text-[9px] font-bold bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground shrink-0">
                        {a.agent_key}
                      </span>
                      {a.model && (
                        <Badge
                          variant="outline"
                          className="text-[8px] font-mono border-blue-500/30 text-blue-500 bg-blue-500/5"
                        >
                          {a.model}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground italic line-clamp-2">{a.description}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0 xl:justify-end">
                    {a.audience && (
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
                      >
                        {a.audience}
                      </Badge>
                    )}
                    {a.visibility && (
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
                      >
                        {a.visibility}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="rounded-lg font-black text-[8px] uppercase tracking-widest px-3 py-1 border-2 border-amber-500/20 text-amber-500 bg-amber-500/5"
                    >
                      {(a.total_conversations ?? 0).toLocaleString()} RUNS
                    </Badge>
                    <Badge
                      className={cn(
                        "rounded-lg font-black text-[8px] uppercase tracking-widest px-3 py-1 border-none",
                        a.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      {a.is_active ? "ACTIVE_NODE" : "OFFLINE"}
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
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Agent OS: Registry Filters</p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
