import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listAllAgentTools } from "@/domains/agents/repo/agentsRepo";
import { Plug, Wrench, Network, Braces, Cpu } from "lucide-react";
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
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 hover:border-border transition-all group shadow-sm"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
            {t.name}
          </h3>
          <span className="font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/60 shrink-0">
            {t.tool_key}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {t.description || "No description provided for this tool configuration."}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap shrink-0 sm:justify-end">
        {t.category && (
          <Badge
            variant="outline"
            className="rounded border font-medium text-[10px] tracking-wide bg-background text-muted-foreground px-2 py-0.5"
          >
            {t.category}
          </Badge>
        )}
        {t.connector_id && (
          <Badge
            variant="outline"
            className="rounded border font-mono text-[10px] bg-blue-500/[0.02] text-blue-600 border-blue-500/20 px-2 py-0.5"
          >
            {t.connector_id}
          </Badge>
        )}
        <Badge
          className={cn(
            "rounded font-medium text-[10px] tracking-wide px-2 py-0.5 border-none",
            t.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground/50",
          )}
        >
          {t.status ? t.status.toLowerCase() : t.is_active ? "active" : "offline"}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Configuration Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Plug className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Integrations & Functions</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Review background edge functions, composite workspace skills, and external third-party communication
            webhooks.
          </p>
        </div>
      </header>

      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="bg-muted/40 p-1 mb-6 rounded-xl border flex flex-col sm:flex-row h-auto w-full sm:w-fit gap-1">
          <TabsTrigger
            value="internal"
            className="rounded-lg font-semibold text-xs py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Braces className="h-3.5 w-3.5" /> Internal Functions ({groups.internal.length})
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="rounded-lg font-semibold text-xs py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Cpu className="h-3.5 w-3.5" /> Composite Skills ({groups.skills.length})
          </TabsTrigger>
          <TabsTrigger
            value="connectors"
            className="rounded-lg font-semibold text-xs py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Network className="h-3.5 w-3.5" /> External Connectors ({groups.connectors.length})
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-2xl border border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-xl flex flex-col">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-primary to-blue-500 rounded-t-2xl" />

          <CardHeader className="p-4 border-b border-border/40 bg-muted/5">
            <CardTitle className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 text-primary" /> Global Integration Matrix
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 flex-1 bg-background/20">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/20" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="internal" className="mt-0 outline-none">
                  <div className="grid gap-3">{groups.internal.map(Row)}</div>
                  {groups.internal.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-background/40 border border-dashed rounded-xl">
                      <Braces className="h-6 w-6 text-muted-foreground/40 mb-2" />
                      <div className="text-center text-xs text-muted-foreground">
                        No internal background tools are currently mapped to this module instance.
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skills" className="mt-0 outline-none">
                  <div className="grid gap-3">{groups.skills.map(Row)}</div>
                  {groups.skills.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-background/40 border border-dashed rounded-xl">
                      <Cpu className="h-6 w-6 text-muted-foreground/40 mb-2" />
                      <div className="text-center text-xs text-muted-foreground">
                        No advanced automated composite skills mapped to this environment.
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="connectors" className="mt-0 outline-none">
                  <div className="grid gap-3">{groups.connectors.map(Row)}</div>
                  {groups.connectors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-background/40 border border-dashed rounded-xl">
                      <Network className="h-6 w-6 text-muted-foreground/40 mb-2" />
                      <div className="text-center text-xs text-muted-foreground">
                        No active external webhook integrations or sync pipelines discovered.
                      </div>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
