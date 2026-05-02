import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    let q = supabase.from("ai_agents").select(
      "id,agent_key,name,description,agent_type,audience,visibility,is_active,total_conversations,credit_cost,message_credit_cost,model"
    ).order("total_conversations", { ascending: false }).limit(200);
    if (agentTypeFilter) {
      if (Array.isArray(agentTypeFilter)) q = q.in("agent_type", agentTypeFilter);
      else q = q.eq("agent_type", agentTypeFilter);
    }
    if (audienceFilter) q = q.eq("audience", audienceFilter);
    q.then(({ data }) => setRows(data ?? []));
  }, [agentTypeFilter, audienceFilter]);

  const filtered = rows.filter((r) =>
    !search || (r.name + " " + r.agent_key).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 p-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Icon className="h-6 w-6" /> {title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Input placeholder="Search agents…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <Card className="divide-y">
        {filtered.map((a) => (
          <div key={a.id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                {a.name}
                <span className="font-mono text-[10px] text-muted-foreground">{a.agent_key}</span>
                {a.model && <Badge variant="outline" className="text-[10px] font-mono">{a.model}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">{a.description}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {a.audience && <Badge variant="outline" className="text-[10px]">{a.audience}</Badge>}
              {a.visibility && <Badge variant="outline" className="text-[10px]">{a.visibility}</Badge>}
              <Badge variant="secondary" className="text-[10px]">{a.total_conversations ?? 0} runs</Badge>
              <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">
                {a.is_active ? "active" : "off"}
              </Badge>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">{emptyHint ?? "No agents match this filter yet."}</div>
        )}
      </Card>
    </div>
  );
}
