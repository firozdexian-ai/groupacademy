import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

export function AgentChannelsTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("agent_channels").select("*").order("channel_key").then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="space-y-4 p-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" /> Channels & Triggers</h2>
        <p className="text-sm text-muted-foreground">Where agents fire — chat surfaces, feed, email replies, cron, webhooks.</p>
      </div>
      <Card className="divide-y">
        {rows.map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                {r.label}
                <span className="font-mono text-[10px] text-muted-foreground">{r.channel_key}</span>
              </div>
              <div className="text-xs text-muted-foreground">{r.description}</div>
            </div>
            <div className="flex items-center gap-2">
              {r.direction && <Badge variant="outline" className="text-[10px]">{r.direction}</Badge>}
              <Badge variant={r.is_active ? "default" : "secondary"} className="text-[10px]">
                {r.is_active ? "active" : "off"}
              </Badge>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No channels yet.</div>}
      </Card>
    </div>
  );
}
