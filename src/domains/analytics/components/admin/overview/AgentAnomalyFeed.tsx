/**
 * Agent Anomaly Feed — Executive HUD Component
 * CTO Refactor: May 2026
 * Fixes: F2 (Replaced Mock with real platform_events query)
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, Target, ArrowUpRight, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PlatformEvent {
  id: string;
  severity: "critical" | "warning" | "opportunity" | "info";
  agent_key: string;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
}

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  opportunity: { icon: Target, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  info: { icon: Bot, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export function AgentAnomalyFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("vw_agent_anomalies" as any)
        .select("id, severity, agent_key, title, description, created_at")
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!cancelled && !error && data) {
        setEvents(data as unknown as PlatformEvent[]);
      }
      if (!cancelled) setIsLoading(false);
    };

    fetchEvents();

    // Real-time: refetch whenever a new platform_event lands
    const channel = supabase
      .channel("platform-anomalies")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "platform_events" },
        () => fetchEvents(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="rounded-[40px] border-2 border-primary/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full relative">
      {/* Active Pulse for Critical Alerts */}
      {events.some((e) => e.severity === "critical") && (
        <div className="absolute top-0 right-0 p-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
        </div>
      )}

      <div className="h-1.5 w-full bg-gradient-to-r from-destructive via-orange-500 to-primary" />

      <CardHeader className="p-8 pb-4 border-b border-border/10 bg-muted/10">
        <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Bot className="h-5 w-5 text-primary" /> Agent Anomaly Feed
        </CardTitle>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
          Triaging automated interventions
        </p>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border/10 flex-1 overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Scanning Agents...</p>
            </div>
          ) : events.length > 0 ? (
            events.map((event) => {
              const config = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;

              return (
                <div key={event.id} className="p-6 hover:bg-muted/10 transition-colors group">
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border-2",
                        config.bg,
                        config.border,
                        config.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{event.title}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at))} ago
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed">{event.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                          {event.agent_key.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-primary/40" />
              <p className="text-[10px] font-black uppercase tracking-widest">All agents nominal — 24h clear</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/5 mt-auto border-t border-border/10">
          <Button
            onClick={() => navigate("/dashboard/chat")}
            className="w-full h-12 rounded-xl justify-between font-black uppercase text-[10px] tracking-[0.2em] px-6 shadow-lg hover:shadow-primary/20 transition-all"
          >
            Enter Agent OS Chat <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
