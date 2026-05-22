import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listAllAgentTools } from "@/domains/agents/repo/agentsRepo";
import { Plug, Wrench, Network, Braces, Activity, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tool = {
  id: string;
  tool_key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  handler_kind: string;
  handler_ref?: string | null;
  connector_id?: string | null;
  status?: string | null;
  is_active: boolean;
};

export function AgentToolsTab() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listAllAgentTools()
      .then((data) => {
        setTools(data as Tool[]);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const groups = useMemo(
    () => ({
      internal: tools.filter((t) => ["edge_function", "rpc", "internal"].includes(t.handler_kind)),
      skills: tools.filter((t) => t.handler_kind === "skill"),
      connectors: tools.filter((t) => t.handler_kind === "connector"),
    }),
    [tools],
  );

  const Row = (t: Tool) => (
    <div
      key={t.id}
      className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-[24px] border-2 border-border/20 bg-background/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all group"
    >
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none truncate">
            {t.name}
          </h3>
          <span className="font-mono text-[9px] font-bold bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground shrink-0">
            {t.tool_key}
          </span>
        </div>
        <p className="text-xs font-medium text-muted-foreground italic truncate">
          {t.description || "No logic briefing provided."}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap shrink-0 xl:justify-end">
        {t.category && (
          <Badge
            variant="outline"
            className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
          >
            {t.category}
          </Badge>
        )}
        {t.connector_id && (
          <Badge
            variant="outline"
            className="rounded-lg border-2 font-mono text-[8px] uppercase tracking-widest bg-blue-500/5 text-blue-500 border-blue-500/20"
          >
            {t.connector_id}
          </Badge>
        )}
        <Badge
          className={cn(
            "rounded-lg font-black text-[8px] uppercase tracking-widest px-3 py-1 border-none",
            t.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/60",
          )}
        >
          {t.status?.toUpperCase() || (t.is_active ? "AVAILABLE_NODE" : "OFFLINE")}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Plug className="h-8 w-8 text-emerald-500 fill-emerald-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Logic & Connectors</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Edge functions · Reusable skills · External ecosystem hooks
          </p>
        </div>
      </header>

      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1 mb-8 w-full sm:w-auto flex flex-col sm:flex-row h-auto gap-1">
          <TabsTrigger
            value="internal"
            className="sm:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
          >
            <Braces className="h-4 w-4" /> Internal Logic ({groups.internal.length})
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="sm:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
          >
            <Cpu className="h-4 w-4" /> Agent Skills ({groups.skills.length})
          </TabsTrigger>
          <TabsTrigger
            value="connectors"
            className="sm:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
          >
            <Network className="h-4 w-4" /> Connectors ({groups.connectors.length})
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-blue-500" />

          <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
              <Wrench className="h-4 w-4 text-emerald-500" /> Tool Matrix
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 flex-1 bg-background/30">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-[24px] border-2 border-border/20 bg-muted/20" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="internal" className="mt-0 outline-none">
                  <div className="grid gap-4">{groups.internal.map(Row)}</div>
                  {groups.internal.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px]">
                      <Braces className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        No internal tools registered. Run discovery protocol.
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skills" className="mt-0 outline-none">
                  <div className="grid gap-4">{groups.skills.map(Row)}</div>
                  {groups.skills.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px]">
                      <Cpu className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        No native skills mapped.
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="connectors" className="mt-0 outline-none">
                  <div className="grid gap-4">{groups.connectors.map(Row)}</div>
                  {groups.connectors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px]">
                      <Network className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        No external hooks detected.
                      </div>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Operational Trace Footer */}
      <footer className="mt-12 pt-8 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Agent OS: Action Engine</p>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
