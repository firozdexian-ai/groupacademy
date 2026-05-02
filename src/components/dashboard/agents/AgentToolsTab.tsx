import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plug } from "lucide-react";

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
  useEffect(() => {
    supabase.from("agent_tools").select("*").order("handler_kind").order("name")
      .then(({ data }) => setTools((data ?? []) as Tool[]));
  }, []);

  const groups = useMemo(() => ({
    internal: tools.filter((t) => ["edge_function", "rpc", "internal"].includes(t.handler_kind)),
    skills: tools.filter((t) => t.handler_kind === "skill"),
    connectors: tools.filter((t) => t.handler_kind === "connector"),
  }), [tools]);

  const Row = (t: Tool) => (
    <div key={t.id} className="p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium text-sm truncate">
          {t.name} <span className="font-mono text-[10px] text-muted-foreground">{t.tool_key}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{t.description}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
        {t.connector_id && <Badge variant="outline" className="text-[10px] font-mono">{t.connector_id}</Badge>}
        <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
          {t.status ?? (t.is_active ? "available" : "off")}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Plug className="h-6 w-6" /> Tools, Skills & Connectors</h2>
        <p className="text-sm text-muted-foreground">
          Capabilities every agent can call — internal edge functions, reusable skills, and external connectors from the Lovable ecosystem.
        </p>
      </div>
      <Tabs defaultValue="internal">
        <TabsList>
          <TabsTrigger value="internal">Internal Tools ({groups.internal.length})</TabsTrigger>
          <TabsTrigger value="skills">Skills ({groups.skills.length})</TabsTrigger>
          <TabsTrigger value="connectors">External Connectors ({groups.connectors.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="internal">
          <Card className="divide-y">
            {groups.internal.map(Row)}
            {groups.internal.length === 0 && <div className="p-6 text-sm text-muted-foreground">
              No internal tools registered yet. Run the discovery function to auto-import edge functions.
            </div>}
          </Card>
        </TabsContent>
        <TabsContent value="skills">
          <Card className="divide-y">{groups.skills.map(Row)}</Card>
        </TabsContent>
        <TabsContent value="connectors">
          <Card className="divide-y">{groups.connectors.map(Row)}</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
